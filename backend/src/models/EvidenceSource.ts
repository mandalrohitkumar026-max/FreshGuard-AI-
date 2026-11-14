import mongoose, { Document, Schema, Model } from 'mongoose';
import { AuthorityTier } from '../types/verification.types';

export interface IEvidenceSource extends Document {
  _id: mongoose.Types.ObjectId;
  claimId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  url: string;
  title: string;
  content: string;
  domain: string;
  tavilyScore: number;
  authorityScore: number;
  authorityTier: AuthorityTier;
  publishedDate?: Date;
  ageInDays?: number;
  usedInAnalysis: boolean;
  createdAt: Date;
}

const evidenceSourceSchema = new Schema<IEvidenceSource>(
  {
    claimId: { type: Schema.Types.ObjectId, ref: 'Claim', required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    url: { type: String, required: true, maxlength: 2000 },
    title: { type: String, required: true, maxlength: 500 },
    content: { type: String, required: true, maxlength: 5000 },
    domain: { type: String, required: true, index: true },
    tavilyScore: { type: Number, required: true, min: 0, max: 1 },
    authorityScore: { type: Number, required: true, min: 0, max: 1 },
    authorityTier: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
      required: true,
    },
    publishedDate: { type: Date },
    ageInDays: { type: Number, min: 0 },
    usedInAnalysis: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// TTL: 90 days — evidence is ephemeral, re-fetch on demand
evidenceSourceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7_776_000 });

export const EvidenceSource: Model<IEvidenceSource> =
  mongoose.models.EvidenceSource ||
  mongoose.model<IEvidenceSource>(
    'EvidenceSource',
    evidenceSourceSchema,
  );
