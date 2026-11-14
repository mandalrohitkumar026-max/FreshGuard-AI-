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
exports.EvidenceSource = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const evidenceSourceSchema = new mongoose_1.Schema({
    claimId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Claim', required: true, index: true },
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    url: { type: String, required: true, maxlength: 2000 },
    title: { type: String, required: true, maxlength: 500 },
    content: { type: String, required: true, maxlength: 5000 },
    domain: { type: String, required: true, index: true },
    tavilyScore: { type: Number, required: true, min: 0, max: 1 },
    authorityScore: { type: Number, required: true, min: 0, max: 1 },
    authorityTier: {
        type: String,
        enum: ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
        required: true,
    },
    publishedDate: { type: Date },
    ageInDays: { type: Number, min: 0 },
    usedInAnalysis: { type: Boolean, default: true },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
evidenceSourceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7_776_000 });
exports.EvidenceSource = mongoose_1.default.models.EvidenceSource || mongoose_1.default.model('EvidenceSource', evidenceSourceSchema);
//# sourceMappingURL=evidence.model.js.map