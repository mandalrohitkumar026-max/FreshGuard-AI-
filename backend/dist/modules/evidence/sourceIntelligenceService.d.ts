export type SourceCategory = 'OFFICIAL_PRIMARY' | 'GOVERNMENT_STANDARDS' | 'MAINSTREAM_JOURNALISM' | 'INDUSTRY_SECONDARY' | 'COMMUNITY_UNVERIFIED';
export interface SourceCredibilityProfile {
    url: string;
    domain: string;
    isPrimarySource: boolean;
    sourceCategory: SourceCategory;
    authorityTier: string;
    authorityScore: number;
    evidenceRelevanceScore: number;
    publishedDate: string | null;
    retrievedAt: string;
    corroboratingDomains: string[];
    corroborationCount: number;
    limitations: string[];
    credibilityFlags: {
        isOfficialRegistryOrOrigin: boolean;
        hasExplicitPublicationDate: boolean;
        hasIndependentCorroboration: boolean;
        isFreshWithin12Months: boolean;
        hasLimitations: boolean;
    };
}
export declare class SourceIntelligenceService {
    private primaryDomainPatterns;
    private journalismDomainPatterns;
    /**
     * Classifies a source as Primary or Secondary based on technical/governmental authority.
     */
    classifySourceCategory(url: string, domain: string): {
        isPrimary: boolean;
        category: SourceCategory;
    };
    /**
     * Calculates evidence relevance based on query keywords appearing in the snippet.
     */
    calculateRelevanceScore(query: string, content: string): number;
    /**
     * Evaluates evidence sources and produces deep source intelligence profiles.
     */
    profileEvidenceSource(source: {
        url: string;
        domain: string;
        title: string;
        content: string;
        publishedDate?: string | null;
        retrievedAt?: string;
        authorityScore?: number;
        authorityTier?: string;
    }, query: string, allSourceDomainsInSession?: string[]): SourceCredibilityProfile;
}
export declare const sourceIntelligenceService: SourceIntelligenceService;
//# sourceMappingURL=sourceIntelligenceService.d.ts.map