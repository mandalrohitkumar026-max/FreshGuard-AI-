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
exports.FreshnessWatchModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const freshnessWatchSchema = new mongoose_1.Schema({
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    answerText: { type: String, required: true, maxlength: 10000 },
    topic: { type: String, maxlength: 100 },
    frequency: {
        type: String,
        enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'],
        default: 'DAILY',
    },
    intervalMs: { type: Number, required: true },
    active: { type: Boolean, default: true, index: true },
    baselineScore: { type: Number, required: true, min: 0, max: 100 },
    currentScore: { type: Number, required: true, min: 0, max: 100 },
    currentRiskLevel: { type: String, required: true },
    lastCheckedAt: { type: Date, default: Date.now },
    nextCheckAt: { type: Date, required: true, index: true },
    endDate: { type: Date },
    checkCount: { type: Number, default: 1 },
}, {
    timestamps: true,
});
// Compound index for scheduler worker to poll due watches efficiently
freshnessWatchSchema.index({ active: 1, nextCheckAt: 1 });
freshnessWatchSchema.index({ userId: 1, createdAt: -1 });
exports.FreshnessWatchModel = mongoose_1.default.models.FreshnessWatch ||
    mongoose_1.default.model('FreshnessWatch', freshnessWatchSchema);
//# sourceMappingURL=FreshnessWatch.js.map