"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.refreshAccessToken = refreshAccessToken;
exports.logoutUser = logoutUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const SALT_ROUNDS = 12;
// ── Token helpers ─────────────────────────────────────────────────────────
function generateAccessToken(user) {
    const payload = {
        userId: user._id.toString(),
        email: user.email,
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
}
function generateRefreshToken(user) {
    const payload = {
        userId: user._id.toString(),
        email: user.email,
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
}
// ── Auth operations ───────────────────────────────────────────────────────
async function registerUser(name, email, password) {
    const existing = await User_1.User.findOne({ email });
    if (existing) {
        throw Object.assign(new Error('Email already registered'), { status: 409 });
    }
    const passwordHash = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
    const user = await User_1.User.create({ name, email, passwordHash });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const refreshTokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
    await User_1.User.findByIdAndUpdate(user._id, { refreshTokenHash });
    logger_1.logger.info('User registered', { userId: user._id, email });
    return { user, accessToken, refreshToken };
}
async function loginUser(email, password) {
    const user = await User_1.User.findOne({ email }).select('+passwordHash');
    if (!user || !user.isActive) {
        throw Object.assign(new Error('Invalid email or password'), { status: 401 });
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
        throw Object.assign(new Error('Invalid email or password'), { status: 401 });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const refreshTokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
    await User_1.User.findByIdAndUpdate(user._id, { refreshTokenHash });
    logger_1.logger.info('User logged in', { userId: user._id });
    return { user, accessToken, refreshToken };
}
async function refreshAccessToken(incomingRefreshToken) {
    let payload;
    try {
        payload = verifyRefreshToken(incomingRefreshToken);
    }
    catch {
        throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
    }
    const user = await User_1.User.findById(payload.userId).select('+refreshTokenHash');
    if (!user) {
        throw Object.assign(new Error('User not found'), { status: 401 });
    }
    const incomingHash = crypto_1.default
        .createHash('sha256')
        .update(incomingRefreshToken)
        .digest('hex');
    if (incomingHash !== user.refreshTokenHash) {
        throw Object.assign(new Error('Refresh token reuse detected'), { status: 401 });
    }
    // Rotate: generate new pair
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const newHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
    await User_1.User.findByIdAndUpdate(user._id, { refreshTokenHash: newHash });
    return { accessToken, refreshToken };
}
async function logoutUser(userId) {
    await User_1.User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    logger_1.logger.info('User logged out', { userId });
}
//# sourceMappingURL=authService.js.map