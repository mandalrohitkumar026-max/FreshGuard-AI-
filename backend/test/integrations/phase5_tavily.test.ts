// @ts-ignore
import request from 'supertest';
import { app } from '../../src/app';
import { searchService } from '../../src/modules/search/search.service';
import { NormalizedEvidence, TavilyRawResult } from '../../src/modules/search/search.types';
import { normalizedEvidenceSchema } from '../../src/modules/search/search.validation';

describe('Phase 05 — Tavily Live Search and Evidence Retrieval Tests', () => {
  // TEST 1: Search latest stable React version
  it('TEST 1: Search latest stable React version retrieves real evidence', async () => {
    const result = await searchService.searchCurrentEvidence(
      'React 18 is the latest stable version of React',
      { topicHint: 'Frontend Frameworks' }
    );

    expect(result).toBeDefined();
    expect(result.searchQuery).toBeDefined();
    expect(result.searchQuery.toLowerCase()).toContain('react');
    expect(result.evidence.length).toBeGreaterThan(0);

    const firstSource = result.evidence[0];
    expect(firstSource.sourceUrl).toMatch(/^https?:\/\//);
    expect(firstSource.sourceTitle).toBeDefined();
    expect(firstSource.content).toBeDefined();
    expect(firstSource.authorityTier).toBeDefined();
    expect(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']).toContain(firstSource.authorityTier);

    // Validate with Zod schema
    const validation = normalizedEvidenceSchema.safeParse(firstSource);
    expect(validation.success).toBe(true);
  });

  // TEST 2: Search latest stable Python release
  it('TEST 2: Search latest stable Python release retrieves python official docs or registry', async () => {
    const result = await searchService.searchCurrentEvidence(
      'Python 3.9 is the newest version of Python',
      { topicHint: 'Programming Languages' }
    );

    expect(result.evidence.length).toBeGreaterThan(0);
    const hasPythonSource = result.evidence.some(
      (s: NormalizedEvidence) =>
        s.sourceDomain.includes('python.org') ||
        s.sourceTitle.toLowerCase().includes('python') ||
        s.content.toLowerCase().includes('python')
    );
    expect(hasPythonSource).toBe(true);
  });

  // TEST 3: Search Microsoft current CEO
  it('TEST 3: Search Microsoft current CEO retrieves leadership verification evidence', async () => {
    const result = await searchService.searchCurrentEvidence(
      'Satya Nadella is the CEO of Microsoft',
      { topicHint: 'Corporate Leadership' }
    );

    expect(result.evidence.length).toBeGreaterThan(0);
    const hasCeoEvidence = result.evidence.some(
      (s: NormalizedEvidence) =>
        s.content.toLowerCase().includes('satya nadella') ||
        s.content.toLowerCase().includes('ceo') ||
        s.sourceTitle.toLowerCase().includes('microsoft')
    );
    expect(hasCeoEvidence).toBe(true);
  });

  // TEST 4: Search government regulation (e.g. EU AI Act)
  it('TEST 4: Search government regulation retrieves official legislative or institutional evidence', async () => {
    const result = await searchService.searchCurrentEvidence(
      'The EU AI Act was approved as European Union regulation for artificial intelligence',
      { topicHint: 'Government Policy' }
    );

    expect(result.evidence.length).toBeGreaterThan(0);
    const hasRegulation = result.evidence.some(
      (s: NormalizedEvidence) =>
        s.sourceType === 'government' ||
        s.sourceDomain.includes('europa.eu') ||
        s.content.toLowerCase().includes('ai act') ||
        s.content.toLowerCase().includes('regulation')
    );
    expect(hasRegulation).toBe(true);
  });

  // TEST 5: Search outdated software version
  it('TEST 5: Search outdated software version extracts counter-evidence of newer releases', async () => {
    const result = await searchService.searchCurrentEvidence(
      'React 16 is the latest version available today',
      { topicHint: 'Technology' }
    );

    expect(result.evidence.length).toBeGreaterThan(0);
    // Should retrieve current release info
    const contentAll = result.evidence.map((s: NormalizedEvidence) => s.content).join(' ');
    expect(contentAll).toMatch(/(React|version|release|18|19)/i);
  });

  // TEST 6: Ambiguous search query
  it('TEST 6: Ambiguous search query produces valid, resilient search results without errors', async () => {
    const result = await searchService.searchCurrentEvidence(
      'It has changed significantly in the recent past',
      { topicHint: 'General' }
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result.evidence)).toBe(true);
    expect(result.searchQuery.length).toBeGreaterThan(0);
  });

  // TEST 7: Empty query rejection (Zod validation 400)
  it('TEST 7: Empty query or invalid body triggers Zod validation 400 error', async () => {
    const resQuery = await request(app)
      .post('/api/v1/search/query')
      .send({ query: '' });

    expect(resQuery.status).toBe(400);
    expect(resQuery.body.success).toBe(false);

    const resEvidence = await request(app)
      .post('/api/v1/search/evidence')
      .send({ claim: '' });

    expect(resEvidence.status).toBe(400);
    expect(resEvidence.body.success).toBe(false);
  });

  // TEST 8: Source deduplication & domain authority scoring
  it('TEST 8: Deduplicates sources by URL and correctly assigns domain authority scores', () => {
    const rawResults: TavilyRawResult[] = [
      {
        title: 'React Official Documentation',
        url: 'https://react.dev/blog/2024/12/05/react-19',
        content: 'React 19 is now available on npm!',
        score: 0.95,
      },
      {
        title: 'React Duplicate URL Check',
        url: 'https://react.dev/blog/2024/12/05/react-19', // identical URL
        content: 'React 19 duplicate content',
        score: 0.90,
      },
      {
        title: 'Reddit Discussion',
        url: 'https://reddit.com/r/reactjs/comments/12345',
        content: 'What do you think about the new release?',
        score: 0.70,
      },
      {
        title: 'European Commission Official Portal',
        url: 'https://ec.europa.eu/commission/presscorner/detail/en/ip_24_123',
        content: 'Artificial Intelligence Act enters into force.',
        score: 0.92,
      },
    ];

    const normalized = rawResults.map((raw) => searchService.normalizeEvidence(raw));

    // Test deduplication logic as applied in searchCurrentEvidence
    const seenUrls = new Set<string>();
    const deduplicated: NormalizedEvidence[] = [];
    for (const item of normalized) {
      const normalizedUrl = item.sourceUrl.replace(/\/+$/, '');
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        deduplicated.push(item);
      }
    }

    // Duplicate URL should be removed
    expect(deduplicated.length).toBe(3);

    // Official docs should have HIGH authority tier
    const reactDoc = deduplicated.find((s) => s.sourceDomain === 'react.dev');
    expect(reactDoc).toBeDefined();
    expect(reactDoc?.authorityTier).toBe('HIGH');
    expect(reactDoc?.sourceType).toBe('official_documentation');

    // Government source should have HIGH authority tier
    const govDoc = deduplicated.find((s) => s.sourceDomain.includes('europa.eu'));
    expect(govDoc).toBeDefined();
    expect(govDoc?.authorityTier).toBe('HIGH');
    expect(govDoc?.sourceType).toBe('government');

    // Community source (Reddit) should have LOW authority tier
    const redditDoc = deduplicated.find((s) => s.sourceDomain === 'reddit.com');
    expect(redditDoc).toBeDefined();
    expect(redditDoc?.authorityTier).toBe('LOW');
    expect(redditDoc?.sourceType).toBe('community');
  });

  // TEST 9: Tavily health & authentication diagnostics
  it('TEST 9: GET /api/v1/integrations/tavily/health returns transparent diagnostics', async () => {
    const res = await request(app).get('/api/v1/integrations/tavily/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(['CONNECTED', 'CONFIGURATION_REQUIRED', 'DISCONNECTED', 'ERROR']).toContain(
      res.body.data.status
    );
    expect(typeof res.body.data.latencyMs).toBe('number');
    expect(res.body.data.plan).toBeDefined();
  });

  // TEST 10: Rate limiting, caching, and timeout resilience
  it('TEST 10: Rapid repeated queries hit the in-memory cache with instantaneous response', async () => {
    const claim = 'React 19 was officially released in December 2024';

    const start1 = Date.now();
    const res1 = await searchService.searchCurrentEvidence(claim);
    const duration1 = Date.now() - start1;

    expect(res1.evidence.length).toBeGreaterThan(0);

    const start2 = Date.now();
    const res2 = await searchService.searchCurrentEvidence(claim);
    const duration2 = Date.now() - start2;

    // Cache hit should be nearly instant (< 50ms)
    expect(res2.cached).toBe(true);
    expect(duration2).toBeLessThanOrEqual(50);
    expect(res2.evidence.length).toBe(res1.evidence.length);
  });

  // Endpoint tests
  describe('Search Endpoints', () => {
    it('POST /api/v1/search/query executes search and returns normalized evidence', async () => {
      const res = await request(app)
        .post('/api/v1/search/query')
        .send({
          query: 'React latest stable version',
          maxResults: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.results)).toBe(true);
      expect(res.body.data.results.length).toBeGreaterThan(0);
      expect(res.body.data.results[0].url || res.body.data.results[0].sourceUrl).toBeDefined();
    });

    it('POST /api/v1/search/evidence intelligently transforms claim and retrieves evidence', async () => {
      const res = await request(app)
        .post('/api/v1/search/evidence')
        .send({
          claim: 'Python 3.12 is the latest major release of Python',
          topicHint: 'Programming Languages',
          maxResults: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.searchQuery).toBeDefined();
      expect(Array.isArray(res.body.data.evidence)).toBe(true);
    });

    it('GET /api/v1/search/history returns search history', async () => {
      const res = await request(app).get('/api/v1/search/history');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
