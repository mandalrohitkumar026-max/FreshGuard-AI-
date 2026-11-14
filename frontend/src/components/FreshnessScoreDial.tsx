import React from 'react';
import { scoreToColor } from '../utils/scoreColor';

interface FreshnessScoreDialProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const FreshnessScoreDial: React.FC<FreshnessScoreDialProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreToColor(score);

  const svgSizes = { sm: 60, md: 100, lg: 140 };
  const svgSize = svgSizes[size];
  const fontSize = { sm: 'text-xs', md: 'text-xl', lg: 'text-3xl' };

  const strokeColor =
    score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#1f2937"
            strokeWidth="10"
          />
          {/* Score arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
          {/* Score text */}
          <text
            x="50"
            y="54"
            textAnchor="middle"
            fill="white"
            fontSize="20"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {score}
          </text>
        </svg>
      </div>
      {showLabel && (
        <span className={`font-semibold ${color} ${fontSize[size]}`}>
          Freshness Score
        </span>
      )}
    </div>
  );
};
