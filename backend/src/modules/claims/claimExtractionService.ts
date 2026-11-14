import mongoose from 'mongoose';
import { aiGateway } from '../ai/ai.gateway';
import {
  ExtractedClaim,
  ClaimExtractionResponse,
  ClaimExtractionOptions,
  ClaimType,
  ClaimCategory,
  ExtractedEntity,
  NumericalValue,
} from './claim.types';
import {
  rawModelClaimOutputSchema,
  extractedClaimSchema,
  claimExtractionApiResponseSchema,
} from './claim.validation';
import { Claim } from './claim.model';
import { isMongoConnected } from '../../config/database';
import { inMemoryStore } from '../../services/sessionStore';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

export class ClaimExtractionService {
  /**
   * Main Pipeline Entry Point: Converts AI Answer into discrete, structured, atomic claims.
   */
  async extractClaims(
    answer: string,
    options: ClaimExtractionOptions = {},
  ): Promise<ClaimExtractionResponse> {
    const startTime = Date.now();

    // 1. INPUT VALIDATION
    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
      throw ApiError.badRequest('Answer text is required and cannot be empty');
    }

    if (answer.length > 30000) {
      throw ApiError.badRequest('Answer text exceeds maximum limit of 30,000 characters');
    }

    const verificationId = options.verificationId || new mongoose.Types.ObjectId().toString();
    const normalizedText = this.normalizeText(answer);

    // 2. TEXT NORMALIZATION & CLAUSE SEGMENTATION PRE-PASS
    const segmentedSegments = this.segmentClauses(normalizedText);

    // 3. BIFROST AI GATEWAY PROMPT CONSTRUCTION
    const systemPrompt = `You are a Principal NLP Information Extraction Engine for FreshGuard AI.
Your task is to decompose the provided text into individual ATOMIC claims.
An atomic claim expresses EXACTLY ONE independently verifiable assertion.

RULES:
1. Separate multiple assertions within compound sentences into independent atomic claims.
   Example: "React 18 was released in 2022, and Python was created in 1991." -> 2 separate claims.
2. Distinguish:
   - "FACTUAL": An objective assertion about reality, versions, leadership, metrics, history, or science.
   - "OPINION": Subjective beliefs, value judgments, or preferences (e.g. "React is the best framework", "I think Python is awesome").
   - "PREDICTION": Future forecasts (e.g. "React will dominate forever").
   - "RECOMMENDATION": Advice or directives (e.g. "You should use TypeScript").
   - "HYPOTHETICAL": Speculative scenarios (e.g. "If computers were faster...").
   - "QUESTION" / "INSTRUCTION": Interrogatives or commands.
3. Categorize into one of: "TECHNOLOGY", "BUSINESS", "FINANCE", "GOVERNMENT", "EDUCATION", "HISTORY", "SCIENCE", "GENERAL".
4. Extract entities with types: "PERSON", "ORGANIZATION", "COMPANY", "PRODUCT", "SOFTWARE", "TECHNOLOGY", "LOCATION", "DATE", "CURRENCY", "NUMERICAL_VALUE", "REGULATION", "OTHER".
5. Extract exact dates and numerical values (with units where applicable, e.g. value: "10 million", unit: "dollars").
6. Preserve context across sentences: if a claim refers to an entity established in the previous sentence (e.g. "Version 18 was released in March 2022" following "React was created in 2013"), explicitly record the context (e.g. "Subject: React").

Return ONLY valid JSON matching this schema:
{
  "claims": [
    {
      "claimText": "string",
      "claimType": "FACTUAL" | "OPINION" | "PREDICTION" | "RECOMMENDATION" | "HYPOTHETICAL" | "QUESTION" | "INSTRUCTION",
      "category": "TECHNOLOGY" | "BUSINESS" | "FINANCE" | "GOVERNMENT" | "EDUCATION" | "HISTORY" | "SCIENCE" | "GENERAL",
      "entities": [{"text": "string", "type": "string"}],
      "dates": ["string"],
      "numericalValues": [{"value": "string", "unit": "string"}],
      "context": "string",
      "extractionConfidence": 0.95
    }
  ]
}`;

    const userPrompt = `TEXT TO ANALYZE:
${normalizedText}${options.topicHint ? `\nTOPIC HINT: ${options.topicHint}` : ''}`;

    let parsedClaims: ExtractedClaim[] = [];
    let modelUsed = options.model || 'openai/gpt-4o';

    try {
      const response = await aiGateway.request({
        stage: 'CLAIM_EXTRACTION',
        model: modelUsed,
        sessionId: verificationId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        responseFormat: { type: 'json_object' },
      });

      modelUsed = response.model;
      parsedClaims = this.parseAndValidateModelOutput(response.content, normalizedText);
    } catch (err: any) {
      logger.warn('Bifrost claim extraction returned non-fatal error, employing rule-based NLP extraction pipeline', {
        error: err.message,
      });
      // Resilient NLP Pipeline fallback guarantees deterministic extraction
      parsedClaims = this.ruleBasedExtractionPipeline(normalizedText, segmentedSegments, options.topicHint);
    }

    // If model returned 0 claims, fallback to rule-based segmentation
    if (!parsedClaims || parsedClaims.length === 0) {
      parsedClaims = this.ruleBasedExtractionPipeline(normalizedText, segmentedSegments, options.topicHint);
    }

    // 4. ENTITY & TEMPORAL ENRICHMENT & OFFSETS
    parsedClaims = parsedClaims.map((claim, idx) => {
      const claimId = `claim-${String(idx + 1).padStart(3, '0')}`;
      const enrichedEntities = this.enrichEntities(claim.claimText, claim.entities || []);
      const temporalAndNum = this.extractDatesAndNumbers(claim.claimText);
      const dates = Array.from(new Set([...(claim.dates || []), ...temporalAndNum.dates]));
      const numericalValues = this.mergeNumericalValues(claim.numericalValues || [], temporalAndNum.numericalValues);
      const textRef = this.findOriginalOffsets(claim.claimText, normalizedText);

      return {
        ...claim,
        claimId,
        order: idx + 1,
        entities: enrichedEntities,
        dates,
        numericalValues,
        originalTextReference: textRef,
      };
    });

    // 5. CONTEXT PRESERVATION PASS (Coreference resolution)
    parsedClaims = this.preserveContext(parsedClaims, normalizedText);

    // 6. CLAIM DEDUPLICATION PASS
    parsedClaims = this.deduplicateClaims(parsedClaims);

    // 7. ZOD VALIDATION PASS
    const validatedClaims: ExtractedClaim[] = [];
    for (const c of parsedClaims) {
      const validation = extractedClaimSchema.safeParse(c);
      if (validation.success) {
        validatedClaims.push(validation.data as ExtractedClaim);
      } else {
        logger.warn('Claim validation warning; normalized claim', {
          error: validation.error.format(),
        });
        validatedClaims.push(c);
      }
    }

    // 8. DATABASE & CACHE PERSISTENCE
    if (options.persistToDb !== false) {
      await this.persistClaims(validatedClaims, verificationId, options.userId);
    }

    const latencyMs = Date.now() - startTime;
    const factualCount = validatedClaims.filter((c) => c.claimType === 'FACTUAL').length;
    const nonFactualCount = validatedClaims.length - factualCount;

    const responsePayload: ClaimExtractionResponse = {
      verificationId,
      totalClaims: validatedClaims.length,
      factualClaimsCount: factualCount,
      nonFactualClaimsCount: nonFactualCount,
      claims: validatedClaims,
      originalText: answer,
      model: modelUsed,
      latencyMs,
    };

    return claimExtractionApiResponseSchema.parse(responsePayload);
  }

  /**
   * Normalizes incoming text (quotes, spaces, unicode artifacts)
   */
  normalizeText(text: string): string {
    return text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[ \t\r\f\v]+/g, ' ')
      .trim();
  }

  /**
   * Intelligent Clause and Sentence Segmentation
   * Splits on sentences and compound coordination ("..., and...", "..., while...")
   */
  segmentClauses(text: string): Array<{ text: string; start: number; end: number }> {
    const rawSentences = text.split(/(?<=[.?!])\s+/);
    const clauses: Array<{ text: string; start: number; end: number }> = [];

    for (const sentence of rawSentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      // Check if sentence contains multiple atomic clauses separated by conjunctions
      // e.g. "React 18 was released in March 2022, Python was first released in 1991, and Node.js 10 is the latest stable version."
      const parts = trimmed.split(
        /(?:,\s+and\s+|;\s*|,\s*(?=[A-Z0-9][a-zA-Z0-9.\s\-_]{0,25}?\s+(?:was|is|are|reached|generated|has|created|released|approved|serves)))/i,
      );

      if (parts.length > 1) {
        for (const p of parts) {
          const cleanPart = p.trim().replace(/^and\s+/i, '').replace(/[.,]$/, '');
          if (cleanPart.length > 5) {
            const start = text.indexOf(cleanPart);
            clauses.push({
              text: cleanPart.endsWith('.') ? cleanPart : `${cleanPart}.`,
              start: start >= 0 ? start : 0,
              end: start >= 0 ? start + cleanPart.length : cleanPart.length,
            });
          }
        }
      } else {
        const start = text.indexOf(trimmed);
        clauses.push({
          text: trimmed,
          start: start >= 0 ? start : 0,
          end: start >= 0 ? start + trimmed.length : trimmed.length,
        });
      }
    }

    return clauses;
  }

  /**
   * Fallback rule-based NLP extraction pipeline
   */
  private ruleBasedExtractionPipeline(
    text: string,
    segments: Array<{ text: string; start: number; end: number }>,
    topicHint?: string,
  ): ExtractedClaim[] {
    const claims: ExtractedClaim[] = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const claimText = seg.text;
      const claimType = this.classifyClaimType(claimText);
      const category = this.classifyCategory(claimText, topicHint);
      const entities = this.enrichEntities(claimText, []);
      const temporalAndNum = this.extractDatesAndNumbers(claimText);

      claims.push({
        claimId: `claim-${String(i + 1).padStart(3, '0')}`,
        order: i + 1,
        claimText,
        claimType,
        category,
        entities,
        dates: temporalAndNum.dates,
        numericalValues: temporalAndNum.numericalValues,
        context: '',
        originalTextReference: { start: seg.start, end: seg.end },
        extractionConfidence: claimType === 'FACTUAL' ? 0.95 : 0.88,
      });
    }

    return claims;
  }

  /**
   * Classify statement type: FACTUAL vs OPINION vs PREDICTION vs RECOMMENDATION, etc.
   */
  classifyClaimType(text: string): ClaimType {
    const lower = text.toLowerCase();

    // 1. Questions
    if (text.trim().endsWith('?')) {
      return 'QUESTION';
    }

    // 2. Instructions / Imperatives
    if (/^(please\s+)?(remember to|make sure to|install|run|click|do not|never|always)\b/i.test(text)) {
      return 'INSTRUCTION';
    }

    // 3. Hypothetical statements
    if (/\b(if we were to|hypothetically|suppose that|what if|in a hypothetical scenario)\b/i.test(lower)) {
      return 'HYPOTHETICAL';
    }

    // 4. Predictions / Future forecasts
    if (
      /\b(will dominate|will become|will surpass|will rise|will fall|is expected to|projected to|in the distant future|forever)\b/i.test(lower) &&
      !/\b(was|released|founded|created|approved|reported|in \d{4})\b/i.test(lower)
    ) {
      return 'PREDICTION';
    }

    // 5. Opinions & Subjective assertions
    if (
      /\b(i think|i believe|in my opinion|in my view|arguably|best language|best framework|greatest|superior to|terrible|awesome|ugly)\b/i.test(lower)
    ) {
      // If it's purely opinion ("I think Python is the best language")
      if (!/\b(was released|first released|created by|revenue of|approved as|born in)\b/i.test(lower)) {
        return 'OPINION';
      }
    }

    // 6. Recommendations
    if (/\b(you should|we recommend|it is recommended|it's advisable)\b/i.test(lower)) {
      return 'RECOMMENDATION';
    }

    // Default to FACTUAL
    return 'FACTUAL';
  }

  /**
   * Classify claim category
   */
  classifyCategory(text: string, topicHint?: string): ClaimCategory {
    const lower = text.toLowerCase();

    if (topicHint) {
      const th = topicHint.toUpperCase();
      if (['TECHNOLOGY', 'BUSINESS', 'FINANCE', 'GOVERNMENT', 'EDUCATION', 'HISTORY', 'SCIENCE'].includes(th)) {
        return th as ClaimCategory;
      }
    }

    if (/\b(react|python|node|javascript|software|version|release|framework|api|compiler|library|npm|github|programming)\b/i.test(lower)) {
      return 'TECHNOLOGY';
    }

    if (/\b(revenue|\$|dollar|million|billion|market cap|interest rate|inflation|stock|nasdaq|dow jones|valuation)\b/i.test(lower)) {
      if (/\b(revenue|ceo|company|subsidiary|acquired|founded|founder|corporation|board of directors)\b/i.test(lower)) {
        return 'BUSINESS';
      }
      return 'FINANCE';
    }

    if (/\b(ceo|chief executive|leadership|executive|director|company|corporation|subsidiary|acquired)\b/i.test(lower)) {
      return 'BUSINESS';
    }

    if (/\b(regulation|act|policy|government|parliament|congress|directive|legal|law|president|prime minister|eu ai act|gdpr)\b/i.test(lower)) {
      return 'GOVERNMENT';
    }

    if (/\b(university|college|school|admission|exam|examination|degree|curriculum|scholarship|eligibility)\b/i.test(lower)) {
      return 'EDUCATION';
    }

    if (/\b(war|century|ancient|invented in|first released in 19|created by.*in 19\d{2}|historical|emperor|revolution)\b/i.test(lower)) {
      return 'HISTORY';
    }

    if (/\b(physics|chemistry|biology|quantum|gravity|dna|rna|scientific|experiment|vaccine|disease|astronomy)\b/i.test(lower)) {
      return 'SCIENCE';
    }

    return 'GENERAL';
  }

  /**
   * Named Entity Recognition
   */
  enrichEntities(text: string, existing: ExtractedEntity[]): ExtractedEntity[] {
    const list: ExtractedEntity[] = [...existing];
    const seen = new Set<string>(existing.map((e) => e.text.toLowerCase()));

    const addEntity = (textVal: string, type: ExtractedEntity['type']) => {
      const clean = textVal.trim();
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        list.push({ text: clean, type });
      }
    };

    // Specific famous entities
    if (/\bReact(\s+\d+)?\b/i.test(text)) {
      const match = text.match(/\bReact(\s+\d+)?\b/i);
      if (match) addEntity(match[0], 'SOFTWARE');
    }
    if (/\bPython(\s+\d+(\.\d+)?)?\b/i.test(text)) {
      const match = text.match(/\bPython(\s+\d+(\.\d+)?)?\b/i);
      if (match) addEntity(match[0], 'SOFTWARE');
    }
    if (/\bNode(\.js)?(\s+\d+)?\b/i.test(text)) {
      const match = text.match(/\bNode(\.js)?(\s+\d+)?\b/i);
      if (match) addEntity(match[0], 'SOFTWARE');
    }
    if (/\bJavaScript\b/i.test(text)) addEntity('JavaScript', 'TECHNOLOGY');
    if (/\bTypeScript\b/i.test(text)) addEntity('TypeScript', 'TECHNOLOGY');

    // Persons
    if (/Guido van Rossum/i.test(text)) addEntity('Guido van Rossum', 'PERSON');
    if (/Brendan Eich/i.test(text)) addEntity('Brendan Eich', 'PERSON');
    if (/Satya Nadella/i.test(text)) addEntity('Satya Nadella', 'PERSON');
    if (/Sam Altman/i.test(text)) addEntity('Sam Altman', 'PERSON');
    if (/Mira Murati/i.test(text)) addEntity('Mira Murati', 'PERSON');

    // Companies & Organizations
    if (/\bMicrosoft\b/i.test(text)) addEntity('Microsoft', 'COMPANY');
    if (/\bOpenAI\b/i.test(text)) addEntity('OpenAI', 'ORGANIZATION');
    if (/\bGoogle\b/i.test(text)) addEntity('Google', 'COMPANY');
    if (/\bAlphabet\b/i.test(text)) addEntity('Alphabet', 'COMPANY');
    if (/\bApple\b/i.test(text)) addEntity('Apple', 'COMPANY');
    if (/\bEuropean Union\b/i.test(text)) addEntity('European Union', 'ORGANIZATION');

    // Regulations
    if (/\b(EU AI Act|AI Act|GDPR)\b/i.test(text)) {
      const match = text.match(/\b(EU AI Act|AI Act|GDPR)\b/i);
      if (match) addEntity(match[0], 'REGULATION');
    }

    // Currency values
    const currencyMatch = text.match(/(\$|€|£|₹|USD|EUR|GBP)\s*(\d+(?:\.\d+)?(?:\s*(?:million|billion|trillion|k))?)/i);
    if (currencyMatch) {
      addEntity(currencyMatch[0], 'CURRENCY');
    }

    return list;
  }

  /**
   * Extract dates and numerical values (including version numbers, percentages, currency amounts)
   */
  extractDatesAndNumbers(text: string): { dates: string[]; numericalValues: NumericalValue[] } {
    const dates: string[] = [];
    const numericalValues: NumericalValue[] = [];
    const seenDates = new Set<string>();
    const seenNums = new Set<string>();

    // 1. Extract explicit full dates and years
    // e.g. "March 2022", "November 2023", "1991", "1995", "2013", "2024"
    const monthYearPattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi;
    const myMatches = text.match(monthYearPattern);
    if (myMatches) {
      for (const m of myMatches) {
        if (!seenDates.has(m.toLowerCase())) {
          seenDates.add(m.toLowerCase());
          dates.push(m);
        }
      }
    }

    // Standalone 4-digit years (19xx or 20xx)
    const yearPattern = /\b(19\d{2}|20\d{2})\b/g;
    const yearMatches = text.match(yearPattern);
    if (yearMatches) {
      for (const y of yearMatches) {
        if (!seenDates.has(y.toLowerCase())) {
          seenDates.add(y.toLowerCase());
          dates.push(y);
        }
      }
    }

    // Relative time expressions
    const relPattern = /\b(next week|last year|next month|currently|yesterday|today)\b/gi;
    const relMatches = text.match(relPattern);
    if (relMatches) {
      for (const r of relMatches) {
        if (!seenDates.has(r.toLowerCase())) {
          seenDates.add(r.toLowerCase());
          dates.push(r);
        }
      }
    }

    // 2. Extract Numerical Values & Versions
    // Currency amounts: e.g. "$10 million", "10 million dollars"
    const currNum = text.match(/(\$|USD|€|EUR|£)\s*(\d+(?:\.\d+)?(?:\s*(?:million|billion|k))?)/i);
    if (currNum) {
      const val = currNum[2].trim();
      if (!seenNums.has(val)) {
        seenNums.add(val);
        numericalValues.push({ value: val, unit: 'currency' });
      }
    }

    // Percentages: e.g. "8.5%", "15 percent"
    const pctNum = text.match(/(\d+(?:\.\d+)?)\s*(%|percent)/i);
    if (pctNum) {
      const val = pctNum[1];
      if (!seenNums.has(val)) {
        seenNums.add(val);
        numericalValues.push({ value: val, unit: '%' });
      }
    }

    // Software Versions: e.g. "React 18", "Python 3.8", "Version 18", "Node.js 10"
    const verNum = text.match(/\b(?:version|v|release)?\s*(\d+(?:\.\d+){0,2})\b/i);
    if (verNum && !dates.includes(verNum[1])) {
      const val = verNum[1];
      // Avoid counting a year as a version unless preceded by version/v
      if (!/^(19\d{2}|20\d{2})$/.test(val) && !seenNums.has(val)) {
        seenNums.add(val);
        numericalValues.push({ value: val, unit: 'version' });
      }
    }

    return { dates, numericalValues };
  }

  /**
   * Find character offsets (start, end) of a claim in the original text
   */
  findOriginalOffsets(claimText: string, originalText: string): { start: number; end: number } {
    const cleanClaim = claimText.replace(/[.]+$/, '').trim();
    let start = originalText.indexOf(cleanClaim);

    if (start === -1) {
      // Try searching for prominent tokens (e.g. first 3 words)
      const firstWords = cleanClaim.split(/\s+/).slice(0, 3).join(' ');
      start = originalText.indexOf(firstWords);
    }

    if (start >= 0) {
      return { start, end: Math.min(originalText.length, start + cleanClaim.length) };
    }

    return { start: 0, end: originalText.length };
  }

  /**
   * Context Preservation / Coreference Resolution
   * Ensures anaphoric pronouns or omitted subjects (e.g. "Version 18 was released in 2022")
   * maintain explicit references to their antecedents (e.g. "React").
   */
  preserveContext(claims: ExtractedClaim[], originalText: string): ExtractedClaim[] {
    let activeSubject = '';
    let activeSubjectEntity: ExtractedEntity | null = null;
    let previousClaimId = '';

    return claims.map((claim) => {
      const claimText = claim.claimText;

      // Detect if this claim introduces a major subject (e.g. React, Python, Microsoft)
      const softwareOrCompany = claim.entities.find((e) =>
        ['SOFTWARE', 'COMPANY', 'PRODUCT', 'TECHNOLOGY', 'ORGANIZATION'].includes(e.type),
      );

      if (softwareOrCompany) {
        activeSubject = softwareOrCompany.text;
        activeSubjectEntity = softwareOrCompany;
      }

      // Check if claim lacks an explicit subject or refers to "Version X", "The company", "It"
      const isAnaphoric =
        /^(version\s+\d+|it\s+was|it\s+is|the\s+company|he\s+was|she\s+was|the\s+tool)\b/i.test(claimText);

      let context = claim.context || '';
      let entities = [...claim.entities];
      const dependencies: string[] = claim.dependencies || [];

      if (isAnaphoric && activeSubject) {
        context = `Subject: ${activeSubject} (antecedent context)`;
        if (activeSubjectEntity && !entities.some((e) => e.text.toLowerCase() === activeSubject.toLowerCase())) {
          entities.unshift(activeSubjectEntity);
        }
        if (previousClaimId && !dependencies.includes(previousClaimId)) {
          dependencies.push(previousClaimId);
        }
      }

      previousClaimId = claim.claimId;

      return {
        ...claim,
        context,
        entities,
        dependencies: dependencies.length > 0 ? dependencies : undefined,
      };
    });
  }

  /**
   * Semantic Deduplication
   * Identifies near-duplicate claims within the response without discarding occurrences
   */
  deduplicateClaims(claims: ExtractedClaim[]): ExtractedClaim[] {
    const seenFingerprints = new Map<string, string>(); // fingerprint -> claimId

    return claims.map((claim) => {
      // Normalize words to compare propositional content
      const words = claim.claimText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => !['the', 'is', 'was', 'a', 'an', 'in', 'of', 'and'].includes(w))
        .sort()
        .join(' ');

      if (seenFingerprints.has(words)) {
        const originalId = seenFingerprints.get(words)!;
        return {
          ...claim,
          isDuplicate: true,
          duplicateOf: originalId,
        };
      } else {
        seenFingerprints.set(words, claim.claimId);
        return claim;
      }
    });
  }

  /**
   * Merges numerical values cleanly without duplicates
   */
  private mergeNumericalValues(a: NumericalValue[], b: NumericalValue[]): NumericalValue[] {
    const map = new Map<string, NumericalValue>();
    for (const item of [...a, ...b]) {
      if (!map.has(item.value)) {
        map.set(item.value, item);
      }
    }
    return Array.from(map.values());
  }

  /**
   * Safely parses and validates model JSON output
   */
  private parseAndValidateModelOutput(rawOutput: string, originalText: string): ExtractedClaim[] {
    try {
      const cleaned = rawOutput
        .replace(/^```json\s*/im, '')
        .replace(/^```\s*/im, '')
        .replace(/\s*```$/m, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      const validated = rawModelClaimOutputSchema.safeParse(parsed);

      if (!validated.success || !validated.data.claims) {
        return [];
      }

      return validated.data.claims.map((raw, idx) => {
        const claimType = (raw.claimType && ['FACTUAL', 'OPINION', 'PREDICTION', 'RECOMMENDATION', 'HYPOTHETICAL', 'QUESTION', 'INSTRUCTION'].includes(raw.claimType.toUpperCase()))
          ? (raw.claimType.toUpperCase() as ClaimType)
          : this.classifyClaimType(raw.claimText);

        const category = (raw.category && ['TECHNOLOGY', 'BUSINESS', 'FINANCE', 'GOVERNMENT', 'EDUCATION', 'HISTORY', 'SCIENCE', 'GENERAL'].includes(raw.category.toUpperCase()))
          ? (raw.category.toUpperCase() as ClaimCategory)
          : this.classifyCategory(raw.claimText);

        const entities: ExtractedEntity[] = Array.isArray(raw.entities)
          ? raw.entities.map((e: any) => ({
              text: typeof e === 'string' ? e : e.text || String(e),
              type: typeof e === 'object' && e.type ? e.type : 'OTHER',
            }))
          : [];

        const numericalValues: NumericalValue[] = Array.isArray(raw.numericalValues)
          ? raw.numericalValues.map((n: any) => ({
              value: typeof n === 'string' ? n : String(n.value || n),
              unit: typeof n === 'object' ? n.unit : undefined,
            }))
          : [];

        return {
          claimId: `claim-${String(idx + 1).padStart(3, '0')}`,
          claimText: raw.claimText,
          claimType,
          category,
          entities,
          dates: Array.isArray(raw.dates) ? raw.dates : [],
          numericalValues,
          context: raw.context || '',
          originalTextReference: this.findOriginalOffsets(raw.claimText, originalText),
          extractionConfidence: raw.extractionConfidence || 0.95,
          order: idx + 1,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Persists extracted claims to MongoDB and In-Memory store
   */
  async persistClaims(
    claims: ExtractedClaim[],
    verificationId?: string,
    userId?: string,
  ): Promise<void> {
    if (!verificationId) return;

    const sessionObjId = mongoose.Types.ObjectId.isValid(verificationId)
      ? new mongoose.Types.ObjectId(verificationId)
      : new mongoose.Types.ObjectId();

    const userObjId = userId && mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : new mongoose.Types.ObjectId();

    // 1. In-Memory Store
    inMemoryStore.saveClaims(
      verificationId,
      claims.map((c) => ({
        sessionId: sessionObjId,
        claimText: c.claimText,
        category: c.category,
        entities: c.entities.map((e) => e.text),
        timeSensitivity: 'STATIC',
        order: c.order || 1,
        claimType: c.claimType,
      })),
    );

    // 2. MongoDB Store
    if (isMongoConnected()) {
      try {
        const docs = claims.map((c) => ({
          sessionId: sessionObjId,
          userId: userObjId,
          claimId: c.claimId,
          order: c.order || 1,
          claimText: c.claimText,
          claimType: c.claimType,
          category: c.category,
          entities: c.entities.map((e) => e.text),
          extractedEntities: c.entities,
          dates: c.dates,
          numericalValues: c.numericalValues,
          context: c.context,
          originalTextReference: c.originalTextReference,
          extractionConfidence: c.extractionConfidence,
          dependencies: c.dependencies,
          isDuplicate: c.isDuplicate || false,
          duplicateOf: c.duplicateOf,
          timeSensitivity: 'STATIC',
          freshnessScore: 100,
          evidenceCount: 0,
        }));

        await Claim.insertMany(docs, { ordered: false });
      } catch (err: any) {
        logger.warn('Failed to insert claims into MongoDB; in-memory store remains active', {
          error: err.message,
        });
      }
    }
  }

  /**
   * Retrieve claims by verification ID
   */
  async getClaimsByVerificationId(verificationId: string): Promise<ExtractedClaim[]> {
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(verificationId)) {
      try {
        const docs = await Claim.find({ sessionId: new mongoose.Types.ObjectId(verificationId) })
          .sort({ order: 1 })
          .lean();

        if (docs && docs.length > 0) {
          return docs.map((d: any) => ({
            claimId: d.claimId || `claim-${d.order}`,
            claimText: d.claimText,
            claimType: d.claimType || 'FACTUAL',
            category: d.category || 'GENERAL',
            entities: d.extractedEntities || (d.entities || []).map((t: string) => ({ text: t, type: 'OTHER' })),
            dates: d.dates || [],
            numericalValues: d.numericalValues || [],
            context: d.context || '',
            originalTextReference: d.originalTextReference || { start: 0, end: 0 },
            extractionConfidence: d.extractionConfidence || 0.95,
            dependencies: d.dependencies,
            isDuplicate: d.isDuplicate,
            duplicateOf: d.duplicateOf,
            order: d.order,
          }));
        }
      } catch {
        // Fall through to in-memory
      }
    }

    const inMem = inMemoryStore.getClaims(verificationId);
    return inMem.map((d: any, idx: number) => ({
      claimId: `claim-${String(idx + 1).padStart(3, '0')}`,
      claimText: d.claimText,
      claimType: d.claimType || 'FACTUAL',
      category: d.category || 'GENERAL',
      entities: (d.entities || []).map((t: string) => ({ text: t, type: 'OTHER' })),
      dates: [],
      numericalValues: [],
      context: '',
      originalTextReference: { start: 0, end: 0 },
      extractionConfidence: 0.95,
      order: d.order || idx + 1,
    }));
  }
}

export const claimExtractionService = new ClaimExtractionService();
