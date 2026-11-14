import { getDomainAuthorityTier, extractDomain, computeAuthorityScore } from '../../src/utils/domainAuthority';

describe('domainAuthority — extractDomain', () => {
  it('extracts apex domain from full URL', () => {
    expect(extractDomain('https://docs.react.dev/learn')).toBe('react.dev');
  });
  it('removes www prefix', () => {
    expect(extractDomain('https://www.reuters.com/article')).toBe('reuters.com');
  });
  it('returns empty string for invalid URL', () => {
    expect(extractDomain('not-a-url')).toBe('');
  });
});

describe('domainAuthority — getDomainAuthorityTier', () => {
  it('rates react.dev as HIGH', () => expect(getDomainAuthorityTier('https://react.dev')).toBe('HIGH'));
  it('rates nodejs.org as HIGH', () => expect(getDomainAuthorityTier('https://nodejs.org')).toBe('HIGH'));
  it('rates reuters.com as HIGH', () => expect(getDomainAuthorityTier('https://reuters.com/story')).toBe('HIGH'));
  it('rates medium.com as MEDIUM', () => expect(getDomainAuthorityTier('https://medium.com/@user')).toBe('MEDIUM'));
  it('rates github.com as MEDIUM', () => expect(getDomainAuthorityTier('https://github.com/repo')).toBe('MEDIUM'));
  it('rates reddit.com as LOW', () => expect(getDomainAuthorityTier('https://reddit.com/r/js')).toBe('LOW'));
  it('rates unknown domain as UNKNOWN', () => expect(getDomainAuthorityTier('https://randomblog123.xyz')).toBe('UNKNOWN'));
  it('rates .gov domains as HIGH', () => expect(getDomainAuthorityTier('https://cdc.gov/health')).toBe('HIGH'));
});

describe('domainAuthority — computeAuthorityScore', () => {
  it('gives HIGH domain a score > 0.75', () => {
    const { score } = computeAuthorityScore('https://react.dev', 0.9);
    expect(score).toBeGreaterThan(0.75);
  });
  it('gives UNKNOWN domain a score < 0.5', () => {
    const { score } = computeAuthorityScore('https://randomblog.xyz', 0.5);
    expect(score).toBeLessThan(0.5);
  });
  it('returns both tier and score', () => {
    const result = computeAuthorityScore('https://reuters.com', 0.8);
    expect(result).toHaveProperty('tier');
    expect(result).toHaveProperty('score');
  });
});
