"use client";

import { Bar, Line, ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '../ui/chart';
import type { MonthlyTotal } from '@/lib/csv-parser';

interface MonthlySpendingChartProps {
  data: MonthlyTotal[];
}

export function MonthlySpendingChart({ data }: MonthlySpendingChartProps) {
  return (
    <ChartContainer config={{}} className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} accessibilityLayer>
          <XAxis
            dataKey="month"
            stroke="hsl(var(--foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            stroke="hsl(var(--foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
            width={55}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={<ChartTooltipContent />}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total']}
          />
          <Bar 
            key="bar-total"
            dataKey="total" 
            fill="hsl(var(--primary))" 
            radius={[4, 4, 0, 0]}
            name="Monthly Spending"
          />
          <Line
            key="line-trend"
            type="linear"
            dataKey="total"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--muted-foreground))', r: 3 }}
            name="Trend"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
