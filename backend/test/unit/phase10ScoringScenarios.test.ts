import { scoringService } from '../../src/modules/scoring/scoring.service';
import { scoringEngine } from '../../src/modules/scoring/scoring.engine';
import { ClaimScoringInput } from '../../src/modules/scoring/scoring.types';

describe('Phase 10 — 20-Scenario Advanced Freshness Scoring & Risk Evaluation Suite', () => {
  // Scenario 1: Stable Historical Fact (Apollo 11 in 1969)
  test('Scenario 01: Stable Historical Fact does not decay even with old source dates', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-01',
      order: 1,
      claimText: 'Apollo 11 landed on the Moon in July 1969.',
      timeSensitivity: 'STATIC',
      status: 'SUPPORTED',
      verdict: 'CONFIRMS',
      confidence: 0.99,
      evidence: [
        {
          url: 'https://nasa.gov/apollo11',
          domain: 'nasa.gov',
          authorityScore: 0.98,
          publishedDate: '1970-01-01T00:00:00Z', // 55 years old
          retrievedAt: '2026-11-12T00:00:00Z',
          sourceIntelligence: { isPrimarySource: true, corroborationCount: 4 },
        },
      ],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.freshnessScore).toBeGreaterThanOrEqual(90);
    expect(result.riskLevel).toBe('LOW');
    expect(result.factors.evidenceRecency).toBe(100);
    expect(result.factors.temporalRelevance).toBe(100);
  });

  // Scenario 2: Stable Mathematical Fact
  test('Scenario 02: Stable Mathematical Fact retains 100% freshness', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-02',
      order: 2,
      claimText: 'In Euclidean geometry, the sum of angles of a triangle is always 180 degrees.',
      timeSensitivity: 'STATIC',
      status: 'NOT_CHECKED',
      verdict: 'CONFIRMS',
      confidence: 1.0,
      evidence: [],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.freshnessScore).toBe(100);
    expect(result.riskLevel).toBe('LOW');
  });

  // Scenario 3: Recently Updated Software Version (React 19)
  test('Scenario 03: Recently updated software version with fresh primary evidence scores very fresh', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-03',
      order: 3,
      claimText: 'React 19 is the latest stable release.',
      timeSensitivity: 'SEMI_DYNAMIC',
      status: 'SUPPORTED',
      verdict: 'CONFIRMS',
      confidence: 0.95,
      evidence: [
        {
          url: 'https://react.dev/blog/react-19',
          domain: 'react.dev',
          authorityScore: 0.96,
          publishedDate: new Date(Date.now() - 14 * 86400000).toISOString(), // 14 days ago
          retrievedAt: new Date().toISOString(),
          sourceIntelligence: { isPrimarySource: true, corroborationCount: 3 },
        },
      ],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.freshnessScore).toBeGreaterThanOrEqual(80);
    expect(result.verificationStatus).toBe('SUPPORTED');
  });

  // Scenario 4: Outdated Software Version (Claiming Node.js 16 is LTS)
  test('Scenario 04: Outdated software version is capped at Severely Outdated (0-24)', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-04',
      order: 4,
      claimText: 'Node.js 16 is the latest active LTS release.',
      timeSensitivity: 'HIGHLY_DYNAMIC',
      status: 'OUTDATED',
      verdict: 'CONTRADICTS',
      confidence: 0.95,
      evidence: [
        {
          url: 'https://nodejs.org/en/about/previous-releases',
          domain: 'nodejs.org',
          authorityScore: 0.99,
          publishedDate: '2024-10-29T00:00:00Z',
          retrievedAt: '2026-11-12T00:00:00Z',
          isContradicting: true,
          sourceIntelligence: { isPrimarySource: true, corroborationCount: 2 },
        },
      ],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.freshnessScore).toBeLessThanOrEqual(24);
    expect(result.riskLevel).toBe('CRITICAL');
    expect(result.factors.verificationOutcome).toBe(0);
  });

  // Scenario 5: Current Office Holder (Highly Dynamic)
  test('Scenario 05: Current office holder evaluated with dynamic sensitivity', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-05',
      order: 5,
      claimText: 'Satya Nadella is the current CEO of Microsoft.',
      timeSensitivity: 'HIGHLY_DYNAMIC',
      status: 'SUPPORTED',
      verdict: 'CONFIRMS',
      confidence: 0.98,
      evidence: [
        {
          url: 'https://news.microsoft.com/exec/satya-nadella/',
          domain: 'microsoft.com',
          authorityScore: 0.95,
          publishedDate: '2026-01-01T00:00:00Z',
          retrievedAt: '2026-11-12T00:00:00Z',
          sourceIntelligence: { isPrimarySource: true, corroborationCount: 4 },
        },
      ],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.freshnessScore).toBeGreaterThanOrEqual(75);
    expect(result.riskLevel).toBe('MODERATE'); // Supported but highly volatile
  });

  // Scenario 6: Old Statistics (>5 years old in dynamic economic domain)
  test('Scenario 06: Aging economic statistics experience temporal recency decay', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-06',
      order: 6,
      claimText: 'Global inflation rate is currently 2.1%.',
      timeSensitivity: 'HIGHLY_DYNAMIC',
      status: 'SUPPORTED',
      verdict: 'CONFIRMS',
      confidence: 0.70,
      evidence: [
        {
          url: 'https://imf.org/data',
          domain: 'imf.org',
          authorityScore: 0.92,
          publishedDate: '2019-01-01T00:00:00Z', // 7 years old
          retrievedAt: '2026-11-12T00:00:00Z',
        },
      ],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.factors.evidenceRecency).toBeLessThan(40);
  });

  // Scenario 7: Conflicting Sources (Differing GDP estimations)
  test('Scenario 07: Conflicting sources receive appropriate penalty and moderate risk', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-07',
      order: 7,
      claimText: 'The population of Tokyo metropolitan area is 37 million.',
      timeSensitivity: 'SEMI_DYNAMIC',
      status: 'CONFLICTING',
      verdict: 'CONFLICTING',
      confidence: 0.75,
      evidence: [
        {
          url: 'https://un.org/cities',
          domain: 'un.org',
          authorityScore: 0.95,
          publishedDate: '2024-01-01T00:00:00Z',
        },
        {
          url: 'https://metro.tokyo.lg.jp',
          domain: 'metro.tokyo.lg.jp',
          authorityScore: 0.90,
          publishedDate: '2024-01-01T00:00:00Z',
        },
      ],
      conflictAnalysis: { hasConflict: true },
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.freshnessScore).toBeLessThanOrEqual(55);
    expect(result.riskLevel).toBe('MODERATE');
    expect(result.verificationStatus).toBe('CONFLICTING');
  });

  // Scenario 8: Missing Publication Dates
  test('Scenario 08: Missing publication dates penalizes uncertainty rather than falsely failing claim', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-08',
      order: 8,
      claimText: 'TypeScript supports strict null checks.',
      timeSensitivity: 'SEMI_DYNAMIC',
      status: 'SUPPORTED',
      verdict: 'CONFIRMS',
      confidence: 0.90,
      evidence: [
        {
          url: 'https://typescriptlang.org/docs',
          domain: 'typescriptlang.org',
          authorityScore: 0.95,
          publishedDate: null, // missing date
          retrievedAt: '2026-11-12T00:00:00Z',
        },
      ],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.factors.uncertainty).toBeLessThan(80);
    expect(result.freshnessScore).toBeGreaterThanOrEqual(75);
  });

  // Scenario 9: Unverified Claims
  test('Scenario 09: Unverified claims are not assumed false but scored moderately with review action', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-09',
      order: 9,
      claimText: 'Internal unannounced project code name is Project Chimera.',
      timeSensitivity: 'HIGHLY_DYNAMIC',
      status: 'UNVERIFIED',
      verdict: 'INSUFFICIENT',
      confidence: 0.30,
      evidence: [],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.freshnessScore).toBeLessThanOrEqual(50);
    expect(result.riskLevel).toBe('MODERATE');
    expect(result.recommendedAction).toContain('manual verification');
  });

  // Scenario 10: Partially Supported Claims
  test('Scenario 10: Partially supported claims reflect capped score (40-65)', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-10',
      order: 10,
      claimText: 'Python 3.12 was released in 2023 and is the newest version in 2026.',
      timeSensitivity: 'HIGHLY_DYNAMIC',
      status: 'PARTIALLY_SUPPORTED',
      verdict: 'PARTIALLY_CONTRADICTS',
      confidence: 0.85,
      evidence: [
        {
          url: 'https://python.org',
          domain: 'python.org',
          authorityScore: 0.96,
          publishedDate: '2024-10-01T00:00:00Z',
        },
      ],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.freshnessScore).toBeLessThanOrEqual(65);
    expect(result.freshnessScore).toBeGreaterThanOrEqual(40);
  });

  // Scenario 11: High-Volatility Claims
  test('Scenario 11: High-volatility claims receive higher weight in answer score', () => {
    const answer = scoringService.evaluateAnswer([
      {
        claimId: 'c1',
        order: 1,
        claimText: 'Bitcoin price is $88,000.',
        timeSensitivity: 'HIGHLY_DYNAMIC',
        status: 'OUTDATED',
        verdict: 'CONTRADICTS',
        confidence: 0.90,
        evidence: [],
      },
      {
        claimId: 'c2',
        order: 2,
        claimText: 'Earth orbits the Sun.',
        timeSensitivity: 'STATIC',
        status: 'NOT_CHECKED',
        verdict: 'CONFIRMS',
        confidence: 1.0,
        evidence: [],
      },
    ]);

    // The single outdated dynamic claim must pull the answer down significantly
    expect(answer.overallFreshnessScore).toBeLessThanOrEqual(40);
    expect(answer.overallRiskLevel).toBe('CRITICAL');
  });

  // Scenario 12: Low-Volatility Claims
  test('Scenario 12: Low-volatility claims dominate overall score when verified fresh', () => {
    const answer = scoringService.evaluateAnswer([
      {
        claimId: 'c1',
        order: 1,
        claimText: 'Water molecule contains two hydrogen atoms and one oxygen atom.',
        timeSensitivity: 'STATIC',
        status: 'SUPPORTED',
        verdict: 'CONFIRMS',
        confidence: 1.0,
        evidence: [],
      },
      {
        claimId: 'c2',
        order: 2,
        claimText: 'The Declaration of Independence was adopted in 1776.',
        timeSensitivity: 'STATIC',
        status: 'SUPPORTED',
        verdict: 'CONFIRMS',
        confidence: 1.0,
        evidence: [],
      },
    ]);

    expect(answer.overallFreshnessScore).toBe(100);
    expect(answer.overallRiskLevel).toBe('LOW');
  });

  // Scenario 13: Mixed Answers With Stable and Volatile Claims
  test('Scenario 13: Mixed answer evaluates volatility-weighted aggregation without diluting stale claims', () => {
    const answer = scoringService.evaluateAnswer([
      {
        claimId: 'm1',
        order: 1,
        claimText: 'React was created by Jordan Walke in 2013.',
        timeSensitivity: 'STATIC',
        status: 'SUPPORTED',
        verdict: 'CONFIRMS',
        confidence: 1.0,
        evidence: [],
      },
      {
        claimId: 'm2',
        order: 2,
        claimText: 'React 17 is the current version.',
        timeSensitivity: 'HIGHLY_DYNAMIC',
        status: 'OUTDATED',
        verdict: 'CONTRADICTS',
        confidence: 0.95,
        evidence: [],
      },
    ]);

    expect(answer.overallFreshnessScore).toBeLessThanOrEqual(40);
    expect(answer.outdatedClaims).toBe(1);
  });

  // Scenario 14: Incorrect but Non-Stale Claims
  test('Scenario 14: False claims with non-temporal errors are separated conceptually', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-14',
      order: 14,
      claimText: 'Python was created by Bjarne Stroustrup in 1985.',
      timeSensitivity: 'STATIC',
      status: 'OUTDATED', // Contradicted
      verdict: 'CONTRADICTS',
      confidence: 0.95,
      evidence: [
        {
          url: 'https://python.org',
          domain: 'python.org',
          authorityScore: 0.98,
          publishedDate: '1991-01-01T00:00:00Z',
          isContradicting: true,
        },
      ],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.freshnessScore).toBeLessThanOrEqual(24);
    expect(result.riskLevel).toBe('HIGH');
  });

  // Scenario 15: Claims With No Retrieved Evidence
  test('Scenario 15: Claims with no retrieved evidence handle zero division safely', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-15',
      order: 15,
      claimText: 'Hyper-localized unindexed observation.',
      timeSensitivity: 'HIGHLY_DYNAMIC',
      status: 'UNVERIFIED',
      verdict: 'INSUFFICIENT',
      confidence: 0.0,
      evidence: [],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.freshnessScore).toBeDefined();
    expect(result.factors.evidenceQuality).toBe(35);
  });

  // Scenario 16: Missing Evidence in Empty Answer
  test('Scenario 16: Empty answer claims array evaluates safely to 100 with Low Risk', () => {
    const answer = scoringService.evaluateAnswer([]);
    expect(answer.overallFreshnessScore).toBe(100);
    expect(answer.overallRiskLevel).toBe('LOW');
  });

  // Scenario 17: Multiple Corroborating Primary Sources
  test('Scenario 17: Multi-corroborated primary source maximizes quality factor', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-17',
      order: 17,
      claimText: 'Kubernetes v1.31 is an active release.',
      timeSensitivity: 'SEMI_DYNAMIC',
      status: 'SUPPORTED',
      verdict: 'CONFIRMS',
      confidence: 0.95,
      evidence: [
        {
          url: 'https://kubernetes.io/releases',
          domain: 'kubernetes.io',
          authorityScore: 0.95,
          publishedDate: '2024-09-01T00:00:00Z',
          sourceIntelligence: { isPrimarySource: true, corroborationCount: 5 },
        },
      ],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.factors.evidenceQuality).toBeGreaterThanOrEqual(90);
  });

  // Scenario 18: Forum-Only Unverified Evidence
  test('Scenario 18: Community forum source receives reduced quality weighting', () => {
    const claim: ClaimScoringInput = {
      claimId: 'scen-18',
      order: 18,
      claimText: 'Workaround exists for bug XYZ in build 12.',
      timeSensitivity: 'HIGHLY_DYNAMIC',
      status: 'SUPPORTED',
      verdict: 'CONFIRMS',
      confidence: 0.60,
      evidence: [
        {
          url: 'https://reddit.com/r/tech/123',
          domain: 'reddit.com',
          authorityScore: 0.40,
          publishedDate: '2024-01-01T00:00:00Z',
          sourceIntelligence: { isPrimarySource: false, corroborationCount: 0 },
        },
      ],
    };

    const result = scoringService.evaluateClaim(claim);
    expect(result.factors.evidenceQuality).toBeLessThan(50);
  });

  // Scenario 19: All Claims Severely Outdated
  test('Scenario 19: Entirely outdated answer returns Severely Outdated interpretation', () => {
    const answer = scoringService.evaluateAnswer([
      {
        claimId: 'o1',
        order: 1,
        claimText: 'Node 14 is current.',
        timeSensitivity: 'HIGHLY_DYNAMIC',
        status: 'OUTDATED',
        verdict: 'CONTRADICTS',
        confidence: 0.90,
        evidence: [],
      },
      {
        claimId: 'o2',
        order: 2,
        claimText: 'React 16 is current.',
        timeSensitivity: 'HIGHLY_DYNAMIC',
        status: 'OUTDATED',
        verdict: 'CONTRADICTS',
        confidence: 0.90,
        evidence: [],
      },
    ]);

    expect(answer.freshnessInterpretation).toBe('SEVERELY_OUTDATED');
    expect(answer.overallFreshnessScore).toBeLessThanOrEqual(24);
    expect(answer.overallRiskLevel).toBe('CRITICAL');
  });

  // Scenario 20: Completely Clean All-Fresh Modern Answer
  test('Scenario 20: Completely verified fresh answer achieves 90+ Very Fresh score', () => {
    const answer = scoringService.evaluateAnswer([
      {
        claimId: 'f1',
        order: 1,
        claimText: 'Node.js 22 is LTS.',
        timeSensitivity: 'SEMI_DYNAMIC',
        status: 'SUPPORTED',
        verdict: 'CONFIRMS',
        confidence: 0.98,
        evidence: [
          {
            url: 'https://nodejs.org',
            domain: 'nodejs.org',
            authorityScore: 0.98,
            publishedDate: new Date(Date.now() - 10 * 86400000).toISOString(),
            sourceIntelligence: { isPrimarySource: true, corroborationCount: 3 },
          },
        ],
      },
      {
        claimId: 'f2',
        order: 2,
        claimText: 'JavaScript supports async/await syntax.',
        timeSensitivity: 'STATIC',
        status: 'SUPPORTED',
        verdict: 'CONFIRMS',
        confidence: 1.0,
        evidence: [],
      },
    ]);

    expect(answer.freshnessInterpretation).toBe('VERY_FRESH');
    expect(answer.overallFreshnessScore).toBeGreaterThanOrEqual(90);
    expect(answer.overallRiskLevel).toBe('LOW');
  });
});
