"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("./user.model");
const database_1 = require("../../config/database");
const logger_1 = require("../../config/logger");
// In-memory user cache for fallback when MongoDB is not running locally
const inMemoryUsers = new Map();
class UserRepository {
    async findByEmail(email, includePassword = false) {
        const normalizedEmail = email.toLowerCase().trim();
        if ((0, database_1.isMongoConnected)()) {
            try {
                const query = user_model_1.User.findOne({ email: normalizedEmail });
                if (includePassword) {
                    query.select('+passwordHash +refreshTokenHash');
                }
                return await query.exec();
            }
            catch (err) {
                logger_1.logger.warn('Mongo findByEmail failed, using memory store fallback', { error: err.message });
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
    async findById(id, includeSecrets = false) {
        if ((0, database_1.isMongoConnected)()) {
            try {
                if (!mongoose_1.default.Types.ObjectId.isValid(id))
                    return null;
                const query = user_model_1.User.findById(id);
                if (includeSecrets) {
                    query.select('+passwordHash +refreshTokenHash');
                }
                return await query.exec();
            }
            catch (err) {
                logger_1.logger.warn('Mongo findById failed, using memory store fallback', { error: err.message });
            }
        }
        const u = inMemoryUsers.get(id);
        if (!u)
            return null;
        return this.wrapInMemoryUser(u, includeSecrets);
    }
    async create(userData) {
        const normalizedEmail = userData.email.toLowerCase().trim();
        if ((0, database_1.isMongoConnected)()) {
            try {
                return await user_model_1.User.create({
                    ...userData,
                    email: normalizedEmail,
                    role: userData.role || 'user',
                    plan: userData.plan || 'free',
                });
            }
            catch (err) {
                logger_1.logger.warn('Mongo user creation failed, falling back to memory store', { error: err.message });
            }
        }
        const newId = new mongoose_1.default.Types.ObjectId();
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
    async update(id, updates) {
        if ((0, database_1.isMongoConnected)()) {
            try {
                if (!mongoose_1.default.Types.ObjectId.isValid(id))
                    return null;
                return await user_model_1.User.findByIdAndUpdate(id, updates, { new: true }).exec();
            }
            catch (err) {
                logger_1.logger.warn('Mongo user update failed, falling back to memory store', { error: err.message });
            }
        }
        const existing = inMemoryUsers.get(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...updates, updatedAt: new Date() };
        inMemoryUsers.set(id, updated);
        return this.wrapInMemoryUser(updated, true);
    }
    wrapInMemoryUser(raw, includeSecrets) {
        const userObj = { ...raw };
        if (!includeSecrets) {
            delete userObj.passwordHash;
            delete userObj.refreshTokenHash;
        }
        userObj.comparePassword = async (candidate) => {
            return bcryptjs_1.default.compare(candidate, raw.passwordHash);
        };
        return userObj;
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
//# sourceMappingURL=user.repository.js.map