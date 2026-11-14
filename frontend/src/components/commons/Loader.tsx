import React from 'react';

export const Loader: React.FC<{ label?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  label = 'Processing verification...',
  size = 'md',
}) => {
  const spinnerSizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
      <div
        className={`${spinnerSizes[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
      />
      {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
    </div>
  );
};
