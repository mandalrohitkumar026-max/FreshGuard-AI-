import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface StatusDistributionProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export const StatusDistribution: React.FC<StatusDistributionProps> = ({ data }) => {
  const hasData = data && data.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs space-y-2">
        <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-200" />
        <span>No claim statuses recorded yet.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span>
              {item.name}: <strong className="text-slate-800">{item.value}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
