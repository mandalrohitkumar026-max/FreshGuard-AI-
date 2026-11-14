import mongoose from 'mongoose';
import { ScoredClaim } from '../types/verification.types';
export interface CorrectionResult {
    correctedAnswer: string;
    changedSections: string[];
}
/**
 * Correction Service (Pipeline Stage 11)
 *
 * When stale claims are detected, uses Bifrost-routed LLM to rewrite
 * the original answer, replacing outdated sections with evidence-supported facts
 * and inline citations.
 *
 * Only triggered when:
 * - At least one claim has verdict CONTRADICTS or PARTIALLY_CONTRADICTS
 * - AND that claim has confidence > 0.6
 */
export declare function generateCorrectedAnswer(originalAnswer: string, scoredClaims: ScoredClaim[], sessionId?: mongoose.Types.ObjectId): Promise<CorrectionResult | null>;
//# sourceMappingURL=correctionService.d.ts.map