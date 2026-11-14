import { AuthorityTier } from './scoringFormula';
/**
 * Extract the apex domain from a URL string.
 * e.g. "https://docs.react.dev/..." → "react.dev"
 */
export declare function extractDomain(url: string): string;
/**
 * Determine the authority tier for a given URL.
 */
export declare function getDomainAuthorityTier(url: string): AuthorityTier;
/**
 * Compute a numeric authority score 0–1 combining tier + Tavily relevance score.
 */
export declare function computeAuthorityScore(url: string, tavilyScore: number): {
    tier: AuthorityTier;
    score: number;
};
//# sourceMappingURL=domainAuthority.d.ts.map