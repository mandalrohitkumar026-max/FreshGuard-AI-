import mongoose, { Document, Model } from 'mongoose';
export type ClaimChangeClassification = 'ADDED' | 'REMOVED' | 'UNCHANGED' | 'MODIFIED' | 'NEWLY_OUTDATED' | 'NEWLY_SUPPORTED' | 'NEWLY_CONFLICTING' | 'NEWLY_UNVERIFIED';
export interface IVerificationVersion extends Document {
    _id: mongoose.Types.ObjectId;
    parentSessionId: mongoose.Types.ObjectId;
    currentSessionId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    versionNumber: number;
    scoreDelta: number;
    previousScore: number;
    currentScore: number;
    previousRisk: string;
    currentRisk: string;
    claimTransitions: Array<{
        claimText: string;
        previousStatus?: string;
        currentStatus?: string;
        classification: ClaimChangeClassification;
        explanation: string;
    }>;
    summary: string;
    createdAt: Date;
}
export declare const VerificationVersion: Model<IVerificationVersion>;
//# sourceMappingURL=VerificationVersion.d.ts.map