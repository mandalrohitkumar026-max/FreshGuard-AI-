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
exports.EvidenceConflict = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const evidenceConflictSchema = new mongoose_1.Schema({
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    claimId: { type: String, required: true, index: true },
    claimText: { type: String, required: true },
    conflictType: {
        type: String,
        enum: [
            'DIRECT_CONTRADICTION',
            'NUMERICAL_DISAGREEMENT',
            'TEMPORAL_DIFFERENCE',
            'CONTEXTUAL_DIFFERENCE',
            'INSUFFICIENT_EVIDENCE',
        ],
        required: true,
    },
    severity: {
        type: String,
        enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
        required: true,
    },
    explanation: { type: String, required: true },
    sourceDisagreements: [
        {
            sourceA: {
                url: { type: String, required: true },
                domain: { type: String, required: true },
                title: { type: String, required: true },
                assertion: { type: String },
                publishedDate: { type: String },
                authorityScore: { type: Number },
            },
            sourceB: {
                url: { type: String, required: true },
                domain: { type: String, required: true },
                title: { type: String, required: true },
                assertion: { type: String },
                publishedDate: { type: String },
                authorityScore: { type: Number },
            },
            natureOfDisagreement: { type: String, required: true },
            conflictType: { type: String, required: true },
            isContextual: { type: Boolean, default: false },
            contextualFactor: { type: String },
        },
    ],
    majorityAssertion: { type: String },
    authoritativeAssertion: { type: String },
    authoritativeSourceUrl: { type: String },
    recommendedResolution: { type: String, required: true },
    distinctionNotes: { type: String, required: true },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
evidenceConflictSchema.index({ sessionId: 1, claimId: 1 });
exports.EvidenceConflict = mongoose_1.default.models.EvidenceConflict ||
    mongoose_1.default.model('EvidenceConflict', evidenceConflictSchema);
//# sourceMappingURL=EvidenceConflict.js.map