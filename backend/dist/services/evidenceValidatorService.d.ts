import { TavilyResult, EvidenceItem, TimeSensitivity } from '../types/verification.types';
/**
 * Evidence Validator Service (Pipeline Stage 7)
 *
 * Transforms raw Tavily results into validated, scored evidence items.
 *
 * Scoring is 100% deterministic — no AI involved:
 * - Domain authority tier from known allowlists
 * - Publication age from Tavily-provided date metadata
 * - Combined authority score: 60% domain tier + 40% Tavily relevance
 */
export declare function validateAndScoreEvidence(results: TavilyResult[], timeSensitivity: TimeSensitivity): EvidenceItem[];
/**
 * Find the best evidence item for scoring purposes.
 * "Best" = highest authority score among items used in analysis.
 */
export declare function findBestEvidence(evidence: EvidenceItem[]): EvidenceItem | null;
export declare function logEvidenceSummary(claimText: string, evidence: EvidenceItem[]): void;
//# sourceMappingURL=evidenceValidatorService.d.ts.map