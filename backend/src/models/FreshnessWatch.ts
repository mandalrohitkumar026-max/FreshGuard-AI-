import mongoose, { Document, Schema, Model } from 'mongoose';

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

const freshnessWatchSchema = new Schema<IFreshnessWatch>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    answerText: { type: String, required: true, maxlength: 10000 },
    topic: { type: String, maxlength: 100 },
    frequency: {
      type: String,
      enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      default: 'DAILY',
    },
    intervalMs: { type: Number, required: true },
    active: { type: Boolean, default: true, index: true },
    baselineScore: { type: Number, required: true, min: 0, max: 100 },
    currentScore: { type: Number, required: true, min: 0, max: 100 },
    currentRiskLevel: { type: String, required: true },
    lastCheckedAt: { type: Date, default: Date.now },
    nextCheckAt: { type: Date, required: true, index: true },
    endDate: { type: Date },
    checkCount: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  },
);

// Compound index for scheduler worker to poll due watches efficiently
freshnessWatchSchema.index({ active: 1, nextCheckAt: 1 });
freshnessWatchSchema.index({ userId: 1, createdAt: -1 });

export const FreshnessWatchModel: Model<IFreshnessWatch> =
  mongoose.models.FreshnessWatch ||
  mongoose.model<IFreshnessWatch>('FreshnessWatch', freshnessWatchSchema);
