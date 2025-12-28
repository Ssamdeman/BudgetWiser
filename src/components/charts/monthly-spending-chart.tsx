"use client";

import { Bar, Line, ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer } from '../ui/chart';
import type { MonthlyTotal } from '@/lib/csv-parser';

interface MonthlySpendingChartProps {
  data: MonthlyTotal[];
}

// Custom tooltip for premium feel
function CustomTooltip({ active, payload, label }: { 
  active?: boolean; 
  payload?: Array<{ value: number; name: string }>; 
  label?: string 
}) {
  if (!active || !payload || !payload[0]) return null;

  const value = payload[0].value;

  return (
    <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 shadow-2xl">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary tabular-nums">
        ${value.toFixed(2)}
      </p>
    </div>
  );
}

export function MonthlySpendingChart({ data }: MonthlySpendingChartProps) {
  // Filter to only show months with data for cleaner visualization
  const dataWithSpending = data.filter(d => d.total > 0);
  
  return (
    <ChartContainer config={{}} className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={dataWithSpending} accessibilityLayer>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
            width={55}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
            content={<CustomTooltip />}
          />
          <Bar 
            key="bar-total"
            dataKey="total" 
            fill="url(#barGradient)" 
            radius={[6, 6, 0, 0]}
            name="Monthly Spending"
          />
          <Line
            key="line-trend"
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
            strokeOpacity={0.4}
            dot={{ fill: 'hsl(var(--foreground))', r: 3, strokeWidth: 0, fillOpacity: 0.6 }}
            activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
            name="Trend"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
