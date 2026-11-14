// @ts-ignore
import request from 'supertest';
import { app } from '../../src/app';
import { claimExtractionService } from '../../src/modules/claims/claimExtractionService';
import { extractedClaimSchema } from '../../src/modules/claims/claim.validation';
import { ExtractedClaim } from '../../src/modules/claims/claim.types';

describe('Phase 06 — Intelligent AI Claim Extraction Engine Tests', () => {
  // TEST 1: Multiple factual claims
  it('TEST 1: Multiple factual claims are decomposed into independent atomic claims', async () => {
    const input = 'React 18 was released in March 2022. Python was first released in 1991.';
    const result = await claimExtractionService.extractClaims(input, {
      topicHint: 'Technology',
    });

    expect(result.claims.length).toBe(2);
    expect(result.factualClaimsCount).toBe(2);

    const claim1 = result.claims[0];
    const claim2 = result.claims[1];

    expect(claim1.claimText).toContain('React 18');
    expect(claim1.claimType).toBe('FACTUAL');
    expect(claim1.category).toBe('TECHNOLOGY');
    expect(claim1.dates).toContain('March 2022');
    expect(claim1.entities.some((e) => e.text === 'React' && e.type === 'SOFTWARE')).toBe(true);

    expect(claim2.claimText).toContain('Python');
    expect(claim2.claimType).toBe('FACTUAL');
    expect(claim2.category).toBe('TECHNOLOGY');
    expect(claim2.dates).toContain('1991');

    // Schema validation
    expect(extractedClaimSchema.safeParse(claim1).success).toBe(true);
    expect(extractedClaimSchema.safeParse(claim2).success).toBe(true);
  });

  // TEST 2: Mixed claims (factual statement + opinion)
  it('TEST 2: Separates factual statements from subjective opinions', async () => {
    const input = 'Python was created by Guido van Rossum. I think Python is the best language.';
    const result = await claimExtractionService.extractClaims(input);

    expect(result.claims.length).toBe(2);

    const factual = result.claims.find((c) => c.claimType === 'FACTUAL');
    const opinion = result.claims.find((c) => c.claimType === 'OPINION');

    expect(factual).toBeDefined();
    expect(factual?.claimText).toContain('Guido van Rossum');
    expect(factual?.entities.some((e) => e.text === 'Guido van Rossum' && e.type === 'PERSON')).toBe(true);

    expect(opinion).toBeDefined();
    expect(opinion?.claimText).toContain('best language');
    expect(opinion?.claimType).toBe('OPINION');
  });

  // TEST 3: Multiple claims in one sentence
  it('TEST 3: Decomposes multiple atomic assertions joined within a single compound sentence', async () => {
    const input =
      'React 18 is the latest version, Python 3.8 is the newest Python release, and Node.js 10 is the latest stable version.';
    const result = await claimExtractionService.extractClaims(input);

    expect(result.claims.length).toBe(3);
    expect(result.claims.every((c) => c.claimType === 'FACTUAL')).toBe(true);

    expect(result.claims[0].claimText).toContain('React 18');
    expect(result.claims[1].claimText).toContain('Python 3.8');
    expect(result.claims[2].claimText).toContain('Node.js 10');
  });

  // TEST 4: Dates and numbers
  it('TEST 4: Extracts company, currency, numerical values, and dates accurately', async () => {
    const input = 'The company generated revenue of $10 million in 2024.';
    const result = await claimExtractionService.extractClaims(input, {
      topicHint: 'Business',
    });

    expect(result.claims.length).toBeGreaterThanOrEqual(1);
    const claim = result.claims[0];

    expect(claim.category).toBe('BUSINESS');
    expect(claim.dates).toContain('2024');

    const numValue = claim.numericalValues.find((n) => n.value.includes('10 million') || n.value.includes('10'));
    expect(numValue).toBeDefined();

    const currencyEntity = claim.entities.find((e) => e.type === 'CURRENCY');
    expect(currencyEntity).toBeDefined();
    expect(currencyEntity?.text).toContain('$');
  });

  // TEST 5: Context-dependent claim (coreference preservation)
  it('TEST 5: Preserves antecedent entity as the subject of the context-dependent second claim', async () => {
    const input = 'React was released in 2013. Version 18 was released in March 2022.';
    const result = await claimExtractionService.extractClaims(input);

    expect(result.claims.length).toBe(2);

    const claim2 = result.claims[1];
    expect(claim2.claimText).toContain('Version 18');
    // Context should link back to React
    expect(claim2.context.toLowerCase()).toContain('react');
    expect(claim2.entities.some((e) => e.text === 'React')).toBe(true);
  });

  // TEST 6: Stable historical facts
  it('TEST 6: Accurately categorizes historical factual claims with creator entity and date', async () => {
    const input = 'JavaScript was created by Brendan Eich in 1995.';
    const result = await claimExtractionService.extractClaims(input, {
      topicHint: 'History',
    });

    expect(result.claims.length).toBe(1);
    const claim = result.claims[0];

    expect(claim.claimType).toBe('FACTUAL');
    expect(claim.dates).toContain('1995');
    expect(claim.entities.some((e) => e.text === 'Brendan Eich' && e.type === 'PERSON')).toBe(true);
    expect(claim.entities.some((e) => e.text === 'JavaScript')).toBe(true);
  });

  // TEST 7: Opinion and prediction
  it('TEST 7: Distinguishes opinion and prediction from factual claims', async () => {
    const input = 'React is the best framework and will dominate development forever.';
    const result = await claimExtractionService.extractClaims(input);

    expect(result.claims.length).toBeGreaterThanOrEqual(1);
    const types = result.claims.map((c) => c.claimType);
    expect(types.some((t) => t === 'OPINION' || t === 'PREDICTION')).toBe(true);
    expect(result.factualClaimsCount).toBe(0);
  });

  // TEST 8: Empty input validation
  it('TEST 8: Rejects empty or whitespace-only input with bad request 400', async () => {
    await expect(claimExtractionService.extractClaims('')).rejects.toThrow(
      'Answer text is required and cannot be empty'
    );

    const res = await request(app)
      .post('/api/v1/claims/extract')
      .send({ answer: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // TEST 9: Extremely long input handling
  it('TEST 9: Safely handles long inputs without memory corruption or crashing', async () => {
    const longText = 'React 18 was released in 2022. '.repeat(100); // 3,000+ characters
    const result = await claimExtractionService.extractClaims(longText);

    expect(result).toBeDefined();
    expect(result.totalClaims).toBeGreaterThan(0);
    expect(typeof result.latencyMs).toBe('number');
  });

  // TEST 10: Malformed LLM output fallback resilience
  it('TEST 10: Gracefully handles malformed LLM responses using deterministic fallback', async () => {
    // Calling extraction service directly with unstructured content
    const unformatted = '   Some raw unformatted bullet points without standard markdown   ';
    const result = await claimExtractionService.extractClaims(unformatted);

    expect(result).toBeDefined();
    expect(Array.isArray(result.claims)).toBe(true);
    expect(result.originalText).toBe(unformatted);
  });

  // REST API Endpoints
  describe('Claims Endpoints', () => {
    let savedVerificationId = '';

    it('POST /api/v1/claims/extract decomposes answer and stores claims in database', async () => {
      const res = await request(app)
        .post('/api/v1/claims/extract')
        .send({
          answer: 'React 19 was released with Server Components. Python 3.12 is the latest Python.',
          topicHint: 'Web Technologies',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.claims).toBeDefined();
      expect(res.body.data.claims.length).toBe(2);
      expect(res.body.data.verificationId).toBeDefined();

      savedVerificationId = res.body.data.verificationId;
    });

    it('GET /api/v1/claims/verification/:verificationId retrieves persisted claims', async () => {
      const res = await request(app).get(
        `/api/v1/claims/verification/${savedVerificationId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationId).toBe(savedVerificationId);
      expect(Array.isArray(res.body.data.claims)).toBe(true);
      expect(res.body.data.claims.length).toBe(2);
    });
  });
});
