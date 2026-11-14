"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyService = exports.ApiKeyService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../config/logger");
class ApiKeyService {
    keys = new Map(); // keyHash -> DeveloperApiKey
    rawKeyStore = new Map(); // id -> rawKey for demo retrieval
    constructor() {
        // Seed default developer test key for hackathon evaluation
        this.seedDefaultKey();
    }
    hashKey(rawKey) {
        return crypto_1.default.createHash('sha256').update(rawKey).digest('hex');
    }
    seedDefaultKey() {
        const rawDemoKey = 'fg_live_demo_hackathon2026';
        const hash = this.hashKey(rawDemoKey);
        const id = 'key-demo-2026';
        const keyObj = {
            id,
            name: 'Hackathon 2026 Evaluation Key',
            keyPrefix: 'fg_live_demo',
            keyHash: hash,
            userId: '000000000000000000000001',
            rateLimitPerMinute: 60,
            createdAt: new Date().toISOString(),
            revoked: false,
        };
        this.keys.set(hash, keyObj);
        this.rawKeyStore.set(id, rawDemoKey);
    }
    generateKey(userId, name) {
        const randomHex = crypto_1.default.randomBytes(20).toString('hex');
        const rawKey = `fg_live_${randomHex}`;
        const hash = this.hashKey(rawKey);
        const id = `key-${Date.now()}`;
        const keyObj = {
            id,
            name: name || 'Default Developer Key',
            keyPrefix: rawKey.slice(0, 15) + '...',
            keyHash: hash,
            userId,
            rateLimitPerMinute: 60,
            createdAt: new Date().toISOString(),
            revoked: false,
        };
        this.keys.set(hash, keyObj);
        this.rawKeyStore.set(id, rawKey);
        logger_1.logger.info('Developer API key generated', { id, prefix: keyObj.keyPrefix });
        return { key: keyObj, rawKey };
    }
    validateKey(rawKey) {
        if (!rawKey)
            return null;
        const hash = this.hashKey(rawKey.trim());
        const keyObj = this.keys.get(hash);
        if (!keyObj || keyObj.revoked) {
            return null;
        }
        keyObj.lastUsedAt = new Date().toISOString();
        return keyObj;
    }
    listKeys(userId) {
        return Array.from(this.keys.values())
            .filter((k) => k.userId === userId && !k.revoked)
            .map(({ keyHash, ...rest }) => rest);
    }
    revokeKey(id, userId) {
        for (const [hash, key] of this.keys.entries()) {
            if (key.id === id && key.userId === userId) {
                key.revoked = true;
                this.keys.set(hash, key);
                logger_1.logger.info('Developer API key revoked', { id });
                return true;
            }
        }
        return false;
    }
}
exports.ApiKeyService = ApiKeyService;
exports.apiKeyService = new ApiKeyService();
//# sourceMappingURL=apiKeyService.js.map