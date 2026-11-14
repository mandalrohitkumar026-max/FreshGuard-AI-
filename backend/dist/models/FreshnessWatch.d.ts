import mongoose, { Document, Model } from 'mongoose';
export type WatchFrequency = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
export interface IFreshnessWatch extends Document {
    _id: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    title: string;
    answerText: string;
    topic?: string;
    frequency: WatchFrequency;
    intervalMs: number;
    active: boolean;
    baselineScore: number;
    currentScore: number;
    currentRiskLevel: string;
    lastCheckedAt: Date;
    nextCheckAt: Date;
    endDate?: Date;
    checkCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FreshnessWatchModel: Model<IFreshnessWatch>;
//# sourceMappingURL=FreshnessWatch.d.ts.map