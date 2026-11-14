import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  hoverable = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-xl p-6 shadow-card ${
        hoverable ? 'hover:shadow-elevated hover:border-slate-300 transition-all' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
