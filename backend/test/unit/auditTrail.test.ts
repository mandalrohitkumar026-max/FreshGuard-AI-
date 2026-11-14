import { auditTrailService } from '../../src/modules/verification/auditTrailService';
import { verificationService } from '../../src/modules/verification/verification.service';

jest.mock('../../src/modules/verification/verification.service');

describe('Verification Audit Trail', () => {
  const mockSession = {
    id: 'session-audit-1',
    originalAnswer: 'Node.js 22 is the current Active LTS release.',
    context: { topic: 'Node.js LTS Releases' },
  };

  const mockResults = {
    sessionId: 'session-audit-1',
    originalAnswer: 'Node.js 22 is the current Active LTS release.',
    processingTimeMs: 52,
    summary: {
      overallFreshnessScore: 100,
      overallRiskLevel: 'FRESH',
      totalClaims: 1,
      outdated: 0,
      supported: 1,
      unverified: 0,
    },
    claims: [
      {
        claimId: 'claim-1',
        order: 1,
        claimText: 'Node.js 22 is the current Active LTS release.',
        verdict: 'CONFIRMS',
        confidence: 0.98,
        searchQuery: 'Node.js 22 Active LTS schedule',
        supportingEvidence: [
          {
            url: 'https://nodejs.org/en/about/previous-releases',
            domain: 'nodejs.org',
            publishedDate: '2024-10-29T00:00:00Z',
            retrievedAt: '2026-11-12T00:00:00Z',
            authorityScore: 0.99,
          },
        ],
        contradictingEvidence: [],
      },
    ],
  };

  beforeEach(() => {
    (verificationService.getSessionById as jest.Mock).mockResolvedValue(mockSession);
    (verificationService.getVerificationResults as jest.Mock).mockResolvedValue(mockResults);
  });

  test('compiles a complete audit package with valid SHA-256 fingerprint', async () => {
    const auditPackage = await auditTrailService.generateAuditPackage('session-audit-1');

    expect(auditPackage.sessionId).toBe('session-audit-1');
    expect(auditPackage.fingerprint.algorithm).toBe('sha256');
    expect(auditPackage.fingerprint.hash).toHaveLength(64); // 64 hex characters for SHA-256
    expect(auditPackage.provenance.gateway).toContain('Bifrost');
    expect(auditPackage.provenance.searchEngine).toContain('Tavily');
    expect(auditPackage.claimsLineage).toHaveLength(1);
    expect(auditPackage.claimsLineage[0].evidenceSources).toHaveLength(1);
    expect(auditPackage.verdictSummary.overallFreshnessScore).toBe(100);
  });

  test('contains complete 8-stage verification pipeline telemetry', async () => {
    const auditPackage = await auditTrailService.generateAuditPackage('session-audit-1');

    expect(auditPackage.pipelineTelemetry.stagesExecuted).toContain('CLAIM_EXTRACTION');
    expect(auditPackage.pipelineTelemetry.stagesExecuted).toContain('TAVILY_EVIDENCE_RETRIEVAL');
    expect(auditPackage.pipelineTelemetry.stagesExecuted).toContain('CONFLICT_DETECTION');
    expect(auditPackage.pipelineTelemetry.stagesExecuted).toContain('GROUNDED_SYNTHESIS');
  });
});
