// Shared helper for relative age display
export function relativeAge(ageInDays: number | null): string {
  if (ageInDays === null) return 'Unknown age';
  if (ageInDays === 0) return 'Today';
  if (ageInDays === 1) return '1 day ago';
  if (ageInDays < 7) return `${ageInDays} days ago`;
  if (ageInDays < 30) return `${Math.floor(ageInDays / 7)} weeks ago`;
  if (ageInDays < 365) return `${Math.floor(ageInDays / 30)} months ago`;
  return `${Math.floor(ageInDays / 365)} years ago`;
}
