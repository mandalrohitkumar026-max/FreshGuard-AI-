/**
 * Date utility helpers — pure functions, no external dependencies.
 */
/**
 * Compute age in days from a Date to now.
 * Returns null if the date is invalid or in the future.
 */
export declare function computeAgeInDays(date: Date | string | null | undefined): number | null;
/**
 * Format a date for display in reports.
 */
export declare function formatDate(date: Date | string): string;
/**
 * Returns a human-readable relative age string.
 */
export declare function relativeAge(ageInDays: number | null): string;
//# sourceMappingURL=dateUtils.d.ts.map