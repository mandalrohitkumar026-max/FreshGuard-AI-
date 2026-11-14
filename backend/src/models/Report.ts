import mongoose, { Document, Schema, Model } from 'mongoose';
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

const reportSchema = new Schema<IReport>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'VerificationSession', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalAnswer: { type: String, required: true },
    correctedAnswer: { type: String },
    hasCorrectedAnswer: { type: Boolean, default: false },
    summary: {
      aggregateFreshnessScore: { type: Number, required: true },
      riskLevel: { type: String, enum: ['FRESH', 'STALE', 'OUTDATED', 'UNVERIFIABLE'], required: true },
      totalClaims: { type: Number, required: true },
      staleClaims: { type: Number, default: 0 },
      freshClaims: { type: Number, default: 0 },
      processingTimeMs: { type: Number, default: 0 },
    },
    claimSummaries: [
      {
        claimId: { type: Schema.Types.ObjectId, ref: 'Claim' },
        claimText: String,
        freshnessScore: Number,
        verdict: String,
        confidence: Number,
        explanation: String,
        topSourceUrl: String,
        topSourceDomain: String,
      },
    ],
    topSources: [
      {
        url: String,
        title: String,
        domain: String,
        authorityTier: String,
      },
    ],
    publicSlug: { type: String, sparse: true, index: true },
    isPublic: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

reportSchema.index({ userId: 1, createdAt: -1 });

export const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', reportSchema);
