"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';
import { ChartContainer } from '../ui/chart';
import type { MoodTotal } from '@/lib/types';
import { MOOD_COLORS } from '@/lib/chart-utils';

interface MoodAnalysisChartProps {
  data: MoodTotal[];
}

// Premium custom tooltip
function CustomTooltip({ active, payload }: { 
  active?: boolean; 
  payload?: Array<{ payload: MoodTotal; color: string }>; 
}) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const color = payload[0].color;

  return (
    <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 shadow-2xl min-w-[160px]">
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: color }}
        />
        <span className="font-semibold text-foreground">{data.mood}</span>
      </div>
      <div className="flex justify-between items-baseline gap-4">
        <span className="text-2xl font-bold text-primary tabular-nums">
          ${data.total.toFixed(2)}
        </span>
        <span className="text-sm text-muted-foreground">
          {data.percentage}%
        </span>
      </div>
    </div>
  );
}

export function MoodAnalysisChart({ data }: MoodAnalysisChartProps) {
  // Calculate dynamic height based on mood count
  const barHeight = 44;
  const chartHeight = Math.max(180, data.length * barHeight + 30);

  return (
    <ChartContainer config={{}} className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          accessibilityLayer
          margin={{ left: 0, right: 60, top: 5, bottom: 5 }}
        >
          <XAxis
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <YAxis
            type="category"
            dataKey="mood"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
            content={<CustomTooltip />}
          />
          <Bar dataKey="total" radius={[0, 6, 6, 0]} name="Total">
            {data.map((entry) => (
              <Cell 
                key={`cell-${entry.mood}`} 
                fill={MOOD_COLORS[entry.mood] || 'hsl(var(--primary))'}
              />
            ))}
            <LabelList
              dataKey="percentage"
              position="right"
              formatter={(value: number) => `${value}%`}
              fontSize={11}
              fill="hsl(var(--muted-foreground))"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
