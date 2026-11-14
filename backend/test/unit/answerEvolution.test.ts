import { answerEvolutionService } from '../../src/modules/verification/answerEvolutionService';
import { verificationService } from '../../src/modules/verification/verification.service';

jest.mock('../../src/modules/verification/verification.service');

describe('Answer Evolution Tracker', () => {
  const mockPrevReport = {
    sessionId: 'session-v1',
    completedAt: '2026-11-10T10:00:00Z',
    summary: {
      overallFreshnessScore: 35,
      overallRiskLevel: 'OUTDATED',
      totalClaims: 2,
      outdated: 1,
      supported: 1,
    },
    claims: [
      {
        claimId: 'claim-1',
        order: 1,
        claimText: 'Node.js 20 is the latest LTS release.',
        status: 'OUTDATED',
        verdict: 'CONTRADICTS',
        confidence: 0.95,
        explanation: 'Superseded by Node.js 22 LTS in October 2024.',
        supportingEvidence: [],
        contradictingEvidence: [],
        sources: [],
        verifiedAt: '2026-11-10T10:00:00Z',
      },
      {
        claimId: 'claim-2',
        order: 2,
        claimText: 'JavaScript runs in V8 engine.',
        status: 'SUPPORTED',
        verdict: 'CONFIRMS',
        confidence: 0.99,
        explanation: 'Established architectural fact.',
        supportingEvidence: [],
        contradictingEvidence: [],
        sources: [],
        verifiedAt: '2026-11-10T10:00:00Z',
      },
    ],
  };

  const mockCurrReport = {
    sessionId: 'session-v2',
    completedAt: '2026-11-12T10:00:00Z',
    summary: {
      overallFreshnessScore: 100,
      overallRiskLevel: 'FRESH',
      totalClaims: 3,
      outdated: 0,
      supported: 3,
    },
    claims: [
      {
        claimId: 'claim-1b',
        order: 1,
        claimText: 'Node.js 22 is the current Active LTS release.',
        status: 'SUPPORTED',
        verdict: 'CONFIRMS',
        confidence: 0.98,
        explanation: 'Confirmed by official nodejs.org release schedule.',
        supportingEvidence: [],
        contradictingEvidence: [],
        sources: [],
        verifiedAt: '2026-11-12T10:00:00Z',
      },
      {
        claimId: 'claim-2b',
        order: 2,
        claimText: 'JavaScript runs in V8 engine.',
        status: 'SUPPORTED',
        verdict: 'CONFIRMS',
        confidence: 0.99,
        explanation: 'Established architectural fact.',
        supportingEvidence: [],
        contradictingEvidence: [],
        sources: [],
        verifiedAt: '2026-11-12T10:00:00Z',
      },
      {
        claimId: 'claim-3b',
        order: 3,
        claimText: 'React 19 was officially released in December 2024.',
        status: 'SUPPORTED',
        verdict: 'CONFIRMS',
        confidence: 0.96,
        explanation: 'Confirmed by React blog.',
        supportingEvidence: [],
        contradictingEvidence: [],
        sources: [],
        verifiedAt: '2026-11-12T10:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    (verificationService.getVerificationResults as jest.Mock).mockImplementation((id: string) => {
      if (id === 'session-v1') return Promise.resolve(mockPrevReport);
      if (id === 'session-v2') return Promise.resolve(mockCurrReport);
      throw new Error('Not found');
    });
  });

  test('successfully tracks positive score delta and resolved staleness', async () => {
    const evolution = await answerEvolutionService.compareVersions('session-v1', 'session-v2');

    expect(evolution.previousScore).toBe(35);
    expect(evolution.currentScore).toBe(100);
    expect(evolution.scoreDelta).toBe(65);
    expect(evolution.stalenessResolvedCount).toBe(1);
    expect(evolution.summary).toContain('Freshness improved by +65%');
  });

  test('identifies added claims and unmodified claims correctly', async () => {
    const evolution = await answerEvolutionService.compareVersions('session-v1', 'session-v2');

    // Claim 3 (React 19) is brand new
    expect(evolution.addedClaims).toHaveLength(1);
    expect(evolution.addedClaims[0].claimText).toContain('React 19');

    // Claim 2 (JavaScript runs in V8) is unchanged
    expect(evolution.unmodifiedClaims).toHaveLength(1);
    expect(evolution.unmodifiedClaims[0].claimText).toContain('V8 engine');
  });

  test('constructs multi-version chronological evolution timeline', async () => {
    const evolution = await answerEvolutionService.compareVersions('session-v1', 'session-v2');

    expect(evolution.timeline).toHaveLength(2);
    expect(evolution.timeline[0].version).toBe(1);
    expect(evolution.timeline[0].overallFreshnessScore).toBe(35);
    expect(evolution.timeline[1].version).toBe(2);
    expect(evolution.timeline[1].overallFreshnessScore).toBe(100);
  });
});
