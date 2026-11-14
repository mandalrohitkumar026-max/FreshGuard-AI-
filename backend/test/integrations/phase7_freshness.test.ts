// @ts-ignore
import request from 'supertest';
import { app } from '../../src/app';
import { freshnessDetectionService } from '../../src/modules/freshness/freshnessDetectionService';
import { claimTemporalAnalysisSchema } from '../../src/modules/freshness/freshness.validation';
import { ExtractedClaim } from '../../src/modules/claims/claim.types';

describe('Phase 07 — Freshness Detection and Temporal Intelligence Engine Tests', () => {
  // TEST A: Current software release claim
  it('TEST A: Identifies "React 18 is the latest stable React version" as time-sensitive with HIGH priority', async () => {
    const claim: ExtractedClaim = {
      claimId: 'claim-A',
      claimText: 'React 18 is the latest stable React version.',
      claimType: 'FACTUAL',
      category: 'TECHNOLOGY',
      entities: [{ text: 'React', type: 'SOFTWARE' }],
      dates: [],
      numericalValues: [{ value: '18', unit: 'version' }],
      context: '',
      originalTextReference: { start: 0, end: 43 },
      extractionConfidence: 0.95,
    };

    const analysis = freshnessDetectionService.determineVerificationRequirement(claim);

    expect(analysis.isTimeSensitive).toBe(true);
    expect(analysis.priority).toBe('HIGH');
    expect(analysis.volatility).toBe('HIGH');
    expect(analysis.decision).toBe('VERIFY_LIVE');
    expect(analysis.requiresVerification).toBe(true);
    expect(analysis.recommendedSearchStrategy).toBe('OFFICIAL_RELEASE_SEARCH');

    expect(claimTemporalAnalysisSchema.safeParse(analysis).success).toBe(true);
  });

  // TEST B: Stable historical fact
  it('TEST B: Classifies "Python was first released in 1991" as STABLE without unnecessary verification requirement', async () => {
    const claim: ExtractedClaim = {
      claimId: 'claim-B',
      claimText: 'Python was first released in 1991.',
      claimType: 'FACTUAL',
      category: 'HISTORY',
      entities: [{ text: 'Python', type: 'SOFTWARE' }],
      dates: ['1991'],
      numericalValues: [],
      context: '',
      originalTextReference: { start: 0, end: 34 },
      extractionConfidence: 0.95,
    };

    const analysis = freshnessDetectionService.determineVerificationRequirement(claim);

    expect(analysis.isTimeSensitive).toBe(false);
    expect(analysis.priority).toBe('STABLE');
    expect(analysis.volatility).toBe('STABLE');
    expect(analysis.decision).toBe('NOT_REQUIRED');
    expect(analysis.requiresVerification).toBe(false);
    expect(analysis.recommendedSearchStrategy).toBe('SKIP_VERIFICATION');

    expect(claimTemporalAnalysisSchema.safeParse(analysis).success).toBe(true);
  });

  // TEST C: Company leadership change claim
  it('TEST C: Flags "The current CEO of Microsoft is Sundar Pichai" for immediate leadership verification', async () => {
    const claim: ExtractedClaim = {
      claimId: 'claim-C',
      claimText: 'The current CEO of Microsoft is Sundar Pichai.',
      claimType: 'FACTUAL',
      category: 'BUSINESS',
      entities: [
        { text: 'Microsoft', type: 'COMPANY' },
        { text: 'Sundar Pichai', type: 'PERSON' },
      ],
      dates: [],
      numericalValues: [],
      context: '',
      originalTextReference: { start: 0, end: 46 },
      extractionConfidence: 0.95,
    };

    const analysis = freshnessDetectionService.determineVerificationRequirement(claim);

    expect(analysis.isTimeSensitive).toBe(true);
    expect(['HIGH', 'MEDIUM']).toContain(analysis.priority);
    expect(analysis.decision).toBe('VERIFY_IMMEDIATELY');
    expect(analysis.requiresVerification).toBe(true);
    expect(analysis.recommendedSearchStrategy).toBe('LEADERSHIP_EXECUTIVE_SEARCH');
    expect(analysis.preferredSourceType).toBe('company_official');
  });

  // TEST D: Highly volatile real-time currency exchange rate
  it('TEST D: Detects "The current USD to INR exchange rate is 83" as VERY_HIGH volatility requiring immediate verification', async () => {
    const claim: ExtractedClaim = {
      claimId: 'claim-D',
      claimText: 'The current USD to INR exchange rate is 83.',
      claimType: 'FACTUAL',
      category: 'FINANCE',
      entities: [{ text: 'USD to INR', type: 'CURRENCY' }],
      dates: [],
      numericalValues: [{ value: '83', unit: 'currency' }],
      context: '',
      originalTextReference: { start: 0, end: 43 },
      extractionConfidence: 0.95,
    };

    const analysis = freshnessDetectionService.determineVerificationRequirement(claim);

    expect(analysis.isTimeSensitive).toBe(true);
    expect(analysis.priority).toBe('HIGH');
    expect(analysis.volatility).toBe('VERY_HIGH');
    expect(analysis.decision).toBe('VERIFY_IMMEDIATELY');
    expect(analysis.requiresVerification).toBe(true);
    expect(analysis.recommendedSearchStrategy).toBe('REALTIME_FINANCIAL_LOOKUP');
  });

  // TEST E: Established scientific fact
  it('TEST E: Accurately classifies "Water consists of hydrogen and oxygen" as STABLE scientific truth', async () => {
    const claim: ExtractedClaim = {
      claimId: 'claim-E',
      claimText: 'Water consists of hydrogen and oxygen.',
      claimType: 'FACTUAL',
      category: 'SCIENCE',
      entities: [],
      dates: [],
      numericalValues: [],
      context: '',
      originalTextReference: { start: 0, end: 38 },
      extractionConfidence: 0.99,
    };

    const analysis = freshnessDetectionService.determineVerificationRequirement(claim);

    expect(analysis.isTimeSensitive).toBe(false);
    expect(analysis.priority).toBe('STABLE');
    expect(analysis.volatility).toBe('STABLE');
    expect(analysis.decision).toBe('NOT_REQUIRED');
    expect(analysis.requiresVerification).toBe(false);
    expect(analysis.recommendedSearchStrategy).toBe('SKIP_VERIFICATION');
  });

  // TEST F: Outdated software version assertion
  it('TEST F: Flags "The latest Node.js version is Node.js 10" as time-sensitive with official release search strategy', async () => {
    const claim: ExtractedClaim = {
      claimId: 'claim-F',
      claimText: 'The latest Node.js version is Node.js 10.',
      claimType: 'FACTUAL',
      category: 'TECHNOLOGY',
      entities: [{ text: 'Node.js', type: 'SOFTWARE' }],
      dates: [],
      numericalValues: [{ value: '10', unit: 'version' }],
      context: '',
      originalTextReference: { start: 0, end: 41 },
      extractionConfidence: 0.95,
    };

    const analysis = freshnessDetectionService.determineVerificationRequirement(claim);

    expect(analysis.isTimeSensitive).toBe(true);
    expect(analysis.priority).toBe('HIGH');
    expect(analysis.decision).toBe('VERIFY_LIVE');
    expect(analysis.requiresVerification).toBe(true);
    expect(analysis.recommendedSearchStrategy).toBe('OFFICIAL_RELEASE_SEARCH');
  });

  // TEST G: Academic/Scholarship relative time deadline
  it('TEST G: Identifies "Applications for this scholarship close next week" as time-sensitive academic deadline', async () => {
    const claim: ExtractedClaim = {
      claimId: 'claim-G',
      claimText: 'Applications for this scholarship close next week.',
      claimType: 'FACTUAL',
      category: 'EDUCATION',
      entities: [],
      dates: ['next week'],
      numericalValues: [],
      context: '',
      originalTextReference: { start: 0, end: 50 },
      extractionConfidence: 0.92,
    };

    const analysis = freshnessDetectionService.determineVerificationRequirement(claim);

    expect(analysis.isTimeSensitive).toBe(true);
    expect(analysis.priority).toBe('HIGH');
    expect(analysis.requiresVerification).toBe(true);
    expect(analysis.recommendedSearchStrategy).toBe('ACADEMIC_DEADLINE_SEARCH');
  });

  // Batch Analysis Pipeline Test
  it('Executes batch temporal analysis pipeline and preserves factual vs stable proportion', async () => {
    const inputAnswer =
      'React 18 is the latest stable React version. Python was first released in 1991. The current USD to INR exchange rate is 83. Water consists of hydrogen and oxygen.';

    const result = await freshnessDetectionService.analyzeFreshness(inputAnswer);

    expect(result.totalClaims).toBe(4);
    expect(result.timeSensitiveCount).toBe(2); // React 18 & Exchange Rate
    expect(result.stableCount).toBe(2); // Python 1991 & Water H2O
    expect(typeof result.latencyMs).toBe('number');
  });

  // Edge Case: Empty input rejection
  it('Rejects empty claim inputs with HTTP 400 Bad Request', async () => {
    await expect(freshnessDetectionService.analyzeFreshness([])).rejects.toThrow(
      'No claims provided or found for freshness analysis'
    );

    const res = await request(app)
      .post('/api/v1/freshness/analyze')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // REST API Endpoints
  describe('Freshness Endpoints', () => {
    let testVerificationId = '';

    it('POST /api/v1/freshness/analyze returns full temporal breakdown and persists results', async () => {
      const res = await request(app)
        .post('/api/v1/freshness/analyze')
        .send({
          answerText:
            'The current CEO of Microsoft is Satya Nadella. JavaScript was created by Brendan Eich in 1995.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.analysis).toBeDefined();
      expect(res.body.data.analysis.length).toBe(2);
      expect(res.body.data.timeSensitiveCount).toBe(1);
      expect(res.body.data.stableCount).toBe(1);

      testVerificationId = res.body.data.verificationId;
    });

    it('GET /api/v1/freshness/:verificationId retrieves persisted temporal analysis', async () => {
      const res = await request(app).get(`/api/v1/freshness/${testVerificationId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationId).toBe(testVerificationId);
      expect(Array.isArray(res.body.data.analysis)).toBe(true);
      expect(res.body.data.analysis.length).toBe(2);
    });
  });
});
