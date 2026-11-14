import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface FreshnessDistributionChartProps {
  data: Array<{ range: string; count: number }>;
}

const getBarColor = (range: string) => {
  switch (range) {
    case '0-20':
      return '#f43f5e'; // Rose - severe stale
    case '21-40':
      return '#f97316'; // Orange - stale
    case '41-60':
      return '#eab308'; // Amber - mixed
    case '61-80':
      return '#3b82f6'; // Blue - fresh
    case '81-100':
      return '#10b981'; // Emerald - highly fresh
    default:
      return '#64748b';
  }
};

export const FreshnessDistributionChart: React.FC<FreshnessDistributionChartProps> = ({ data }) => {
  if (!data || data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
        No score distribution data recorded yet.
      </div>
    );
  }

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="range"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#0f172a',
            }}
            formatter={(value: any) => [`${value} sessions`, 'Audits']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={getBarColor(entry.range)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
