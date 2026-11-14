import mongoose from 'mongoose';
import { EvidenceItem, ClaimAnalysisResult } from '../types/verification.types';
/**
 * AI Analysis Service (Pipeline Stage 8)
 *
 * Uses Bifrost-routed LLM to compare a claim against retrieved evidence.
 *
 * Hallucination Guards:
 * 1. Evidence is injected verbatim — model cannot fabricate sources
 * 2. Model must cite snippet indices supporting its verdict
 * 3. Response is validated with Zod — malformed responses throw
 */
export declare function analyzeClaimAgainstEvidence(claimText: string, evidence: EvidenceItem[], sessionId?: mongoose.Types.ObjectId): Promise<ClaimAnalysisResult>;
//# sourceMappingURL=aiAnalysisService.d.ts.map