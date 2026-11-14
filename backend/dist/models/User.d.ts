import mongoose, { Document, Model } from 'mongoose';
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    plan: 'free' | 'pro';
    apiKey?: string;
    apiCallsUsed: number;
    apiCallsLimit: number;
    refreshTokenHash?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidate: string): Promise<boolean>;
}
export declare const User: Model<IUser>;
//# sourceMappingURL=User.d.ts.map