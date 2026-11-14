"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evidenceService = exports.EvidenceService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const evidence_model_1 = require("./evidence.model");
const database_1 = require("../../config/database");
const sessionStore_1 = require("../../services/sessionStore");
class EvidenceService {
    async getEvidenceBySessionId(sessionId) {
        if ((0, database_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(sessionId)) {
            try {
                const evidence = await evidence_model_1.EvidenceSource.find({ sessionId }).sort({ authorityScore: -1 }).lean();
                if (evidence && evidence.length > 0) {
                    return evidence;
                }
            }
            catch {
                // Fallback
            }
        }
        return sessionStore_1.inMemoryStore.getEvidence(sessionId);
    }
    async getEvidenceByClaimId(claimId) {
        if ((0, database_1.isMongoConnected)() && mongoose_1.default.Types.ObjectId.isValid(claimId)) {
            try {
                return await evidence_model_1.EvidenceSource.find({ claimId }).sort({ authorityScore: -1 }).lean();
            }
            catch {
                // Fallback
            }
        }
        return [];
    }
}
exports.EvidenceService = EvidenceService;
exports.evidenceService = new EvidenceService();
//# sourceMappingURL=evidence.service.js.map