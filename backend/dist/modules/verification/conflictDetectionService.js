"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conflictDetectionService = exports.ConflictDetectionService = void 0;
const logger_1 = require("../../config/logger");
const EvidenceConflict_1 = require("../../models/EvidenceConflict");
const sessionStore_1 = require("../../services/sessionStore");
const mongoose_1 = __importDefault(require("mongoose"));
class ConflictDetectionService {
    /**
     * Analyzes supporting and contradicting evidence for a claim to detect,
     * categorize, and explain source-by-source conflicts without assuming
     * that majority vote equals truth.
     */
    analyzeConflicts(claimText, supportingEvidence, contradictingEvidence, claimStatus) {
        const allEvidence = [...supportingEvidence, ...contradictingEvidence];
        // If fewer than 2 sources, or no contradicting evidence and status is supported, no conflict exists
        if (allEvidence.length < 2 && contradictingEvidence.length === 0) {
            const isInsufficient = claimStatus === 'UNVERIFIED' || allEvidence.length === 0;
            return {
                hasConflict: false,
                conflictType: isInsufficient ? 'INSUFFICIENT_EVIDENCE' : 'NONE',
                severity: 'NONE',
                explanation: isInsufficient
                    ? 'Insufficient independent evidence available from public search to establish consensus or divergence.'
                    : 'Single or harmonious evidence profile; no multi-source discrepancy detected.',
                sourceDisagreements: [],
                recommendedResolution: isInsufficient
                    ? 'Broaden retrieval parameters or cross-examine specialized documentation.'
                    : 'Accept verified evidence findings.',
                distinctionNotes: 'Insufficient independent sources to evaluate divergence.',
            };
        }
        const hasContradictingSources = contradictingEvidence.length > 0;
        const isOutdated = claimStatus === 'OUTDATED';
        const isConflicting = claimStatus === 'CONFLICTING';
        const isPartiallySupported = claimStatus === 'PARTIALLY_SUPPORTED';
        if (!hasContradictingSources && !isConflicting && !isPartiallySupported) {
            return {
                hasConflict: false,
                conflictType: 'NONE',
                severity: 'NONE',
                explanation: 'All retrieved sources concur with the asserted claim.',
                sourceDisagreements: [],
                recommendedResolution: 'Consensus across independent authoritative sources.',
                distinctionNotes: 'No conflicting assertions found in retrieved evidence.',
            };
        }
        // Identify disagreements pairwise
        const disagreements = [];
        // Compare highest-authority supporting vs highest-authority contradicting source
        const primarySupport = supportingEvidence.sort((a, b) => (b.authorityScore || 0) - (a.authorityScore || 0))[0];
        const primaryContradict = contradictingEvidence.sort((a, b) => (b.authorityScore || 0) - (a.authorityScore || 0))[0];
        let conflictType = 'DIRECT_CONTRADICTION';
        let severity = 'HIGH';
        let contextualFactor = undefined;
        let isContextual = false;
        // Evaluate temporal supersedence
        if (primarySupport && primaryContradict) {
            const dateSupport = primarySupport.publishedDate ? new Date(primarySupport.publishedDate).getTime() : null;
            const dateContradict = primaryContradict.publishedDate ? new Date(primaryContradict.publishedDate).getTime() : null;
            if (dateSupport && dateContradict && Math.abs(dateSupport - dateContradict) > 1000 * 60 * 60 * 24 * 30) {
                // Discrepancy separated by > 30 days
                conflictType = 'TEMPORAL_SUPERSEDENCE';
                severity = isOutdated ? 'HIGH' : 'MEDIUM';
                contextualFactor = 'Publication dates indicate information evolved over time (temporal shift rather than error).';
            }
            else if (/\b(beta|canary|lts|nightly|preview|experimental|standard|current|stable)\b/i.test(primarySupport.content + primaryContradict.content)) {
                conflictType = 'CONTEXTUAL_DIFFERENCE';
                severity = 'MEDIUM';
                isContextual = true;
                contextualFactor = 'Different release channels (e.g. Stable LTS vs Beta/Canary preview) or contextual scopes.';
            }
            else if (/\b(us|uk|eu|global|regional|state|federal|gdp|metric|nominal|ppp)\b/i.test(primarySupport.content + primaryContradict.content)) {
                conflictType = 'METHODOLOGY_DISCREPANCY';
                severity = 'MEDIUM';
                isContextual = true;
                contextualFactor = 'Discrepancy stems from different measurement methodologies, geographical scopes, or reporting baselines.';
            }
            else {
                // Evaluate numerical disagreement
                const extractNums = (s) => (s.match(/\b\d+(?:\.\d+)?(?:%|\$|€|£|k|m|b)?\b/gi) || []).map((x) => x.toLowerCase());
                const claimNums = extractNums(claimText);
                const suppNums = extractNums(primarySupport.content);
                const contraNums = extractNums(primaryContradict.content);
                const hasDivergentNumber = (claimNums.length > 0 && contraNums.length > 0 && contraNums.some((n) => !claimNums.includes(n))) ||
                    (suppNums.length > 0 && contraNums.length > 0 && contraNums.some((n) => !suppNums.includes(n)));
                if (hasDivergentNumber) {
                    conflictType = 'NUMERICAL_DISAGREEMENT';
                    severity = 'HIGH';
                    contextualFactor = 'Contradictory numerical figures or statistical metrics reported across sources.';
                }
            }
            disagreements.push({
                sourceA: {
                    url: primarySupport.url,
                    domain: primarySupport.domain,
                    title: primarySupport.title,
                    assertion: primarySupport.content.slice(0, 150) + '...',
                    publishedDate: primarySupport.publishedDate,
                    authorityTier: primarySupport.authorityTier,
                    authorityScore: primarySupport.authorityScore,
                },
                sourceB: {
                    url: primaryContradict.url,
                    domain: primaryContradict.domain,
                    title: primaryContradict.title,
                    assertion: primaryContradict.content.slice(0, 150) + '...',
                    publishedDate: primaryContradict.publishedDate,
                    authorityTier: primaryContradict.authorityTier,
                    authorityScore: primaryContradict.authorityScore,
                },
                natureOfDisagreement: contextualFactor || 'Direct factual divergence between asserted claim and retrieved evidence.',
                conflictType,
                isContextual,
                contextualFactor,
            });
        }
        // Determine authoritative source vs majority source
        const allSortedByAuthority = [...allEvidence].sort((a, b) => (b.authorityScore || 0) - (a.authorityScore || 0));
        const mostAuthoritative = allSortedByAuthority[0];
        const majorityIsSupporting = supportingEvidence.length >= contradictingEvidence.length;
        const majorityAssertion = majorityIsSupporting
            ? `Supported by ${supportingEvidence.length} of ${allEvidence.length} sources`
            : `Contradicted by ${contradictingEvidence.length} of ${allEvidence.length} sources`;
        const authoritativeAssertion = mostAuthoritative
            ? `${mostAuthoritative.domain} (${mostAuthoritative.authorityTier || 'Tier 1'}) asserts: "${mostAuthoritative.title}"`
            : undefined;
        let explanation = '';
        let recommendedResolution = '';
        if (conflictType === 'TEMPORAL_SUPERSEDENCE') {
            explanation = `Temporal divergence detected: Evidence reflects past and current states across differing timeframes.`;
            recommendedResolution = `Prioritize the most recently published authoritative evidence (${mostAuthoritative?.domain || 'primary source'}) and discard outdated historical assertions.`;
        }
        else if (conflictType === 'NUMERICAL_DISAGREEMENT') {
            explanation = `Numerical divergence detected: Sources report conflicting figures, percentages, or financial metrics.`;
            recommendedResolution = `Adopt the figures certified by the primary regulatory or statistical authority (${mostAuthoritative?.domain || 'official standard'}).`;
        }
        else if (conflictType === 'CONTEXTUAL_DIFFERENCE') {
            explanation = `Contextual nuance detected: Sources refer to distinct scopes, deployment tiers, or release channels.`;
            recommendedResolution = `Clarify operational context (e.g. explicitly distinguish LTS from Current/Nightly releases).`;
        }
        else if (conflictType === 'METHODOLOGY_DISCREPANCY') {
            explanation = `Measurement variance detected: Independent organizations utilize differing calculation criteria or definitions.`;
            recommendedResolution = `Attribute specific metrics to their originating reporting agency or primary census standard.`;
        }
        else {
            explanation = `Substantive contradiction detected across independent reporting sources.`;
            recommendedResolution = `Adopt the stance of the highest-authority primary source (${mostAuthoritative?.domain}) rather than relying on raw web source frequency.`;
        }
        const distinctionNotes = isContextual
            ? 'Genuine conflict is mitigated by differing context/scope; sources are both partially correct in their respective domains.'
            : 'Direct factual contradiction exists; one assertion is superseded or incorrect.';
        logger_1.logger.info('Conflict analysis completed for claim', {
            claimText: claimText.slice(0, 40),
            hasConflict: true,
            conflictType,
            severity,
        });
        return {
            hasConflict: true,
            conflictType,
            severity,
            explanation,
            sourceDisagreements: disagreements,
            majorityAssertion,
            authoritativeAssertion,
            authoritativeSourceUrl: mostAuthoritative?.url,
            recommendedResolution,
            distinctionNotes,
        };
    }
    /**
     * Persists detected evidence conflict analysis to MongoDB.
     */
    async persistConflict(sessionId, claimId, claimText, analysis) {
        if ((0, sessionStore_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(sessionId) && analysis.hasConflict) {
            try {
                await EvidenceConflict_1.EvidenceConflict.findOneAndUpdate({ sessionId: new mongoose_1.default.Types.ObjectId(sessionId), claimId }, {
                    sessionId: new mongoose_1.default.Types.ObjectId(sessionId),
                    claimId,
                    claimText,
                    conflictType: analysis.conflictType,
                    severity: analysis.severity === 'NONE' ? 'LOW' : analysis.severity,
                    explanation: analysis.explanation,
                    sourceDisagreements: analysis.sourceDisagreements,
                    majorityAssertion: analysis.majorityAssertion,
                    authoritativeAssertion: analysis.authoritativeAssertion,
                    authoritativeSourceUrl: analysis.authoritativeSourceUrl,
                    recommendedResolution: analysis.recommendedResolution,
                    distinctionNotes: analysis.distinctionNotes,
                }, { upsert: true, new: true });
            }
            catch (err) {
                logger_1.logger.warn('Failed to persist EvidenceConflict to MongoDB', { error: err.message });
            }
        }
    }
}
exports.ConflictDetectionService = ConflictDetectionService;
exports.conflictDetectionService = new ConflictDetectionService();
//# sourceMappingURL=conflictDetectionService.js.map