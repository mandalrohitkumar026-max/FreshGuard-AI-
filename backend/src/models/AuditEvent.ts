import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAuditEvent extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  auditId: string;
  sha256Hash: string;
  eventPayload: any;
  createdAt: Date;
}

const auditEventSchema = new Schema<IAuditEvent>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    auditId: { type: String, required: true, unique: true },
    sha256Hash: { type: String, required: true },
    eventPayload: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

auditEventSchema.index({ sessionId: 1, createdAt: -1 });

export const AuditEventModel: Model<IAuditEvent> =
  mongoose.models.AuditEvent ||
  mongoose.model<IAuditEvent>('AuditEvent', auditEventSchema);
