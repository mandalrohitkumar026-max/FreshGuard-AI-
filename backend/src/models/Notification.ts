import mongoose, { Document, Schema, Model } from 'mongoose';

export type NotificationType =
  | 'STALENESS_DETECTED'
  | 'SCORE_CHANGED'
  | 'CONTRADICTION_APPEARED'
  | 'ROUTINE_CHECK'
  | 'SYSTEM';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  watchId?: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  previousScore?: number;
  newScore?: number;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    watchId: { type: Schema.Types.ObjectId, ref: 'FreshnessWatch' },
    sessionId: { type: Schema.Types.ObjectId, ref: 'VerificationSession' },
    type: {
      type: String,
      enum: ['STALENESS_DETECTED', 'SCORE_CHANGED', 'CONTRADICTION_APPEARED', 'ROUTINE_CHECK', 'SYSTEM'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    previousScore: { type: Number },
    newScore: { type: Number },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const NotificationModel: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);
