import {
  verdictWeight,
  evidenceAgeWeight,
  authorityWeight,
  computeClaimFreshnessScore,
  computeAggregateScore,
  classifyRisk,
} from '../../src/utils/scoringFormula';

describe('scoringFormula — verdictWeight', () => {
  it('returns 1.0 for CONFIRMS', () => expect(verdictWeight('CONFIRMS')).toBe(1.0));
  it('returns 0.5 for PARTIALLY_CONTRADICTS', () => expect(verdictWeight('PARTIALLY_CONTRADICTS')).toBe(0.5));
  it('returns 0.0 for CONTRADICTS', () => expect(verdictWeight('CONTRADICTS')).toBe(0.0));
  it('returns 0.3 for INSUFFICIENT', () => expect(verdictWeight('INSUFFICIENT')).toBe(0.3));
});

describe('scoringFormula — evidenceAgeWeight', () => {
  it('returns 1.0 for 0 days', () => expect(evidenceAgeWeight(0)).toBe(1.0));
  it('returns 1.0 for 7 days', () => expect(evidenceAgeWeight(7)).toBe(1.0));
  it('returns 0.8 for 30 days', () => expect(evidenceAgeWeight(30)).toBe(0.8));
  it('returns 0.6 for 90 days', () => expect(evidenceAgeWeight(90)).toBe(0.6));
  it('returns 0.3 for 365 days', () => expect(evidenceAgeWeight(365)).toBe(0.3));
  it('returns 0.0 for 400 days', () => expect(evidenceAgeWeight(400)).toBe(0.0));
  it('returns 0.2 for null (unknown)', () => expect(evidenceAgeWeight(null)).toBe(0.2));
});

describe('scoringFormula — computeClaimFreshnessScore', () => {
  it('scores HIGH with CONFIRMS + recent HIGH-authority source', () => {
    const score = computeClaimFreshnessScore({
      verdict: 'CONFIRMS',
      bestEvidenceAgeInDays: 3,
      bestAuthorityTier: 'HIGH',
    });
    expect(score).toBeGreaterThanOrEqual(85);
  });

  it('caps CONTRADICTS score at 40', () => {
    const score = computeClaimFreshnessScore({
      verdict: 'CONTRADICTS',
      bestEvidenceAgeInDays: 1,
      bestAuthorityTier: 'HIGH',
    });
    expect(score).toBeLessThanOrEqual(40);
  });

  it('caps PARTIALLY_CONTRADICTS score at 65', () => {
    const score = computeClaimFreshnessScore({
      verdict: 'PARTIALLY_CONTRADICTS',
      bestEvidenceAgeInDays: 1,
      bestAuthorityTier: 'HIGH',
    });
    expect(score).toBeLessThanOrEqual(65);
  });

  it('never returns score above 100', () => {
    const score = computeClaimFreshnessScore({
      verdict: 'CONFIRMS',
      bestEvidenceAgeInDays: 0,
      bestAuthorityTier: 'HIGH',
    });
    expect(score).toBeLessThanOrEqual(100);
  });

  it('never returns score below 0', () => {
    const score = computeClaimFreshnessScore({
      verdict: 'CONTRADICTS',
      bestEvidenceAgeInDays: 1000,
      bestAuthorityTier: 'UNKNOWN',
    });
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('scoringFormula — computeAggregateScore', () => {
  it('returns 100 for empty claims array', () => {
    expect(computeAggregateScore({ claims: [] })).toBe(100);
  });

  it('weights HIGHLY_DYNAMIC 3x more than STATIC', () => {
    const score = computeAggregateScore({
      claims: [
        { timeSensitivity: 'STATIC', freshnessScore: 100, verdict: 'CONFIRMS' },
        { timeSensitivity: 'STATIC', freshnessScore: 100, verdict: 'CONFIRMS' },
        { timeSensitivity: 'HIGHLY_DYNAMIC', freshnessScore: 0, verdict: 'CONTRADICTS' },
      ],
    });
    // Weight: 1 + 1 + 3 = 5. Sum: 100 + 100 + 0 = 200. Avg: 200/5 = 40
    expect(score).toBe(40);
  });
});

describe('scoringFormula — classifyRisk', () => {
  it('returns FRESH for score >= 80', () => expect(classifyRisk(85, 3, 0)).toBe('FRESH'));
  it('returns STALE for score 60-79', () => expect(classifyRisk(70, 3, 0)).toBe('STALE'));
  it('returns OUTDATED for score < 60', () => expect(classifyRisk(55, 3, 0)).toBe('OUTDATED'));
  it('returns UNVERIFIABLE when >50% claims are insufficient', () => {
    expect(classifyRisk(90, 4, 3)).toBe('UNVERIFIABLE');
  });
});
