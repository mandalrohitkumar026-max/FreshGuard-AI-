import mongoose, { Document, Model } from 'mongoose';
export type CanonicalConflictType = 'DIRECT_CONTRADICTION' | 'NUMERICAL_DISAGREEMENT' | 'TEMPORAL_DIFFERENCE' | 'CONTEXTUAL_DIFFERENCE' | 'INSUFFICIENT_EVIDENCE';
export type CanonicalConflictSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export interface IEvidenceConflict extends Document {
    _id: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    claimId: string;
    claimText: string;
    conflictType: CanonicalConflictType;
    severity: CanonicalConflictSeverity;
    explanation: string;
    sourceDisagreements: Array<{
        sourceA: {
            url: string;
            domain: string;
            title: string;
            assertion?: string;
            publishedDate?: string | null;
            authorityScore?: number;
        };
        sourceB: {
            url: string;
            domain: string;
            title: string;
            assertion?: string;
            publishedDate?: string | null;
            authorityScore?: number;
        };
        natureOfDisagreement: string;
        conflictType: CanonicalConflictType;
        isContextual: boolean;
        contextualFactor?: string;
    }>;
    majorityAssertion?: string;
    authoritativeAssertion?: string;
    authoritativeSourceUrl?: string;
    recommendedResolution: string;
    distinctionNotes: string;
    createdAt: Date;
}
export declare const EvidenceConflict: Model<IEvidenceConflict>;
//# sourceMappingURL=EvidenceConflict.d.ts.map