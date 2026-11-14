import React from 'react';
import { EvidenceItem } from '../types/api.types';
import { authorityToColor } from '../utils/scoreColor';
import { ExternalLink, Calendar, Shield } from 'lucide-react';
import { relativeAge } from '../utils/relativeAge';

interface EvidenceCardProps {
  evidence: EvidenceItem;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  const authorityColor = authorityToColor(evidence.authorityTier);

  return (
    <div className="bg-gray-900 border border-gray-700/60 rounded-lg p-3 text-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors line-clamp-1"
        >
          {evidence.title}
          <ExternalLink size={10} className="shrink-0" />
        </a>
        <span className={`shrink-0 font-semibold ${authorityColor}`}>
          {evidence.authorityTier}
        </span>
      </div>

      <div className="flex items-center gap-4 text-gray-500">
        <span className="flex items-center gap-1">
          <Shield size={10} />
          {evidence.domain}
        </span>
        {evidence.ageInDays !== null && (
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {relativeAge(evidence.ageInDays)}
          </span>
        )}
        <span className="text-gray-600">
          Relevance: {Math.round(evidence.tavilyScore * 100)}%
        </span>
      </div>
    </div>
  );
};
