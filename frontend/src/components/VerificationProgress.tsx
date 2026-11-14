import React from 'react';
import { SSEEvent } from '../types/api.types';
import { verdictToLabel, scoreToColor } from '../utils/scoreColor';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface VerificationProgressProps {
  events: SSEEvent[];
  isComplete: boolean;
  isFailed: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  SESSION_CREATED: '📋 Session created',
  ANSWER_PARSING: '📝 Parsing answer...',
  CLAIM_EXTRACTION_STARTED: '🔍 Extracting claims...',
  CLAIMS_EXTRACTED: '✅ Claims extracted',
  TIME_SENSITIVITY_CLASSIFIED: '⚡ Time sensitivity classified',
  QUERIES_GENERATED: '🔎 Search queries generated',
  EVIDENCE_RETRIEVAL_STARTED: '🌐 Retrieving live evidence...',
  EVIDENCE_VALIDATION_STARTED: '🔬 Validating evidence...',
  CLAIM_VERIFIED: '📊 Claim verified',
  SCORING: '📈 Computing freshness scores...',
  SCORED: '✅ Scoring complete',
  CORRECTION_STARTED: '✏️ Generating corrected answer...',
  REPORT_GENERATION: '📄 Assembling report...',
  COMPLETE: '🎉 Verification complete!',
  FAILED: '❌ Verification failed',
};

export const VerificationProgress: React.FC<VerificationProgressProps> = ({
  events,
  isComplete,
  isFailed,
}) => {
  const lastEvent = events[events.length - 1];
  const claimsExtractedEvent = events.find((e) => e.stage === 'CLAIMS_EXTRACTED');
  const claimVerifiedEvents = events.filter((e) => e.stage === 'CLAIM_VERIFIED');
  const scoredEvent = events.find((e) => e.stage === 'SCORED');

  return (
    <div className="space-y-4">
      {/* Current stage indicator */}
      <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
        {!isComplete && !isFailed ? (
          <Loader2 className="text-brand-400 animate-spin shrink-0" size={20} />
        ) : isFailed ? (
          <AlertCircle className="text-danger-400 shrink-0" size={20} />
        ) : (
          <CheckCircle2 className="text-fresh-400 shrink-0" size={20} />
        )}
        <div>
          <p className="text-sm font-medium text-gray-200">
            {lastEvent ? (STAGE_LABELS[lastEvent.stage] ?? lastEvent.stage) : 'Initializing...'}
          </p>
          {!isComplete && !isFailed && (
            <p className="text-xs text-gray-500 mt-0.5 progress-pulse">Processing...</p>
          )}
        </div>
      </div>

      {/* Extracted claims list */}
      {claimsExtractedEvent?.claims && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">
            {claimsExtractedEvent.claimsCount} claims extracted
          </p>
          <div className="space-y-2">
            {claimsExtractedEvent.claims.map((claim: { claimText: string; order: number }) => {
              const verifiedEvent = claimVerifiedEvents.find(
                (e) => e.claimOrder === claim.order,
              );

              return (
                <div
                  key={claim.order}
                  className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg text-xs"
                >
                  <span className="shrink-0 mt-0.5">
                    {verifiedEvent ? (
                      <span className={scoreToColor(0)}>
                        {verifiedEvent.verdict === 'CONFIRMS' ? '✅' :
                         verifiedEvent.verdict === 'CONTRADICTS' ? '❌' : '⚠️'}
                      </span>
                    ) : !isComplete ? (
                      <Loader2 size={12} className="text-brand-400 animate-spin" />
                    ) : (
                      <span className="text-gray-600">○</span>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 line-clamp-2">{claim.claimText}</p>
                    {verifiedEvent && (
                      <p className="text-gray-500 mt-1">
                        {verdictToLabel(verifiedEvent.verdict ?? '')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aggregate score preview */}
      {scoredEvent && (
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 text-sm">
          <span className="text-gray-400">Aggregate score: </span>
          <span className={`font-bold ${scoreToColor(scoredEvent.aggregateFreshnessScore ?? 0)}`}>
            {scoredEvent.aggregateFreshnessScore}/100
          </span>
        </div>
      )}
    </div>
  );
};
