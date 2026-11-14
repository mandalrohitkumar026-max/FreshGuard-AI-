"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const executionLogSchema = new mongoose_1.Schema({
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    stage: {
        type: String,
        enum: [
            'ANSWER_PARSING', 'CLAIM_EXTRACTION', 'TIME_SENSITIVITY', 'QUERY_GENERATION',
            'TAVILY_SEARCH', 'EVIDENCE_VALIDATION', 'AI_ANALYSIS', 'SCORING',
            'RISK_CLASSIFICATION', 'CORRECTION', 'REPORT_GENERATION',
        ],
        required: true,
    },
    provider: { type: String, enum: ['bifrost', 'tavily', 'internal'], required: true },
    model: { type: String },
    inputTokens: { type: Number },
    outputTokens: { type: Number },
    latencyMs: { type: Number, required: true },
    status: {
        type: String,
        enum: ['SUCCESS', 'ERROR', 'TIMEOUT', 'SKIPPED'],
        required: true,
    },
    errorCode: { type: String },
    errorMessage: { type: String },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
}, { _id: true });
// TTL index: auto-delete logs after 90 days
executionLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7_776_000 });
exports.ExecutionLog = mongoose_1.default.models.ExecutionLog ||
    mongoose_1.default.model('ExecutionLog', executionLogSchema);
//# sourceMappingURL=ExecutionLog.js.map