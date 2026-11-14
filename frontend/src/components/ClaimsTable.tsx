import React, { useState } from 'react';
import { ClaimDetail, EvidenceItem } from '../types/api.types';
import { EvidenceCard } from './EvidenceCard';
import {
  scoreToColor,
  scoreToBarColor,
  verdictToLabel,
  sensitivityToLabel,
} from '../utils/scoreColor';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ClaimsTableProps {
  claims: ClaimDetail[];
}

export const ClaimsTable: React.FC<ClaimsTableProps> = ({ claims }) => {
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {claims.map((claim) => {
        const cId = claim.claimId || claim.id;
        const isExpanded = expandedClaim === cId;
        const scoreColor = scoreToColor(claim.freshnessScore);
        const barColor = scoreToBarColor(claim.freshnessScore);

        return (
          <div key={cId} className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
            <button
              className="w-full text-left p-4 hover:bg-gray-800/80 transition-colors"
              onClick={() => setExpandedClaim(isExpanded ? null : cId)}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-gray-400">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium leading-relaxed">
                    {claim.claimText}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">
                      {sensitivityToLabel(claim.timeSensitivity)}
                    </span>
                    <span className="text-xs font-medium text-gray-400">
                      {verdictToLabel(claim.verdict)}
                    </span>
                    <span className={`text-xs font-bold ${scoreColor}`}>
                      Score: {claim.freshnessScore}/100
                    </span>
                  </div>
                  {/* Score bar */}
                  <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${claim.freshnessScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-700/50 p-4 space-y-4">
                {/* Explanation */}
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-400 mb-1">AI Explanation</p>
                  <p className="text-sm text-gray-300">{claim.explanation}</p>
                </div>

                {/* Search query */}
                {claim.searchQuery && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">Search Query Used</p>
                    <code className="text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded">
                      {claim.searchQuery}
                    </code>
                  </div>
                )}

                {/* Confidence */}
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-400">Confidence:</p>
                  <span className="text-xs text-gray-300">
                    {Math.round(claim.confidence * 100)}%
                  </span>
                </div>

                {/* Evidence cards */}
                {claim.evidence.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2">
                      Evidence ({claim.evidence.filter((e: EvidenceItem) => e.usedInAnalysis).length} used in analysis)
                    </p>
                    <div className="space-y-2">
                      {claim.evidence
                        .filter((e: EvidenceItem) => e.usedInAnalysis)
                        .map((e: EvidenceItem, i: number) => (
                          <EvidenceCard key={i} evidence={e} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
