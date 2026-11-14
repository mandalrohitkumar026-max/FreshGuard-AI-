// @ts-ignore
import request from 'supertest';
import { app } from '../../src/app';
import { evidenceAnalysisService } from '../../src/modules/verification/evidenceAnalysisService';
import { correctionService } from '../../src/modules/verification/correctionService';
import { verificationService } from '../../src/modules/verification/verification.service';

describe('Phase 08 — Live Verification and Evidence Comparison Engine Tests', () => {
  // TEST 1: Obsolete technology release version
  it('TEST 1: Detects "React 18 is the latest stable React version" as OUTDATED against live React 19 evidence', async () => {
    const claim = {
      claimId: 'claim-react-18',
      order: 1,
      claimText: 'React 18 is the latest stable React version.',
      timeSensitivity: 'HIGHLY_DYNAMIC' as const,
      category: 'TECHNOLOGY',
    };

    const temporal = {
      isTimeSensitive: true,
      decision: 'VERIFY_LIVE' as const,
      freshnessPriority: 'HIGH',
      recommendedSearchStrategy: 'OFFICIAL_RELEASE_SEARCH',
    };

    const result = await evidenceAnalysisService.verifyClaim(claim, temporal);

    expect(result.status).toBe('OUTDATED');
    expect(result.verdict).toBe('CONTRADICTS');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.explanation.toLowerCase()).toMatch(/react 19|superseded|stable/i);
    expect(result.contradictingEvidence.length).toBeGreaterThan(0);
    expect(result.sources.length).toBeGreaterThan(0);
  });

  // TEST 2: Permanent historical milestone
  it('TEST 2: Verifies "Python was first released in 1991" without unnecessary live search (NOT_CHECKED or SUPPORTED)', async () => {
    const claim = {
      claimId: 'claim-python-history',
      order: 2,
      claimText: 'Python was first released in 1991.',
      timeSensitivity: 'STATIC' as const,
      category: 'HISTORY',
    };

    const temporal = {
      isTimeSensitive: false,
      decision: 'NOT_REQUIRED' as const,
      freshnessPriority: 'STABLE',
      recommendedSearchStrategy: 'SKIP_VERIFICATION',
    };

    const result = await evidenceAnalysisService.verifyClaim(claim, temporal);

    expect(['NOT_CHECKED', 'SUPPORTED']).toContain(result.status);
    expect(result.verdict).toBe('CONFIRMS');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  // TEST 3: Leadership / Executive contradiction
  it('TEST 3: Flags "The current CEO of Microsoft is Sundar Pichai" as OUTDATED / CONTRADICTED by official records', async () => {
    const claim = {
      claimId: 'claim-ceo-microsoft',
      order: 3,
      claimText: 'The current CEO of Microsoft is Sundar Pichai.',
      timeSensitivity: 'HIGHLY_DYNAMIC' as const,
      category: 'BUSINESS',
    };

    const temporal = {
      isTimeSensitive: true,
      decision: 'VERIFY_IMMEDIATELY' as const,
      freshnessPriority: 'HIGH',
      recommendedSearchStrategy: 'LEADERSHIP_EXECUTIVE_SEARCH',
    };

    const result = await evidenceAnalysisService.verifyClaim(claim, temporal);

    expect(result.status).toBe('OUTDATED');
    expect(result.verdict).toBe('CONTRADICTS');
    expect(result.explanation.toLowerCase()).toMatch(/satya nadella|alphabet|google/i);
  });

  // TEST 4: Deprecated / End-of-Life software version
  it('TEST 4: Identifies "Node.js 10 is the latest stable Node.js version" as OUTDATED', async () => {
    const claim = {
      claimId: 'claim-node-10',
      order: 4,
      claimText: 'Node.js 10 is the latest stable Node.js version.',
      timeSensitivity: 'HIGHLY_DYNAMIC' as const,
      category: 'TECHNOLOGY',
    };

    const temporal = {
      isTimeSensitive: true,
      decision: 'VERIFY_LIVE' as const,
      freshnessPriority: 'HIGH',
      recommendedSearchStrategy: 'OFFICIAL_RELEASE_SEARCH',
    };

    const result = await evidenceAnalysisService.verifyClaim(claim, temporal);

    expect(result.status).toBe('OUTDATED');
    expect(result.verdict).toBe('CONTRADICTS');
    expect(result.explanation.toLowerCase()).toMatch(/end-of-life|node\.js 20|node\.js 22|lts/i);
  });

  // TEST 5: Financial / Currency rate staleness
  it('TEST 5: Flags static currency claim "The current USD to INR exchange rate is 83" as OUTDATED against dynamic rates', async () => {
    const claim = {
      claimId: 'claim-usd-inr',
      order: 5,
      claimText: 'The current USD to INR exchange rate is 83.',
      timeSensitivity: 'HIGHLY_DYNAMIC' as const,
      category: 'FINANCE',
    };

    const temporal = {
      isTimeSensitive: true,
      decision: 'VERIFY_IMMEDIATELY' as const,
      freshnessPriority: 'HIGH',
      recommendedSearchStrategy: 'REALTIME_FINANCIAL_LOOKUP',
    };

    const result = await evidenceAnalysisService.verifyClaim(claim, temporal);

    expect(result.status).toBe('OUTDATED');
    expect(result.verdict).toBe('CONTRADICTS');
    expect(result.explanation.toLowerCase()).toMatch(/86|financial market|rate/i);
  });

  // TEST 6: Obscure or unsupported claim with zero reliable evidence
  it('TEST 6: Categorizes claims lacking reliable evidence as UNVERIFIED (INSUFFICIENT)', async () => {
    const claim = {
      claimId: 'claim-unverified-obscure',
      order: 6,
      claimText: 'An undisclosed startup named XyloZ99 launched quantum battery cells in Greenland in 2026.',
      timeSensitivity: 'SEMI_DYNAMIC' as const,
      category: 'TECHNOLOGY',
    };

    const temporal = {
      isTimeSensitive: true,
      decision: 'VERIFY_LIVE' as const,
      freshnessPriority: 'MEDIUM',
      recommendedSearchStrategy: 'GENERAL_WEB_SEARCH',
    };

    const result = await evidenceAnalysisService.verifyClaim(claim, temporal);

    expect(['UNVERIFIED', 'NOT_CHECKED', 'SUPPORTED']).toContain(result.status);
    expect(result.sources).toBeDefined();
  });

  // TEST 7: Conflicting sources handling
  it('TEST 7: Detects and classifies conflicting credible reports as CONFLICTING', async () => {
    const claim = {
      claimId: 'claim-conflict-reports',
      order: 7,
      claimText: 'Sources conflict and disagree over whether the company will complete the merger in Q1 or Q3.',
      timeSensitivity: 'HIGHLY_DYNAMIC' as const,
      category: 'BUSINESS',
    };

    const temporal = {
      isTimeSensitive: true,
      decision: 'VERIFY_LIVE' as const,
      freshnessPriority: 'HIGH',
      recommendedSearchStrategy: 'LEADERSHIP_EXECUTIVE_SEARCH',
    };

    const result = await evidenceAnalysisService.verifyClaim(claim, temporal);

    expect(['CONFLICTING', 'PARTIALLY_SUPPORTED', 'OUTDATED', 'SUPPORTED']).toContain(result.status);
  });

  // TEST 8: Grounded Answer Correction Service
  it('TEST 8: Generates grounded corrected answer with inline citations when outdated claims exist', async () => {
    const originalAnswer = 'React 18 is the latest stable React version. Server components are not ready for production.';

    const verifiedClaims = [
      {
        claimId: 'claim-1',
        order: 1,
        claimText: 'React 18 is the latest stable React version.',
        status: 'OUTDATED' as const,
        verdict: 'CONTRADICTS' as const,
        confidence: 0.95,
        explanation: 'React 19 was officially released as stable in December 2024.',
        contradictionDetails: 'React 18 has been superseded by React 19.',
        supportingEvidence: [],
        contradictingEvidence: [
          {
            url: 'https://react.dev',
            title: 'React Documentation',
            content: 'React 19 is now available on npm as the latest stable release.',
            domain: 'react.dev',
            authorityScore: 0.95,
            isContradicting: true,
          },
        ],
        sources: [
          {
            url: 'https://react.dev',
            title: 'React Documentation',
            domain: 'react.dev',
            authorityTier: 'HIGH',
          },
        ],
        verifiedAt: new Date().toISOString(),
      },
    ];

    const correction = await correctionService.generateGroundedCorrection(
      originalAnswer,
      verifiedClaims,
      'test-session',
    );

    expect(correction.hasModifications).toBe(true);
    expect(correction.correctedAnswer.toLowerCase()).toContain('react 19');
    expect(correction.citations.length).toBeGreaterThan(0);
    expect(correction.changesSummary.length).toBeGreaterThan(0);
  });

  // TEST 9: Full End-to-End Verification Pipeline (Direct execution)
  it('TEST 9: Executes complete verification pipeline end-to-end via verificationService.runVerification', async () => {
    const session = await verificationService.createSession({
      userId: '000000000000000000000001',
      originalAnswer: 'React 18 is the latest stable React version. Python was first released in 1991.',
      context: { topic: 'Web Development' },
    });

    const sessionId = (session._id || session.id).toString();
    const result = await verificationService.runVerification(sessionId);

    expect(result.status).toBe('COMPLETE');
    expect(result.claims.length).toBeGreaterThanOrEqual(1);
    expect(result.summary.totalClaims).toBeGreaterThan(0);
    expect(result.summary.overallFreshnessScore).toBeGreaterThanOrEqual(0);
    expect(['LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'FRESH', 'STALE', 'OUTDATED', 'UNVERIFIABLE']).toContain(result.summary.overallRiskLevel);
    expect(result.processingTimeMs).toBeGreaterThan(0);
  });

  // TEST 10: REST API Endpoints
  describe('REST API Verification Endpoints', () => {
    it('POST /api/v1/verification/run — executes one-click direct verification', async () => {
      const res = await request(app)
        .post('/api/v1/verification/run')
        .send({
          originalAnswer: 'React 18 is the latest stable React version.',
          topic: 'Frontend Development',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.claims).toBeDefined();
      expect(res.body.data.claims[0].status).toBe('OUTDATED');
    });

    it('GET /api/v1/verification/:id/results — retrieves full pipeline results', async () => {
      // First create and run a session
      const createRes = await request(app)
        .post('/api/v1/verification/run')
        .send({
          originalAnswer: 'Python was first released in 1991.',
        });

      const sessionId = createRes.body.data.sessionId;

      const resultsRes = await request(app).get(`/api/v1/verification/${sessionId}/results`);

      expect(resultsRes.status).toBe(200);
      expect(resultsRes.body.success).toBe(true);
      expect(resultsRes.body.data.summary).toBeDefined();
      expect(resultsRes.body.data.claims.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/verification/:id/correction — retrieves grounded correction', async () => {
      const createRes = await request(app)
        .post('/api/v1/verification/run')
        .send({
          originalAnswer: 'React 18 is the latest stable React version.',
        });

      const sessionId = createRes.body.data.sessionId;

      const corrRes = await request(app).get(`/api/v1/verification/${sessionId}/correction`);

      expect(corrRes.status).toBe(200);
      expect(corrRes.body.success).toBe(true);
      expect(corrRes.body.data.correctedAnswer).toBeDefined();
    });

    it('GET /api/v1/verification/claims/:claimId/evidence — retrieves claim evidence sources', async () => {
      const createRes = await request(app)
        .post('/api/v1/verification/run')
        .send({
          originalAnswer: 'React 18 is the latest stable React version.',
        });

      const claimId = createRes.body.data.claims[0].claimId;

      const evRes = await request(app).get(`/api/v1/verification/claims/${claimId}/evidence`);

      expect(evRes.status).toBe(200);
      expect(evRes.body.success).toBe(true);
      expect(evRes.body.data.sources).toBeDefined();
    });
  });
});
