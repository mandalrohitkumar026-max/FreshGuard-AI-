import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, IUser } from './user.model';
import { isMongoConnected } from '../../config/database';
import { logger } from '../../config/logger';

// In-memory user cache for fallback when MongoDB is not running locally
const inMemoryUsers = new Map<string, any>();

export class UserRepository {
  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const normalizedEmail = email.toLowerCase().trim();

    if (isMongoConnected()) {
      try {
        const query = User.findOne({ email: normalizedEmail });
        if (includePassword) {
          query.select('+passwordHash +refreshTokenHash');
        }
        return await query.exec();
      } catch (err: any) {
        logger.warn('Mongo findByEmail failed, using memory store fallback', { error: err.message });
      }
    }

    // Memory fallback
    for (const u of inMemoryUsers.values()) {
      if (u.email.toLowerCase() === normalizedEmail) {
        return this.wrapInMemoryUser(u, includePassword);
      }
    }
    return null;
  }

  async findById(id: string, includeSecrets = false): Promise<IUser | null> {
    if (isMongoConnected()) {
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        const query = User.findById(id);
        if (includeSecrets) {
          query.select('+passwordHash +refreshTokenHash');
        }
        return await query.exec();
      } catch (err: any) {
        logger.warn('Mongo findById failed, using memory store fallback', { error: err.message });
      }
    }

    const u = inMemoryUsers.get(id);
    if (!u) return null;
    return this.wrapInMemoryUser(u, includeSecrets);
  }

  async create(userData: {
    name: string;
    email: string;
    passwordHash: string;
    role?: 'user' | 'admin';
    plan?: 'free' | 'pro';
  }): Promise<IUser> {
    const normalizedEmail = userData.email.toLowerCase().trim();

    if (isMongoConnected()) {
      try {
        return await User.create({
          ...userData,
          email: normalizedEmail,
          role: userData.role || 'user',
          plan: userData.plan || 'free',
        });
      } catch (err: any) {
        logger.warn('Mongo user creation failed, falling back to memory store', { error: err.message });
      }
    }

    const newId = new mongoose.Types.ObjectId();
    const doc = {
      _id: newId,
      name: userData.name,
      email: normalizedEmail,
      passwordHash: userData.passwordHash,
      role: userData.role || 'user',
      plan: userData.plan || 'free',
      apiCallsUsed: 0,
      apiCallsLimit: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryUsers.set(newId.toString(), doc);
    return this.wrapInMemoryUser(doc, true);
  }

  async update(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    if (isMongoConnected()) {
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await User.findByIdAndUpdate(id, updates, { new: true }).exec();
      } catch (err: any) {
        logger.warn('Mongo user update failed, falling back to memory store', { error: err.message });
      }
    }

    const existing = inMemoryUsers.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    inMemoryUsers.set(id, updated);
    return this.wrapInMemoryUser(updated, true);
  }

  private wrapInMemoryUser(raw: any, includeSecrets: boolean): IUser {
    const userObj = { ...raw };
    if (!includeSecrets) {
      delete userObj.passwordHash;
      delete userObj.refreshTokenHash;
    }
    userObj.comparePassword = async (candidate: string) => {
      return bcrypt.compare(candidate, raw.passwordHash);
    };
    return userObj as IUser;
  }
}

export const userRepository = new UserRepository();
