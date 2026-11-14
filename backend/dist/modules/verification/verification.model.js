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
exports.VerificationSession = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const verificationSessionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
        type: String,
        enum: ['PROCESSING', 'COMPLETE', 'FAILED', 'PARTIAL'],
        default: 'PROCESSING',
        index: true,
    },
    originalAnswer: { type: String, required: true, maxlength: 10000 },
    context: {
        topic: { type: String, maxlength: 100 },
        sourceModel: { type: String, maxlength: 50 },
        submittedAt: { type: Date, default: Date.now },
    },
    pipeline: {
        totalClaims: { type: Number, default: 0 },
        staticClaims: { type: Number, default: 0 },
        semiDynamicClaims: { type: Number, default: 0 },
        highlyDynamicClaims: { type: Number, default: 0 },
        staleClaims: { type: Number, default: 0 },
        unverifiableClaims: { type: Number, default: 0 },
    },
    aggregateFreshnessScore: { type: Number, default: 0, min: 0, max: 100 },
    riskLevel: {
        type: String,
        enum: ['FRESH', 'STALE', 'OUTDATED', 'UNVERIFIABLE'],
        default: 'UNVERIFIABLE',
        index: true,
    },
    processingTimeMs: { type: Number, default: 0 },
    errorMessage: { type: String },
    reportId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Report' },
}, {
    timestamps: true,
});
verificationSessionSchema.index({ userId: 1, createdAt: -1 });
exports.VerificationSession = mongoose_1.default.models.VerificationSession ||
    mongoose_1.default.model('VerificationSession', verificationSessionSchema);
//# sourceMappingURL=verification.model.js.map