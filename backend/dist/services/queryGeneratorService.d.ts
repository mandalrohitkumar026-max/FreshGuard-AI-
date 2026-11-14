import mongoose from 'mongoose';
import { ClassifiedClaim } from './timeSensitivityService';
/**
 * Query Generator Service (Pipeline Stage 5)
 *
 * Uses Bifrost-routed LLM to craft an optimal Tavily search query
 * for each time-sensitive claim.
 *
 * STATIC claims are skipped — they don't need evidence retrieval.
 */
export declare function generateSearchQuery(claim: ClassifiedClaim, sessionId?: mongoose.Types.ObjectId): Promise<string>;
/**
 * Generate search queries for all non-STATIC claims in parallel.
 */
export declare function generateSearchQueries(claims: ClassifiedClaim[], sessionId?: mongoose.Types.ObjectId): Promise<Map<number, string>>;
//# sourceMappingURL=queryGeneratorService.d.ts.map