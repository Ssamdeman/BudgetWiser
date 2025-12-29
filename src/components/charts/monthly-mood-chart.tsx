"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, Legend } from 'recharts';
import { ChartContainer } from '../ui/chart';
import type { MoodByMonth } from '@/lib/types';
import { expensePurchaseTypes } from '@/lib/types';
import { MOOD_COLORS } from '@/lib/chart-utils';

interface MonthlyMoodChartProps {
  data: MoodByMonth[];
}

// Premium custom tooltip for stacked bars
function CustomTooltip({ active, payload, label }: { 
  active?: boolean; 
  payload?: Array<{ name: string; value: number; color: string }>; 
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // Filter out zero values and sort by value descending
  const filtered = payload.filter(p => p.value > 0).sort((a, b) => b.value - a.value);
  if (filtered.length === 0) return null;

  const total = filtered.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 shadow-2xl min-w-[180px]">
      <p className="font-semibold text-foreground mb-2 pb-2 border-b border-border/30">{label}</p>
      <div className="space-y-1.5">
        {filtered.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-sm font-medium tabular-nums">${entry.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-border/30 flex justify-between">
        <span className="text-sm font-medium">Total</span>
        <span className="text-sm font-bold text-primary tabular-nums">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function MonthlyMoodChart({ data }: MonthlyMoodChartProps) {
  const moods = expensePurchaseTypes as readonly string[];
  
  return (
    <ChartContainer config={{}} className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          accessibilityLayer
          margin={{ left: 0, right: 10, top: 10, bottom: 5 }}
        >
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
            content={<CustomTooltip />}
          />
          <Legend 
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            iconType="circle"
            iconSize={8}
          />
          {moods.map((mood) => (
            <Bar
              key={mood}
              dataKey={mood}
              stackId="mood"
              fill={MOOD_COLORS[mood]}
              radius={mood === moods[moods.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
