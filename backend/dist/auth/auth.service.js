"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const user_repository_1 = require("../users/user.repository");
const env_1 = require("../../config/env");
const ApiError_1 = require("../../utils/ApiError");
const logger_1 = require("../../config/logger");
const SALT_ROUNDS = 12;
class AuthService {
    generateAccessToken(user) {
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role || 'user',
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
        });
    }
    generateRefreshToken(user) {
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role || 'user',
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, {
            expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
        });
    }
    async register(name, email, password) {
        const existing = await user_repository_1.userRepository.findByEmail(email);
        if (existing) {
            throw ApiError_1.ApiError.conflict('An account with this email address already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
        const user = await user_repository_1.userRepository.create({
            name,
            email,
            passwordHash,
            role: 'user',
            plan: 'free',
        });
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        const refreshTokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
        await user_repository_1.userRepository.update(user._id.toString(), { refreshTokenHash });
        logger_1.logger.info('User successfully registered', { userId: user._id, email: user.email });
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
    async login(email, password) {
        const user = await user_repository_1.userRepository.findByEmail(email, true);
        if (!user || !user.isActive) {
            throw ApiError_1.ApiError.unauthorized('Invalid email or password');
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw ApiError_1.ApiError.unauthorized('Invalid email or password');
        }
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        const refreshTokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
        await user_repository_1.userRepository.update(user._id.toString(), { refreshTokenHash });
        logger_1.logger.info('User authenticated successfully', { userId: user._id, email: user.email });
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
    async refresh(refreshToken) {
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
        }
        catch {
            throw ApiError_1.ApiError.unauthorized('Invalid or expired refresh token');
        }
        const user = await user_repository_1.userRepository.findById(payload.userId, true);
        if (!user || !user.isActive || !user.refreshTokenHash) {
            throw ApiError_1.ApiError.unauthorized('User not found or session revoked');
        }
        const incomingHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
        if (incomingHash !== user.refreshTokenHash) {
            throw ApiError_1.ApiError.unauthorized('Refresh token reuse detected or invalid');
        }
        const newAccessToken = this.generateAccessToken(user);
        const newRefreshToken = this.generateRefreshToken(user);
        const newRefreshTokenHash = crypto_1.default.createHash('sha256').update(newRefreshToken).digest('hex');
        await user_repository_1.userRepository.update(user._id.toString(), { refreshTokenHash: newRefreshTokenHash });
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900,
        };
    }
    async logout(userId) {
        await user_repository_1.userRepository.update(userId, { refreshTokenHash: undefined });
        logger_1.logger.info('User session terminated', { userId });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map