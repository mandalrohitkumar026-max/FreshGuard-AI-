import mongoose, { Document, Schema, Model } from 'mongoose';
import { TimeSensitivity, Verdict } from '../../types/verification.types';
import { ClaimType, ClaimCategory, ExtractedEntity, NumericalValue, TextReference } from './claim.types';

export interface IClaim extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  claimId?: string;
  order: number;
  claimText: string;
  claimType: ClaimType;
  category?: ClaimCategory | string;
  entities?: string[];
  extractedEntities?: ExtractedEntity[];
  dates?: string[];
  numericalValues?: NumericalValue[];
  context?: string;
  originalTextReference?: TextReference;
  extractionConfidence?: number;
  dependencies?: string[];
  isDuplicate?: boolean;
  duplicateOf?: string;
  timeSensitivity: TimeSensitivity;
  freshnessPriority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'STABLE';
  volatility?: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'STABLE';
  requiresVerification?: boolean;
  verificationDecision?: 'VERIFY_IMMEDIATELY' | 'VERIFY_LIVE' | 'VERIFY_IF_NEEDED' | 'NOT_REQUIRED';
  verificationReason?: string;
  recommendedSearchStrategy?: string;
  detectionMethod?: string;
  detectionTimestamp?: Date;
  priority?: number;
  verificationStatus?: string;
  searchQuery?: string;
  verdict?: Verdict;
  confidence?: number;
  explanation?: string;
  suggestedCorrection?: string;
  freshnessScore: number;
  evidenceCount: number;
  createdAt: Date;
}

const claimSchema = new Schema<IClaim>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    claimId: { type: String, index: true },
    order: { type: Number, required: true },
    claimText: { type: String, required: true, maxlength: 2000 },
    claimType: {
      type: String,
      enum: ['FACTUAL', 'OPINION', 'PREDICTION', 'RECOMMENDATION', 'HYPOTHETICAL', 'QUESTION', 'INSTRUCTION'],
      default: 'FACTUAL',
    },
    category: { type: String, maxlength: 100, default: 'GENERAL' },
    entities: [{ type: String }],
    extractedEntities: [
      {
        text: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    dates: [{ type: String }],
    numericalValues: [
      {
        value: { type: String, required: true },
        unit: { type: String },
      },
    ],
    context: { type: String, maxlength: 2000, default: '' },
    originalTextReference: {
      start: { type: Number, default: 0 },
      end: { type: Number, default: 0 },
    },
    extractionConfidence: { type: Number, min: 0, max: 1, default: 0.9 },
    dependencies: [{ type: String }],
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: String },
    timeSensitivity: {
      type: String,
      enum: ['STATIC', 'SEMI_DYNAMIC', 'HIGHLY_DYNAMIC'],
      default: 'STATIC',
    },
    freshnessPriority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW', 'STABLE'],
      default: 'MEDIUM',
    },
    volatility: {
      type: String,
      enum: ['VERY_HIGH', 'HIGH', 'MODERATE', 'LOW', 'STABLE'],
      default: 'MODERATE',
    },
    requiresVerification: { type: Boolean, default: true },
    verificationDecision: {
      type: String,
      enum: ['VERIFY_IMMEDIATELY', 'VERIFY_LIVE', 'VERIFY_IF_NEEDED', 'NOT_REQUIRED'],
      default: 'VERIFY_LIVE',
    },
    verificationReason: { type: String, maxlength: 1000 },
    recommendedSearchStrategy: { type: String, maxlength: 100 },
    detectionMethod: { type: String, default: 'HYBRID' },
    detectionTimestamp: { type: Date },
    priority: { type: Number, default: 1 },
    verificationStatus: { type: String, default: 'PENDING' },
    searchQuery: { type: String, maxlength: 300 },
    verdict: {
      type: String,
      enum: ['CONFIRMS', 'CONTRADICTS', 'PARTIALLY_CONTRADICTS', 'INSUFFICIENT'],
    },
    confidence: { type: Number, min: 0, max: 1 },
    explanation: { type: String, maxlength: 2000 },
    suggestedCorrection: { type: String, maxlength: 2000 },
    freshnessScore: { type: Number, default: 100, min: 0, max: 100 },
    evidenceCount: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

claimSchema.index({ userId: 1, freshnessScore: 1 });
claimSchema.index({ sessionId: 1, order: 1 });
claimSchema.index({ sessionId: 1, claimType: 1 });

export const Claim: Model<IClaim> =
  mongoose.models.Claim || mongoose.model<IClaim>('Claim', claimSchema);
