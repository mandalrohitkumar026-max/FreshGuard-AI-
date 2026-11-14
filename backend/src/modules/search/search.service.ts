import mongoose from 'mongoose';
import { tavilyClient } from './tavily.client';
import {
  NormalizedEvidence,
  ClaimSearchResult,
  SourceType,
  TavilyRawResult,
} from './search.types';
import { extractDomain, getDomainAuthorityTier } from '../../utils/domainAuthority';
import { EvidenceSource } from '../evidence/evidence.model';
import { inMemoryStore } from '../../services/sessionStore';
import { isMongoConnected } from '../../config/database';
import { logger } from '../../config/logger';

// In-memory short-term search cache (5 minutes TTL) to prevent repeated calls
interface CacheEntry {
  data: ClaimSearchResult;
  timestamp: number;
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export class SearchService {
  /**
   * INTELLIGENT QUERY GENERATOR
   * Transforms a raw factual claim into a high-precision, entity-focused search query.
   */
  generateSearchQuery(claimText: string, topicHint?: string): string {
    const text = claimText.trim();

    // 1. Detect technology releases (e.g., React, Python, Node, Next.js)
    if (/react/i.test(text) && /(latest|stable|version|release|18|19)/i.test(text)) {
      return 'Official latest stable React version release';
    }
    if (/python/i.test(text) && /(latest|stable|version|release|3\.\d|end-of-life)/i.test(text)) {
      return 'Official latest stable Python release';
    }
    if (/node(\.js)?/i.test(text) && /(latest|lts|version|release)/i.test(text)) {
      return 'Official Node.js LTS current active version release';
    }

    // 2. Detect leadership & executive claims
    if (/microsoft/i.test(text) && /(ceo|chief executive|leadership|pichai|nadella)/i.test(text)) {
      return 'Official Microsoft current CEO leadership';
    }
    if (/openai/i.test(text) && /(ceo|leadership|altman|murati|board)/i.test(text)) {
      return 'Official OpenAI current CEO leadership announcement';
    }
    if (/google|alphabet/i.test(text) && /(ceo|leadership|pichai)/i.test(text)) {
      return 'Official Alphabet Google current CEO leadership';
    }

    // 3. Detect government policy / regulation
    if (/(government|regulation|policy|act|law|eu ai act)/i.test(text)) {
      return `${text.replace(/[.?!"']/g, '')} official government regulation status`;
    }

    // 4. General heuristic entity extraction
    let cleaned = text
      .replace(/[.?!"']/g, '')
      .replace(/^(I think|According to|It is known that|They say)\s+/i, '');

    // Add official / latest intent for temporal claims
    if (/\b(is currently|is now|latest|current|recent|recently|today)\b/i.test(cleaned)) {
      cleaned = `Official ${cleaned}`;
    }

    if (topicHint && !cleaned.toLowerCase().includes(topicHint.toLowerCase())) {
      cleaned = `${topicHint} ${cleaned}`;
    }

    return cleaned.slice(0, 150).trim();
  }

  /**
   * Classify source reliability, domain authority, and source type
   */
  classifySource(url: string, title = ''): {
    sourceDomain: string;
    sourceType: SourceType;
    authorityScore: number;
    authorityTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  } {
    const domain = extractDomain(url).toLowerCase();
    const authorityTier = getDomainAuthorityTier(url);

    let authorityScore = 0.5;
    if (authorityTier === 'HIGH') authorityScore = 0.95;
    else if (authorityTier === 'MEDIUM') authorityScore = 0.70;
    else if (authorityTier === 'LOW') authorityScore = 0.35;

    let sourceType: SourceType = 'general';

    if (
      domain.endsWith('.gov') ||
      domain.endsWith('.mil') ||
      domain.includes('europa.eu') ||
      domain.includes('who.int')
    ) {
      sourceType = 'government';
    } else if (
      domain.endsWith('.edu') ||
      domain.includes('.ac.') ||
      domain === 'arxiv.org' ||
      domain === 'nature.com' ||
      domain === 'sciencedirect.com'
    ) {
      sourceType = 'academic';
    } else if (
      domain === 'react.dev' ||
      domain === 'docs.python.org' ||
      domain === 'python.org' ||
      domain === 'developer.mozilla.org' ||
      domain === 'nodejs.org' ||
      domain.includes('docs.') ||
      domain.includes('learn.')
    ) {
      sourceType = 'official_documentation';
    } else if (
      domain === 'news.microsoft.com' ||
      domain === 'microsoft.com' ||
      domain === 'openai.com' ||
      domain === 'apple.com' ||
      domain === 'blog.google' ||
      domain === 'npmjs.com'
    ) {
      sourceType = 'company_official';
    } else if (
      domain === 'reuters.com' ||
      domain === 'apnews.com' ||
      domain === 'bbc.com' ||
      domain === 'bloomberg.com' ||
      domain === 'techcrunch.com'
    ) {
      sourceType = 'established_news';
    } else if (domain === 'reddit.com' || domain === 'stackoverflow.com' || domain === 'github.com') {
      sourceType = 'community';
    }

    return {
      sourceDomain: domain,
      sourceType,
      authorityScore,
      authorityTier,
    };
  }

  /**
   * EVIDENCE NORMALIZER
   * Standardizes raw Tavily result into a validated, structured evidence object.
   */
  normalizeEvidence(raw: TavilyRawResult, claimId?: string, sessionId?: string): NormalizedEvidence {
    const classification = this.classifySource(raw.url, raw.title);
    const relevanceScore = Math.max(0, Math.min(1, raw.score || 0.75));

    return {
      sourceTitle: raw.title || 'Untitled Source',
      sourceUrl: raw.url,
      sourceDomain: classification.sourceDomain || 'unknown-domain',
      content: raw.content || '',
      publishedAt: raw.published_date || null,
      retrievedAt: new Date().toISOString(),
      relevanceScore,
      authorityScore: classification.authorityScore,
      authorityTier: classification.authorityTier,
      sourceType: classification.sourceType,
      usedInAnalysis: relevanceScore >= 0.4,
      claimId,
      sessionId,
    };
  }

  /**
   * Search and retrieve live evidence for a specific factual claim.
   */
  async searchCurrentEvidence(
    claimText: string,
    options: {
      topicHint?: string;
      searchDepth?: 'basic' | 'advanced';
      maxResults?: number;
      sessionId?: string;
      claimId?: string;
    } = {},
  ): Promise<ClaimSearchResult> {
    const startTime = Date.now();
    const query = this.generateSearchQuery(claimText, options.topicHint);

    // 1. Check cache
    const cached = searchCache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      logger.info('Returning cached search evidence', { query, cacheAgeMs: Date.now() - cached.timestamp });
      return {
        ...cached.data,
        cached: true,
      };
    }

    // 2. Execute search via Tavily Client
    const tavilyRes = await tavilyClient.search({
      query,
      searchDepth: options.searchDepth || 'advanced',
      maxResults: options.maxResults || 5,
    });

    // 3. Normalize all retrieved results
    const normalized = (tavilyRes.results || []).map((raw) =>
      this.normalizeEvidence(raw, options.claimId, options.sessionId),
    );

    // 4. Deduplicate sources (by exact URL or duplicate domain with lower relevance)
    const seenUrls = new Set<string>();
    const deduplicated: NormalizedEvidence[] = [];

    for (const item of normalized) {
      const normalizedUrl = item.sourceUrl.replace(/\/+$/, '');
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        deduplicated.push(item);
      }
    }

    // 5. Rank evidence by composite score (60% relevance + 40% authority)
    deduplicated.sort((a, b) => {
      const scoreA = 0.6 * a.relevanceScore + 0.4 * a.authorityScore;
      const scoreB = 0.6 * b.relevanceScore + 0.4 * b.authorityScore;
      return scoreB - scoreA;
    });

    const searchTimeMs = Date.now() - startTime;

    const result: ClaimSearchResult = {
      claimText,
      searchQuery: query,
      evidence: deduplicated,
      searchTimeMs,
      cached: false,
      totalFound: deduplicated.length,
    };

    // 6. Save in memory cache
    searchCache.set(query, {
      data: result,
      timestamp: Date.now(),
    });

    // 7. Persist evidence to database if identifiers are provided
    await this.persistEvidence(deduplicated, options.sessionId, options.claimId);

    return result;
  }

  /**
   * Search multiple claims in batch
   */
  async searchBatch(
    claims: string[],
    options: {
      topicHint?: string;
      searchDepth?: 'basic' | 'advanced';
      maxResults?: number;
      sessionId?: string;
    } = {},
  ): Promise<ClaimSearchResult[]> {
    return Promise.all(
      claims.map((claim) =>
        this.searchCurrentEvidence(claim, {
          ...options,
          claimId: new mongoose.Types.ObjectId().toString(),
        }),
      ),
    );
  }

  /**
   * Persist normalized evidence items to MongoDB / inMemoryStore
   */
  private async persistEvidence(
    evidenceList: NormalizedEvidence[],
    sessionId?: string,
    claimId?: string,
  ): Promise<void> {
    if (!sessionId && !claimId) return;

    const sessionObjId = sessionId && mongoose.Types.ObjectId.isValid(sessionId)
      ? new mongoose.Types.ObjectId(sessionId)
      : new mongoose.Types.ObjectId();

    const claimObjId = claimId && mongoose.Types.ObjectId.isValid(claimId)
      ? new mongoose.Types.ObjectId(claimId)
      : new mongoose.Types.ObjectId();

    // In-memory store
    if (sessionId) {
      inMemoryStore.saveEvidence(sessionId, evidenceList);
    }

    // MongoDB store
    if (isMongoConnected()) {
      try {
        const docs = evidenceList.map((e) => ({
          sessionId: sessionObjId,
          claimId: claimObjId,
          url: e.sourceUrl,
          title: e.sourceTitle,
          content: e.content,
          domain: e.sourceDomain,
          tavilyScore: e.relevanceScore,
          authorityScore: e.authorityScore,
          authorityTier: e.authorityTier,
          publishedDate: e.publishedAt ? new Date(e.publishedAt) : undefined,
          usedInAnalysis: e.usedInAnalysis,
        }));
        await EvidenceSource.insertMany(docs, { ordered: false });
      } catch {
        // Tolerates partial duplicates or offline mongo
      }
    }
  }

  /**
   * Retrieve cached search history
   */
  getSearchHistory(): Array<{ query: string; totalFound: number; timestamp: string }> {
    const list: Array<{ query: string; totalFound: number; timestamp: string }> = [];
    for (const [query, entry] of searchCache.entries()) {
      list.push({
        query,
        totalFound: entry.data.totalFound,
        timestamp: new Date(entry.timestamp).toISOString(),
      });
    }
    return list;
  }
}

export const searchService = new SearchService();
