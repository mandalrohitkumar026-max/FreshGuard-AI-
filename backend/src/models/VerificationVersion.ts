import mongoose, { Document, Schema, Model } from 'mongoose';

export type ClaimChangeClassification =
  | 'ADDED'
  | 'REMOVED'
  | 'UNCHANGED'
  | 'MODIFIED'
  | 'NEWLY_OUTDATED'
  | 'NEWLY_SUPPORTED'
  | 'NEWLY_CONFLICTING'
  | 'NEWLY_UNVERIFIED';

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

const verificationVersionSchema = new Schema<IVerificationVersion>(
  {
    parentSessionId: { type: Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    currentSessionId: { type: Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    versionNumber: { type: Number, required: true, default: 2 },
    scoreDelta: { type: Number, required: true },
    previousScore: { type: Number, required: true, min: 0, max: 100 },
    currentScore: { type: Number, required: true, min: 0, max: 100 },
    previousRisk: { type: String, required: true },
    currentRisk: { type: String, required: true },
    claimTransitions: [
      {
        claimText: { type: String, required: true },
        previousStatus: { type: String },
        currentStatus: { type: String },
        classification: {
          type: String,
          enum: [
            'ADDED',
            'REMOVED',
            'UNCHANGED',
            'MODIFIED',
            'NEWLY_OUTDATED',
            'NEWLY_SUPPORTED',
            'NEWLY_CONFLICTING',
            'NEWLY_UNVERIFIED',
          ],
          required: true,
        },
        explanation: { type: String, required: true },
      },
    ],
    summary: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

verificationVersionSchema.index({ parentSessionId: 1, versionNumber: 1 });
verificationVersionSchema.index({ userId: 1, createdAt: -1 });

export const VerificationVersion: Model<IVerificationVersion> =
  mongoose.models.VerificationVersion ||
  mongoose.model<IVerificationVersion>('VerificationVersion', verificationVersionSchema);
