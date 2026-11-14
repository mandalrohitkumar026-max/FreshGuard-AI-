import { computeAgeInDays, relativeAge } from '../../src/utils/dateUtils';

describe('dateUtils — computeAgeInDays', () => {
  it('returns 0 for today', () => {
    expect(computeAgeInDays(new Date())).toBe(0);
  });
  it('returns ~7 for a week ago', () => {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    expect(computeAgeInDays(d)).toBe(7);
  });
  it('returns null for null input', () => {
    expect(computeAgeInDays(null)).toBeNull();
  });
  it('returns null for future dates', () => {
    const future = new Date(Date.now() + 1000000);
    expect(computeAgeInDays(future)).toBeNull();
  });
  it('accepts string dates', () => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(computeAgeInDays(d.toISOString())).toBe(1);
  });
});

describe('dateUtils — relativeAge', () => {
  it('returns "Unknown age" for null', () => expect(relativeAge(null)).toBe('Unknown age'));
  it('returns "Today" for 0', () => expect(relativeAge(0)).toBe('Today'));
  it('returns "1 day ago" for 1', () => expect(relativeAge(1)).toBe('1 day ago'));
  it('returns weeks for 14 days', () => expect(relativeAge(14)).toContain('weeks'));
  it('returns months for 60 days', () => expect(relativeAge(60)).toContain('months'));
  it('returns years for 400 days', () => expect(relativeAge(400)).toContain('years'));
});
