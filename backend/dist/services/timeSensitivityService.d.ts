import mongoose from 'mongoose';
import { ExtractedClaim, TimeSensitivity } from '../types/verification.types';
export interface ClassifiedClaim extends ExtractedClaim {
    timeSensitivity: TimeSensitivity;
    reasoning: string;
}
/**
 * Time-Sensitivity Service (Pipeline Stage 4)
 *
 * Classifies each extracted claim as STATIC, SEMI_DYNAMIC, or HIGHLY_DYNAMIC.
 * Only SEMI_DYNAMIC and HIGHLY_DYNAMIC claims enter the Tavily evidence pipeline.
 * STATIC claims receive a default freshness score of 100.
 */
export declare function classifyTimeSensitivity(claims: ExtractedClaim[], sessionId?: mongoose.Types.ObjectId): Promise<ClassifiedClaim[]>;
//# sourceMappingURL=timeSensitivityService.d.ts.map