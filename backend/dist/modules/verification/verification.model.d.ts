import mongoose, { Document, Model } from 'mongoose';
import { RiskLevel, SessionStatus } from '../../types/verification.types';
export interface IVerificationSession extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    status: SessionStatus;
    originalAnswer: string;
    context?: {
        topic?: string;
        sourceModel?: string;
        submittedAt: Date;
    };
    pipeline: {
        totalClaims: number;
        staticClaims: number;
        semiDynamicClaims: number;
        highlyDynamicClaims: number;
        staleClaims: number;
        unverifiableClaims: number;
    };
    aggregateFreshnessScore: number;
    riskLevel: RiskLevel;
    processingTimeMs: number;
    errorMessage?: string;
    reportId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const VerificationSession: Model<IVerificationSession>;
//# sourceMappingURL=verification.model.d.ts.map