export interface VerificationAuditPackage {
    auditId: string;
    sessionId: string;
    fingerprint: {
        algorithm: 'sha256';
        hash: string;
        generatedAt: string;
    };
    provenance: {
        system: 'FreshGuard AI';
        version: '1.0.0-enterprise';
        gateway: 'Bifrost AI Gateway by Maxim AI (v2.5)';
        searchEngine: 'Tavily Agentic Search API';
        timestamp: string;
    };
    pipelineTelemetry: {
        stagesExecuted: string[];
        processingTimeMs: number;
        model: string;
        fallbackEngaged: boolean;
    };
    originalInput: {
        text: string;
        length: number;
        topic?: string;
    };
    claimsLineage: Array<{
        claimId: string;
        order: number;
        claimText: string;
        verdict: string;
        confidence: number;
        searchQuery?: string;
        evidenceSources: Array<{
            url: string;
            domain: string;
            publishedDate?: string | null;
            retrievedAt?: string;
            authorityScore?: number;
            isContradicting?: boolean;
        }>;
    }>;
    verdictSummary: {
        overallFreshnessScore: number;
        overallRiskLevel: string;
        totalClaims: number;
        staleClaims: number;
        supportedClaims: number;
        unverifiedClaims: number;
    };
}
export declare class AuditTrailService {
    /**
     * Generates a tamper-evident, reproducible audit trail package for a verification session.
     */
    generateAuditPackage(sessionId: string): Promise<VerificationAuditPackage>;
}
export declare const auditTrailService: AuditTrailService;
//# sourceMappingURL=auditTrailService.d.ts.map