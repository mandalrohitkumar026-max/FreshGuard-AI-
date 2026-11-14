import { sourceIntelligenceService } from '../../src/modules/evidence/sourceIntelligenceService';

describe('Source Intelligence Engine', () => {
  test('accurately classifies official registries and language documentation as primary sources', () => {
    const nodeSource = sourceIntelligenceService.classifySourceCategory(
      'https://nodejs.org/en/blog/release/v22.0.0',
      'nodejs.org',
    );
    expect(nodeSource.isPrimary).toBe(true);
    expect(nodeSource.category).toBe('OFFICIAL_PRIMARY');

    const govSource = sourceIntelligenceService.classifySourceCategory(
      'https://www.census.gov/popclock/',
      'census.gov',
    );
    expect(govSource.isPrimary).toBe(true);
    expect(govSource.category).toBe('GOVERNMENT_STANDARDS');
  });

  test('classifies mainstream press and tech news as secondary sources', () => {
    const reuters = sourceIntelligenceService.classifySourceCategory(
      'https://www.reuters.com/technology/article-123',
      'reuters.com',
    );
    expect(reuters.isPrimary).toBe(false);
    expect(reuters.category).toBe('MAINSTREAM_JOURNALISM');

    const techcrunch = sourceIntelligenceService.classifySourceCategory(
      'https://techcrunch.com/2024/05/01/react-19',
      'techcrunch.com',
    );
    expect(techcrunch.isPrimary).toBe(false);
    expect(techcrunch.category).toBe('MAINSTREAM_JOURNALISM');
  });

  test('calculates independent cross-domain corroboration counts', () => {
    const allDomains = ['react.dev', 'github.com', 'techcrunch.com', 'developer.mozilla.org'];

    const profile = sourceIntelligenceService.profileEvidenceSource(
      {
        url: 'https://react.dev/blog/react-19',
        domain: 'react.dev',
        title: 'React 19 Announcement',
        content: 'React 19 features actions, compiler integration, and server components.',
        publishedDate: '2024-12-05T00:00:00Z',
        retrievedAt: '2026-11-12T00:00:00Z',
      },
      'React 19 features',
      allDomains,
    );

    expect(profile.isPrimarySource).toBe(true);
    expect(profile.corroborationCount).toBe(3);
    expect(profile.corroboratingDomains).toEqual(['github.com', 'techcrunch.com', 'developer.mozilla.org']);
    expect(profile.credibilityFlags.hasIndependentCorroboration).toBe(true);
  });

  test('flags limitations when publication date is missing or user-generated forum', () => {
    const profile = sourceIntelligenceService.profileEvidenceSource(
      {
        url: 'https://stackoverflow.com/questions/123456',
        domain: 'stackoverflow.com',
        title: 'How to use React 19',
        content: 'You can install react@next to test.',
        publishedDate: null, // missing date
        retrievedAt: '2026-11-12T00:00:00Z',
      },
      'React 19 install',
      ['stackoverflow.com'],
    );

    expect(profile.isPrimarySource).toBe(false);
    expect(profile.sourceCategory).toBe('COMMUNITY_UNVERIFIED');
    expect(profile.limitations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing explicit publication date metadata'),
        expect.stringContaining('User-generated community content'),
      ]),
    );
  });
});
