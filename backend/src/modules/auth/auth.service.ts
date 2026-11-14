import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userRepository } from '../users/user.repository';
import { IUser } from '../users/user.model';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

const SALT_ROUNDS = 12;

interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export class AuthService {
  private generateAccessToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role || 'user',
    };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  private generateRefreshToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role || 'user',
    };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  async register(name: string, email: string, password: string) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create({
      name,
      email,
      passwordHash,
      role: 'user',
      plan: 'free',
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await userRepository.update(user._id.toString(), { refreshTokenHash });

    logger.info('User successfully registered', { userId: user._id, email: user.email });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email, true);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await userRepository.update(user._id.toString(), { refreshTokenHash });

    logger.info('User authenticated successfully', { userId: user._id, email: user.email });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  async refresh(refreshToken: string) {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await userRepository.findById(payload.userId, true);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw ApiError.unauthorized('User not found or session revoked');
    }

    const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (incomingHash !== user.refreshTokenHash) {
      throw ApiError.unauthorized('Refresh token reuse detected or invalid');
    }

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await userRepository.update(user._id.toString(), { refreshTokenHash: newRefreshTokenHash });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }

  async logout(userId: string) {
    await userRepository.update(userId, { refreshTokenHash: undefined });
    logger.info('User session terminated', { userId });
  }
}

export const authService = new AuthService();
