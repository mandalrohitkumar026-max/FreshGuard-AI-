import { verificationService } from './verification.service';
import { inMemoryStore, isMongoConnected } from '../../services/sessionStore';
import { VerificationSession } from '../../models/VerificationSession';
import { VerificationVersion } from '../../models/VerificationVersion';
import { ClaimVerificationResult } from './verification.types';
import { logger } from '../../config/logger';
import mongoose from 'mongoose';

export type ClaimChangeClassification =
  | 'ADDED'
  | 'REMOVED'
  | 'UNCHANGED'
  | 'MODIFIED'
  | 'NEWLY_OUTDATED'
  | 'NEWLY_SUPPORTED'
  | 'NEWLY_CONFLICTING'
  | 'NEWLY_UNVERIFIED';

export interface ChangedClaim {
  claimText: string;
  previousStatus: string;
  currentStatus: string;
  previousVerdict: string;
  currentVerdict: string;
  classification: ClaimChangeClassification;
  resolutionType: 'STALENESS_RESOLVED' | 'NEWLY_OUTDATED' | 'REFINED' | 'UNCHANGED';
  explanation: string;
}

export interface EvolutionTimelineEvent {
  version: number;
  sessionId: string;
  timestamp: string;
  overallFreshnessScore: number;
  totalClaims: number;
  staleClaims: number;
  riskLevel: string;
}

export interface AnswerEvolutionResult {
  parentSessionId?: string;
  currentSessionId: string;
  version: number;
  scoreDelta: number;
  previousScore: number;
  currentScore: number;
  addedClaims: ClaimVerificationResult[];
  removedClaims: ClaimVerificationResult[];
  changedClaims: ChangedClaim[];
  unmodifiedClaims: ClaimVerificationResult[];
  stalenessResolvedCount: number;
  newlyOutdatedCount: number;
  summary: string;
  timeline: EvolutionTimelineEvent[];
}

export class AnswerEvolutionService {
  /**
   * Compares two verification reports and tracks claim-by-claim evolution.
   */
  async compareVersions(
    parentSessionId: string,
    currentSessionId: string,
  ): Promise<AnswerEvolutionResult> {
    const [prevResult, currResult] = await Promise.all([
      verificationService.getVerificationResults(parentSessionId),
      verificationService.getVerificationResults(currentSessionId),
    ]);

    const prevClaims: ClaimVerificationResult[] = prevResult.claims || [];
    const currClaims: ClaimVerificationResult[] = currResult.claims || [];

    const prevScore = prevResult.summary?.overallFreshnessScore ?? 0;
    const currScore = currResult.summary?.overallFreshnessScore ?? 0;
    const scoreDelta = currScore - prevScore;

    const addedClaims: ClaimVerificationResult[] = [];
    const changedClaims: ChangedClaim[] = [];
    const unmodifiedClaims: ClaimVerificationResult[] = [];

    const matchedPrevIndices = new Set<number>();

    // Similarity helper
    const isSimilarClaim = (a: string, b: string): boolean => {
      const normA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normA === normB) return true;
      if (normA.includes(normB) || normB.includes(normA)) return true;
      // Word token overlap
      const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
      const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
      if (wordsA.size === 0 || wordsB.size === 0) return false;
      let common = 0;
      for (const w of wordsA) if (wordsB.has(w)) common++;
      return common / Math.min(wordsA.size, wordsB.size) >= 0.6;
    };

    for (const curr of currClaims) {
      let foundMatchIdx = -1;
      for (let i = 0; i < prevClaims.length; i++) {
        if (!matchedPrevIndices.has(i) && isSimilarClaim(curr.claimText, prevClaims[i].claimText)) {
          foundMatchIdx = i;
          break;
        }
      }

      if (foundMatchIdx >= 0) {
        matchedPrevIndices.add(foundMatchIdx);
        const prev = prevClaims[foundMatchIdx];

        if (prev.status !== curr.status || prev.verdict !== curr.verdict) {
          let resolutionType: ChangedClaim['resolutionType'] = 'REFINED';
          let classification: ClaimChangeClassification = 'MODIFIED';

          if (prev.status === 'OUTDATED' && curr.status === 'SUPPORTED') {
            resolutionType = 'STALENESS_RESOLVED';
            classification = 'NEWLY_SUPPORTED';
          } else if (prev.status === 'SUPPORTED' && curr.status === 'OUTDATED') {
            resolutionType = 'NEWLY_OUTDATED';
            classification = 'NEWLY_OUTDATED';
          } else if (curr.status === 'OUTDATED') {
            classification = 'NEWLY_OUTDATED';
          } else if (curr.status === 'SUPPORTED') {
            classification = 'NEWLY_SUPPORTED';
          } else if (curr.status === 'CONFLICTING') {
            classification = 'NEWLY_CONFLICTING';
          } else if (curr.status === 'UNVERIFIED') {
            classification = 'NEWLY_UNVERIFIED';
          }

          changedClaims.push({
            claimText: curr.claimText,
            previousStatus: prev.status,
            currentStatus: curr.status,
            previousVerdict: prev.verdict,
            currentVerdict: curr.verdict,
            classification,
            resolutionType,
            explanation: curr.explanation,
          });
        } else {
          unmodifiedClaims.push(curr);
        }
      } else {
        addedClaims.push(curr);
      }
    }

    const removedClaims: ClaimVerificationResult[] = prevClaims.filter(
      (_, idx) => !matchedPrevIndices.has(idx),
    );

    const stalenessResolvedCount = changedClaims.filter(
      (c) => c.resolutionType === 'STALENESS_RESOLVED',
    ).length;
    const newlyOutdatedCount = changedClaims.filter(
      (c) => c.resolutionType === 'NEWLY_OUTDATED',
    ).length;

    let summary = '';
    if (scoreDelta > 0) {
      summary = `Freshness improved by +${scoreDelta}% across revisions (${stalenessResolvedCount} stale assertion(s) successfully resolved).`;
    } else if (scoreDelta < 0) {
      summary = `Freshness dropped by ${scoreDelta}%; new revision introduced ${newlyOutdatedCount} outdated assertion(s).`;
    } else {
      summary = `Freshness score maintained at ${currScore}% with ${changedClaims.length} refined assertions.`;
    }

    // Build timeline
    const timeline: EvolutionTimelineEvent[] = [
      {
        version: 1,
        sessionId: parentSessionId,
        timestamp: prevResult.completedAt || new Date().toISOString(),
        overallFreshnessScore: prevScore,
        totalClaims: prevResult.summary?.totalClaims ?? prevClaims.length,
        staleClaims: prevResult.summary?.outdated ?? 0,
        riskLevel: prevResult.summary?.overallRiskLevel ?? 'STALE',
      },
      {
        version: 2,
        sessionId: currentSessionId,
        timestamp: currResult.completedAt || new Date().toISOString(),
        overallFreshnessScore: currScore,
        totalClaims: currResult.summary?.totalClaims ?? currClaims.length,
        staleClaims: currResult.summary?.outdated ?? 0,
        riskLevel: currResult.summary?.overallRiskLevel ?? 'FRESH',
      },
    ];

    logger.info('Answer evolution comparison completed', {
      parentSessionId,
      currentSessionId,
      scoreDelta,
      stalenessResolvedCount,
    });

    if (
      isMongoConnected() &&
      mongoose.Types.ObjectId.isValid(parentSessionId) &&
      mongoose.Types.ObjectId.isValid(currentSessionId)
    ) {
      try {
        const claimTransitions = [
          ...addedClaims.map((c) => ({
            claimText: c.claimText,
            currentStatus: c.status,
            classification: 'ADDED' as const,
            explanation: c.explanation,
          })),
          ...removedClaims.map((c) => ({
            claimText: c.claimText,
            previousStatus: c.status,
            classification: 'REMOVED' as const,
            explanation: 'Claim was removed in newer answer revision.',
          })),
          ...unmodifiedClaims.map((c) => ({
            claimText: c.claimText,
            previousStatus: c.status,
            currentStatus: c.status,
            classification: 'UNCHANGED' as const,
            explanation: 'Identical assertion maintained across revisions.',
          })),
          ...changedClaims.map((c) => ({
            claimText: c.claimText,
            previousStatus: c.previousStatus,
            currentStatus: c.currentStatus,
            classification: c.classification,
            explanation: c.explanation,
          })),
        ];

        await VerificationVersion.findOneAndUpdate(
          {
            parentSessionId: new mongoose.Types.ObjectId(parentSessionId),
            currentSessionId: new mongoose.Types.ObjectId(currentSessionId),
          },
          {
            parentSessionId: new mongoose.Types.ObjectId(parentSessionId),
            currentSessionId: new mongoose.Types.ObjectId(currentSessionId),
            userId: prevResult.userId && mongoose.Types.ObjectId.isValid(prevResult.userId)
              ? new mongoose.Types.ObjectId(prevResult.userId)
              : undefined,
            versionNumber: 2,
            scoreDelta,
            previousScore: prevScore,
            currentScore: currScore,
            previousRisk: prevResult.summary?.overallRiskLevel || 'MODERATE',
            currentRisk: currResult.summary?.overallRiskLevel || 'LOW',
            claimTransitions,
            summary,
          },
          { upsert: true, new: true },
        );
      } catch (err: any) {
        logger.warn('Failed persisting VerificationVersion to MongoDB', { error: err.message });
      }
    }

    return {
      parentSessionId,
      currentSessionId,
      version: 2,
      scoreDelta,
      previousScore: prevScore,
      currentScore: currScore,
      addedClaims,
      removedClaims,
      changedClaims,
      unmodifiedClaims,
      stalenessResolvedCount,
      newlyOutdatedCount,
      summary,
      timeline,
    };
  }

  /**
   * Submits a revised version of an answer, verifies it, links it to parentSessionId,
   * and returns both the verification report and evolution delta.
   */
  async submitRevision(data: {
    parentSessionId: string;
    revisedAnswer: string;
    userId: string;
    context?: any;
  }): Promise<{
    verification: any;
    evolution: AnswerEvolutionResult;
  }> {
    // 1. Create revised session
    const session = await verificationService.createSession({
      userId: data.userId,
      originalAnswer: data.revisedAnswer,
      context: {
        ...(data.context || {}),
        parentSessionId: data.parentSessionId,
        isRevision: true,
      },
    });

    const newSessionId = (session._id || session.id).toString();

    // 2. Run verification
    const verification = await verificationService.runVerification(newSessionId);

    // 3. Compute evolution
    const evolution = await this.compareVersions(data.parentSessionId, newSessionId);

    return {
      verification,
      evolution,
    };
  }
}

export const answerEvolutionService = new AnswerEvolutionService();
