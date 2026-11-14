import mongoose, { Document, Schema, Model } from 'mongoose';
import { RiskLevel, SessionStatus } from '../types/verification.types';

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

const verificationSessionSchema = new Schema<IVerificationSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['PROCESSING', 'COMPLETE', 'FAILED', 'PARTIAL'],
      default: 'PROCESSING',
      index: true,
    },
    originalAnswer: { type: String, required: true, maxlength: 10000 },
    context: {
      topic: { type: String, maxlength: 100 },
      sourceModel: { type: String, maxlength: 50 },
      submittedAt: { type: Date, default: Date.now },
    },
    pipeline: {
      totalClaims: { type: Number, default: 0 },
      staticClaims: { type: Number, default: 0 },
      semiDynamicClaims: { type: Number, default: 0 },
      highlyDynamicClaims: { type: Number, default: 0 },
      staleClaims: { type: Number, default: 0 },
      unverifiableClaims: { type: Number, default: 0 },
    },
    aggregateFreshnessScore: { type: Number, default: 0, min: 0, max: 100 },
    riskLevel: {
      type: String,
      enum: ['FRESH', 'STALE', 'OUTDATED', 'UNVERIFIABLE'],
      default: 'UNVERIFIABLE',
      index: true,
    },
    processingTimeMs: { type: Number, default: 0 },
    errorMessage: { type: String },
    reportId: { type: Schema.Types.ObjectId, ref: 'Report' },
  },
  {
    timestamps: true,
  },
);

// Compound index for user history queries (sorted by newest first)
verificationSessionSchema.index({ userId: 1, createdAt: -1 });

export const VerificationSession: Model<IVerificationSession> =
  mongoose.models.VerificationSession ||
  mongoose.model<IVerificationSession>('VerificationSession', verificationSessionSchema);
