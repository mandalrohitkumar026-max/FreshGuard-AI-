import mongoose, { Document, Model } from 'mongoose';
export type NotificationType = 'STALENESS_DETECTED' | 'SCORE_CHANGED' | 'CONTRADICTION_APPEARED' | 'ROUTINE_CHECK' | 'SYSTEM';
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
export declare const NotificationModel: Model<INotification>;
//# sourceMappingURL=Notification.d.ts.map