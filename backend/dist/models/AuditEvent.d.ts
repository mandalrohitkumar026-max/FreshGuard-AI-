import mongoose, { Document, Model } from 'mongoose';
export interface IAuditEvent extends Document {
    _id: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    auditId: string;
    sha256Hash: string;
    eventPayload: any;
    createdAt: Date;
}
export declare const AuditEventModel: Model<IAuditEvent>;
//# sourceMappingURL=AuditEvent.d.ts.map