import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { env } from '../config/env';
import { JwtPayload } from '../types/verification.types';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 12;

// ── Token helpers ─────────────────────────────────────────────────────────

function generateAccessToken(user: IUser): string {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

function generateRefreshToken(user: IUser): string {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}

// ── Auth operations ───────────────────────────────────────────────────────

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
  const existing = await User.findOne({ email });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  await User.findByIdAndUpdate(user._id, { refreshTokenHash });

  logger.info('User registered', { userId: user._id, email });

  return { user, accessToken, refreshToken };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  await User.findByIdAndUpdate(user._id, { refreshTokenHash });

  logger.info('User logged in', { userId: user._id });

  return { user, accessToken, refreshToken };
}

export async function refreshAccessToken(
  incomingRefreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(incomingRefreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
  }

  const user = await User.findById(payload.userId).select('+refreshTokenHash');
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 401 });
  }

  const incomingHash = crypto
    .createHash('sha256')
    .update(incomingRefreshToken)
    .digest('hex');

  if (incomingHash !== user.refreshTokenHash) {
    throw Object.assign(new Error('Refresh token reuse detected'), { status: 401 });
  }

  // Rotate: generate new pair
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const newHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  await User.findByIdAndUpdate(user._id, { refreshTokenHash: newHash });

  return { accessToken, refreshToken };
}

export async function logoutUser(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  logger.info('User logged out', { userId });
}
