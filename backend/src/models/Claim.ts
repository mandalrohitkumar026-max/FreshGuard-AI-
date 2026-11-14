import mongoose, { Document, Schema, Model } from 'mongoose';
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

const claimSchema = new Schema<IClaim>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Number, required: true },
    claimText: { type: String, required: true, maxlength: 1000 },
    timeSensitivity: {
      type: String,
      enum: ['STATIC', 'SEMI_DYNAMIC', 'HIGHLY_DYNAMIC'],
      required: true,
    },
    searchQuery: { type: String, maxlength: 300 },
    verdict: {
      type: String,
      enum: ['CONFIRMS', 'CONTRADICTS', 'PARTIALLY_CONTRADICTS', 'INSUFFICIENT'],
    },
    confidence: { type: Number, min: 0, max: 1 },
    explanation: { type: String, maxlength: 500 },
    freshnessScore: { type: Number, default: 100, min: 0, max: 100 },
    evidenceCount: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

claimSchema.index({ userId: 1, freshnessScore: 1 });

export const Claim: Model<IClaim> =
  mongoose.models.Claim || mongoose.model<IClaim>('Claim', claimSchema);
