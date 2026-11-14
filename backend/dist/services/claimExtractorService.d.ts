import mongoose from 'mongoose';
import { ExtractedClaim } from '../types/verification.types';
/**
 * Claim Extractor Service (Pipeline Stage 3)
 *
 * Uses Bifrost-routed LLM to extract atomic, verifiable factual claims
 * from a free-form answer text.
 *
 * Output is validated with Zod — any malformed LLM response throws,
 * which prevents hallucinated claim structures entering the pipeline.
 */
export declare function extractClaims(answerText: string, sessionId?: mongoose.Types.ObjectId): Promise<ExtractedClaim[]>;
//# sourceMappingURL=claimExtractorService.d.ts.map