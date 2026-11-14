import mongoose, { Document, Model } from 'mongoose';
import { RiskLevel } from '../types/verification.types';
export interface IClaimSummary {
    claimId: mongoose.Types.ObjectId;
    claimText: string;
    freshnessScore: number;
    verdict: string;
    confidence: number;
    explanation: string;
    topSourceUrl?: string;
    topSourceDomain?: string;
}
export interface ITopSource {
    url: string;
    title: string;
    domain: string;
    authorityTier: string;
}
export interface IReport extends Document {
    _id: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    originalAnswer: string;
    correctedAnswer?: string;
    hasCorrectedAnswer: boolean;
    summary: {
        aggregateFreshnessScore: number;
        riskLevel: RiskLevel;
        totalClaims: number;
        staleClaims: number;
        freshClaims: number;
        processingTimeMs: number;
    };
    claimSummaries: IClaimSummary[];
    topSources: ITopSource[];
    publicSlug?: string;
    isPublic: boolean;
    createdAt: Date;
}
export declare const Report: Model<IReport>;
//# sourceMappingURL=Report.d.ts.map