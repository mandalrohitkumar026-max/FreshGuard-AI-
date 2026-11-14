"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourceIntelligenceService = exports.SourceIntelligenceService = void 0;
class SourceIntelligenceService {
    primaryDomainPatterns = [
        // Official software registries & docs
        /\b(github\.com|gitlab\.com|npmjs\.com|pypi\.org|crates\.io|pkg\.go\.dev|maven\.org)\b/i,
        /\b(nodejs\.org|react\.dev|python\.org|golang\.org|rust-lang\.org|typescriptlang\.org|kubernetes\.io)\b/i,
        // Standards & scientific bodies
        /\b(w3\.org|ietf\.org|iso\.org|nature\.com|science\.org|arxiv\.org|nih\.gov|ieee\.org|acm\.org)\b/i,
        // Government, judicial & central banks
        /\.(gov|mil|fed\.us|europa\.eu)$/i,
        /\b(un\.org|who\.int|worldbank\.org|imf\.org|sec\.gov|federalreserve\.gov)\b/i,
        // Corporate primary newsrooms
        /\b(apple\.com\/newsroom|blog\.google|openai\.com|news\.microsoft\.com)\b/i,
    ];
    journalismDomainPatterns = [
        /\b(reuters\.com|apnews\.com|bloomberg\.com|wsj\.com|ft\.com|bbc\.(co\.uk|com)|nytimes\.com)\b/i,
        /\b(theverge\.com|techcrunch\.com|arstechnica\.com|wired\.com)\b/i,
    ];
    /**
     * Classifies a source as Primary or Secondary based on technical/governmental authority.
     */
    classifySourceCategory(url, domain) {
        const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
        const cleanUrl = url.toLowerCase();
        for (const pattern of this.primaryDomainPatterns) {
            if (pattern.test(cleanDomain) || pattern.test(cleanUrl)) {
                if (/\.(gov|mil)$/i.test(cleanDomain) || /\b(un\.org|who\.int|iso\.org|w3\.org)\b/i.test(cleanDomain)) {
                    return { isPrimary: true, category: 'GOVERNMENT_STANDARDS' };
                }
                return { isPrimary: true, category: 'OFFICIAL_PRIMARY' };
            }
        }
        for (const pattern of this.journalismDomainPatterns) {
            if (pattern.test(cleanDomain)) {
                return { isPrimary: false, category: 'MAINSTREAM_JOURNALISM' };
            }
        }
        if (/\b(medium\.com|dev\.to|stackoverflow\.com|reddit\.com|quora\.com|substack\.com)\b/i.test(cleanDomain)) {
            return { isPrimary: false, category: 'COMMUNITY_UNVERIFIED' };
        }
        return { isPrimary: false, category: 'INDUSTRY_SECONDARY' };
    }
    /**
     * Calculates evidence relevance based on query keywords appearing in the snippet.
     */
    calculateRelevanceScore(query, content) {
        if (!query || !content)
            return 0.5;
        const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
        if (queryTokens.length === 0)
            return 0.5;
        const lowerContent = content.toLowerCase();
        let matches = 0;
        for (const token of queryTokens) {
            if (lowerContent.includes(token)) {
                matches++;
            }
        }
        const ratio = matches / queryTokens.length;
        return parseFloat(Math.min(0.98, Math.max(0.35, ratio)).toFixed(2));
    }
    /**
     * Evaluates evidence sources and produces deep source intelligence profiles.
     */
    profileEvidenceSource(source, query, allSourceDomainsInSession = []) {
        const { isPrimary, category } = this.classifySourceCategory(source.url, source.domain);
        const relevanceScore = this.calculateRelevanceScore(query, source.content);
        // Compute independent corroboration: count unique external domains
        const currentApex = source.domain.toLowerCase().replace(/^www\./, '');
        const corroboratingDomains = Array.from(new Set(allSourceDomainsInSession
            .map((d) => d.toLowerCase().replace(/^www\./, ''))
            .filter((d) => d !== currentApex && d.length > 0)));
        const limitations = [];
        // Check for missing publication date
        if (!source.publishedDate) {
            limitations.push('Missing explicit publication date metadata — age inferred from retrieval window.');
        }
        else {
            const pubTime = new Date(source.publishedDate).getTime();
            const ageInDays = (Date.now() - pubTime) / (1000 * 60 * 60 * 24);
            if (ageInDays > 365) {
                limitations.push(`Publication date is >12 months old (${Math.round(ageInDays)} days); check for superseding updates.`);
            }
        }
        // Secondary source warning
        if (!isPrimary && category === 'COMMUNITY_UNVERIFIED') {
            limitations.push('User-generated community content — requires authoritative primary corroboration.');
        }
        else if (!isPrimary) {
            limitations.push('Secondary reporting source — subject to editorial latency or reporting synthesis.');
        }
        // Zero corroboration warning
        if (corroboratingDomains.length === 0 && !isPrimary) {
            limitations.push('Isolated finding without cross-domain corroboration.');
        }
        const pubTime = source.publishedDate ? new Date(source.publishedDate).getTime() : 0;
        const isFreshWithin12Months = source.publishedDate ? (Date.now() - pubTime) <= 1000 * 60 * 60 * 24 * 365 : false;
        return {
            url: source.url,
            domain: source.domain,
            isPrimarySource: isPrimary,
            sourceCategory: category,
            authorityTier: source.authorityTier || 'TIER_2',
            authorityScore: source.authorityScore ?? 0.75,
            evidenceRelevanceScore: relevanceScore,
            publishedDate: source.publishedDate || null,
            retrievedAt: source.retrievedAt || new Date().toISOString(),
            corroboratingDomains,
            corroborationCount: corroboratingDomains.length,
            limitations,
            credibilityFlags: {
                isOfficialRegistryOrOrigin: isPrimary,
                hasExplicitPublicationDate: Boolean(source.publishedDate),
                hasIndependentCorroboration: corroboratingDomains.length > 0,
                isFreshWithin12Months,
                hasLimitations: limitations.length > 0,
            },
        };
    }
}
exports.SourceIntelligenceService = SourceIntelligenceService;
exports.sourceIntelligenceService = new SourceIntelligenceService();
//# sourceMappingURL=sourceIntelligenceService.js.map