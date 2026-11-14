import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

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

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    apiKey: { type: String, sparse: true, index: true },
    apiCallsUsed: { type: Number, default: 0, min: 0 },
    apiCallsLimit: { type: Number, default: 50 },
    refreshTokenHash: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        delete ret.apiKey;
        return ret;
      },
    },
  },
);

// Instance method — compare plaintext password against stored hash
userSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);
