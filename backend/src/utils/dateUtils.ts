/**
 * Date utility helpers — pure functions, no external dependencies.
 */

/**
 * Compute age in days from a Date to now.
 * Returns null if the date is invalid or in the future.
 */
export function computeAgeInDays(date: Date | string | null | undefined): number | null {
  if (!date) return null;

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  // Future dates → treat as unknown
  if (diffMs < 0) return null;

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a date for display in reports.
 */
export function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns a human-readable relative age string.
 */
export function relativeAge(ageInDays: number | null): string {
  if (ageInDays === null) return 'Unknown age';
  if (ageInDays === 0) return 'Today';
  if (ageInDays === 1) return '1 day ago';
  if (ageInDays < 7) return `${ageInDays} days ago`;
  if (ageInDays < 30) return `${Math.floor(ageInDays / 7)} weeks ago`;
  if (ageInDays < 365) return `${Math.floor(ageInDays / 30)} months ago`;
  return `${Math.floor(ageInDays / 365)} years ago`;
}
