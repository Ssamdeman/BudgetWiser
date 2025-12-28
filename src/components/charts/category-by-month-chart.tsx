"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '../ui/chart';
import type { CategoryByMonth } from '@/lib/csv-parser';
import { createCategoryColorMap } from '@/lib/chart-utils';

interface CategoryByMonthChartProps {
  data: CategoryByMonth[];
  categories: string[];
}

// Custom tooltip that hides zeros and sorts by spending (highest first)
function CustomTooltip({ active, payload, label }: { 
  active?: boolean; 
  payload?: Array<{ name: string; value: number; color: string }>; 
  label?: string 
}) {
  if (!active || !payload) return null;

  // Filter out zero values and sort by value descending
  const filtered = payload
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  if (filtered.length === 0) return null;

  // Calculate total for the month
  const total = filtered.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 shadow-2xl">
      <div className="font-semibold text-foreground mb-2 border-b border-border/30 pb-2">
        {label}
        <span className="ml-2 text-primary font-bold">${total.toFixed(2)}</span>
      </div>
      <div className="space-y-1.5">
        {filtered.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shadow-sm" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground truncate max-w-[120px]">
                {item.name}
              </span>
            </div>
            <span className="font-medium text-foreground tabular-nums">
              ${item.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryByMonthChart({ data, categories }: CategoryByMonthChartProps) {
  const colorMap = createCategoryColorMap(categories);
  
  const chartHeight = 340;

  return (
    <ChartContainer config={{}} className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          accessibilityLayer
          margin={{ left: 0, right: 10, top: 10, bottom: 10 }}
        >
          <XAxis
            dataKey="month"
            stroke="hsl(var(--foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
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
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
            content={<CustomTooltip />}
          />
          <Legend 
            wrapperStyle={{ fontSize: '9px', paddingTop: '12px' }}
            formatter={(value) => (
              <span className="text-muted-foreground">
                {value.length > 10 ? value.slice(0, 10) + '…' : value}
              </span>
            )}
          />
          {categories.map((category) => (
            <Bar
              key={category}
              dataKey={category}
              stackId="stack"
              fill={colorMap[category]}
              name={category}
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
