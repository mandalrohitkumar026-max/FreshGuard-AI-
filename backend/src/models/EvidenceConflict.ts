import mongoose, { Document, Schema, Model } from 'mongoose';

export type CanonicalConflictType =
  | 'DIRECT_CONTRADICTION'
  | 'NUMERICAL_DISAGREEMENT'
  | 'TEMPORAL_DIFFERENCE'
  | 'CONTEXTUAL_DIFFERENCE'
  | 'INSUFFICIENT_EVIDENCE';

export type CanonicalConflictSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface IEvidenceConflict extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  claimId: string;
  claimText: string;
  conflictType: CanonicalConflictType;
  severity: CanonicalConflictSeverity;
  explanation: string;
  sourceDisagreements: Array<{
    sourceA: {
      url: string;
      domain: string;
      title: string;
      assertion?: string;
      publishedDate?: string | null;
      authorityScore?: number;
    };
    sourceB: {
      url: string;
      domain: string;
      title: string;
      assertion?: string;
      publishedDate?: string | null;
      authorityScore?: number;
    };
    natureOfDisagreement: string;
    conflictType: CanonicalConflictType;
    isContextual: boolean;
    contextualFactor?: string;
  }>;
  majorityAssertion?: string;
  authoritativeAssertion?: string;
  authoritativeSourceUrl?: string;
  recommendedResolution: string;
  distinctionNotes: string;
  createdAt: Date;
}

const evidenceConflictSchema = new Schema<IEvidenceConflict>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    claimId: { type: String, required: true, index: true },
    claimText: { type: String, required: true },
    conflictType: {
      type: String,
      enum: [
        'DIRECT_CONTRADICTION',
        'NUMERICAL_DISAGREEMENT',
        'TEMPORAL_DIFFERENCE',
        'CONTEXTUAL_DIFFERENCE',
        'INSUFFICIENT_EVIDENCE',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      required: true,
    },
    explanation: { type: String, required: true },
    sourceDisagreements: [
      {
        sourceA: {
          url: { type: String, required: true },
          domain: { type: String, required: true },
          title: { type: String, required: true },
          assertion: { type: String },
          publishedDate: { type: String },
          authorityScore: { type: Number },
        },
        sourceB: {
          url: { type: String, required: true },
          domain: { type: String, required: true },
          title: { type: String, required: true },
          assertion: { type: String },
          publishedDate: { type: String },
          authorityScore: { type: Number },
        },
        natureOfDisagreement: { type: String, required: true },
        conflictType: { type: String, required: true },
        isContextual: { type: Boolean, default: false },
        contextualFactor: { type: String },
      },
    ],
    majorityAssertion: { type: String },
    authoritativeAssertion: { type: String },
    authoritativeSourceUrl: { type: String },
    recommendedResolution: { type: String, required: true },
    distinctionNotes: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

evidenceConflictSchema.index({ sessionId: 1, claimId: 1 });

export const EvidenceConflict: Model<IEvidenceConflict> =
  mongoose.models.EvidenceConflict ||
  mongoose.model<IEvidenceConflict>('EvidenceConflict', evidenceConflictSchema);
