import mongoose, { Document, Model } from 'mongoose';
import { TimeSensitivity, Verdict } from '../types/verification.types';
export interface IClaim extends Document {
    _id: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    order: number;
    claimText: string;
    timeSensitivity: TimeSensitivity;
    searchQuery?: string;
    verdict?: Verdict;
    confidence?: number;
    explanation?: string;
    freshnessScore: number;
    evidenceCount: number;
    createdAt: Date;
}
export declare const Claim: Model<IClaim>;
//# sourceMappingURL=Claim.d.ts.map