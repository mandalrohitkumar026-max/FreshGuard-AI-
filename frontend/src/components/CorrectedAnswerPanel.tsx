import React, { useState } from 'react';
import { Copy, Check, ArrowRight } from 'lucide-react';

interface CorrectedAnswerPanelProps {
  originalAnswer: string;
  correctedAnswer: string;
}

export const CorrectedAnswerPanel: React.FC<CorrectedAnswerPanelProps> = ({
  originalAnswer,
  correctedAnswer,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(correctedAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card border-brand-500/30 bg-gray-900/90 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-brand-500/20 text-brand-400 rounded-md text-xs font-semibold">
            AI Generated
          </span>
          <h3 className="text-base font-semibold text-gray-100">
            Freshness-Corrected Answer
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="text-xs text-gray-400 hover:text-gray-200 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 transition"
          >
            {showDiff ? 'Hide Original' : 'Compare Original'}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 px-2.5 py-1 rounded bg-brand-500/10 hover:bg-brand-500/20 transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Corrected'}
          </button>
        </div>
      </div>

      {showDiff && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-gray-800">
          <div className="space-y-1">
            <span className="text-xs font-medium text-red-400">Original (Potentially Stale)</span>
            <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-3 text-xs text-gray-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {originalAnswer}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-emerald-400">Corrected & Verified</span>
            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3 text-xs text-gray-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {correctedAnswer}
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-950/60 rounded-lg p-4 border border-gray-800/80">
        <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
          {correctedAnswer}
        </div>
      </div>
      <p className="text-xs text-gray-500 italic">
        * Stale factual claims replaced with live citations retrieved via Tavily and verified via Bifrost Gateway.
      </p>
    </div>
  );
};
