import { conflictDetectionService } from '../../src/modules/verification/conflictDetectionService';
import { VerifiedEvidenceItem } from '../../src/modules/verification/verification.types';

describe('Evidence Conflict Detector', () => {
  const mockSupporting: VerifiedEvidenceItem = {
    url: 'https://nodejs.org/en/about/previous-releases',
    title: 'Node.js Releases',
    content: 'Node.js 20 is the current Active LTS release. Node.js 22 enters LTS in October 2024.',
    domain: 'nodejs.org',
    authorityScore: 0.95,
    authorityTier: 'TIER_1',
    publishedDate: '2024-04-20T00:00:00Z',
    retrievedAt: '2026-11-12T00:00:00Z',
  };

  const mockContradictingTemporal: VerifiedEvidenceItem = {
    url: 'https://nodejs.org/en/blog/release/v22.0.0',
    title: 'Node.js 22 is Now Active LTS',
    content: 'Node.js 22 has transitioned into Active Long Term Support, succeeding Node.js 20.',
    domain: 'nodejs.org',
    authorityScore: 0.98,
    authorityTier: 'TIER_1',
    publishedDate: '2024-10-29T00:00:00Z',
    retrievedAt: '2026-11-12T00:00:00Z',
  };

  const mockContradictingContextual: VerifiedEvidenceItem = {
    url: 'https://react.dev/blog/2024/04/25/react-19-beta',
    title: 'React 19 Beta Release',
    content: 'React 19 is now available in Beta and Canary channels for library authors to test.',
    domain: 'react.dev',
    authorityScore: 0.96,
    authorityTier: 'TIER_1',
    publishedDate: '2024-04-25T00:00:00Z',
    retrievedAt: '2026-11-12T00:00:00Z',
  };

  test('detects no conflict when all evidence is harmonious and claim is supported', () => {
    const analysis = conflictDetectionService.analyzeConflicts(
      'Water boils at 100 degrees Celsius at sea level.',
      [mockSupporting],
      [],
      'SUPPORTED',
    );

    expect(analysis.hasConflict).toBe(false);
    expect(analysis.conflictType).toBe('NONE');
    expect(analysis.severity).toBe('NONE');
    expect(analysis.sourceDisagreements).toHaveLength(0);
  });

  test('detects temporal supersedence when sources differ over time (>30 days)', () => {
    const analysis = conflictDetectionService.analyzeConflicts(
      'Node.js 20 is the latest LTS version.',
      [mockSupporting],
      [mockContradictingTemporal],
      'OUTDATED',
    );

    expect(analysis.hasConflict).toBe(true);
    expect(analysis.conflictType).toBe('TEMPORAL_SUPERSEDENCE');
    expect(analysis.severity).toBe('HIGH');
    expect(analysis.sourceDisagreements).toHaveLength(1);
    expect(analysis.sourceDisagreements[0].natureOfDisagreement).toContain('Publication dates indicate information evolved over time');
    expect(analysis.recommendedResolution).toContain('recently published authoritative evidence');
  });

  test('detects contextual difference when sources refer to distinct release channels (Beta/Canary/Stable)', () => {
    const stableSource: VerifiedEvidenceItem = {
      url: 'https://react.dev',
      title: 'React Home',
      content: 'The stable release is React 18.3. React 19 is in Canary channel.',
      domain: 'react.dev',
      authorityScore: 0.95,
      authorityTier: 'TIER_1',
      publishedDate: '2024-04-25T00:00:00Z',
      retrievedAt: '2026-11-12T00:00:00Z',
    };

    const analysis = conflictDetectionService.analyzeConflicts(
      'React 19 is the latest stable release.',
      [stableSource],
      [mockContradictingContextual],
      'CONFLICTING',
    );

    expect(analysis.hasConflict).toBe(true);
    expect(analysis.conflictType).toBe('CONTEXTUAL_DIFFERENCE');
    expect(analysis.sourceDisagreements[0].isContextual).toBe(true);
    expect(analysis.sourceDisagreements[0].contextualFactor).toContain('Different release channels');
  });

  test('does not assume majority vote is automatically correct when 3 low-tier blogs contradict 1 official source', () => {
    const lowTierBlog1: VerifiedEvidenceItem = {
      url: 'https://random-tech-blog1.com/post',
      title: 'Blog 1',
      content: 'Old obsolete assertion repeated',
      domain: 'random-tech-blog1.com',
      authorityScore: 0.35,
      authorityTier: 'TIER_4',
      publishedDate: '2024-01-01T00:00:00Z',
      retrievedAt: '2026-11-12T00:00:00Z',
    };
    const lowTierBlog2: VerifiedEvidenceItem = {
      url: 'https://random-tech-blog2.com/post',
      title: 'Blog 2',
      content: 'Old obsolete assertion repeated',
      domain: 'random-tech-blog2.com',
      authorityScore: 0.30,
      authorityTier: 'TIER_4',
      publishedDate: '2024-01-01T00:00:00Z',
      retrievedAt: '2026-11-12T00:00:00Z',
    };

    const authoritativeSource: VerifiedEvidenceItem = {
      url: 'https://official-registry.org/current',
      title: 'Official Registry 2026',
      content: 'Current authoritative data',
      domain: 'official-registry.org',
      authorityScore: 0.99,
      authorityTier: 'TIER_1',
      publishedDate: '2026-01-01T00:00:00Z',
      retrievedAt: '2026-11-12T00:00:00Z',
    };

    const analysis = conflictDetectionService.analyzeConflicts(
      'Test factual assertion',
      [lowTierBlog1, lowTierBlog2],
      [authoritativeSource],
      'OUTDATED',
    );

    expect(analysis.hasConflict).toBe(true);
    // Recommended resolution explicitly points to the authoritative domain rather than raw count
    expect(analysis.recommendedResolution).toContain('official-registry.org');
    expect(analysis.authoritativeSourceUrl).toBe('https://official-registry.org/current');
  });
});
