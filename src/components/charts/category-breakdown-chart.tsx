"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '../ui/chart';
import type { CategoryTotal } from '@/lib/csv-parser';

interface CategoryBreakdownChartProps {
  data: CategoryTotal[];
}

// Generate distinct colors with orange hue variations
function generateCategoryColors(count: number): string[] {
  const baseHue = 25; // Primary orange
  const colors: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Vary hue around orange (15-45) and saturation/lightness
    const hue = baseHue + (i * 8) % 60 - 20;
    const saturation = 75 + (i % 3) * 8;
    const lightness = 45 + (i % 4) * 8;
    colors.push(`hsl(${Math.max(0, Math.min(60, hue))}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const colors = generateCategoryColors(data.length);
  
  // Calculate dynamic height based on category count
  const barHeight = 36;
  const chartHeight = Math.max(200, data.length * barHeight + 40);

  return (
    <ChartContainer config={{}} className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          accessibilityLayer
          margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
        >
          <XAxis
            type="number"
            stroke="hsl(var(--foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <YAxis
            type="category"
            dataKey="category"
            stroke="hsl(var(--foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={120}
            tickFormatter={(value) => value.length > 14 ? value.slice(0, 14) + '…' : value}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={<ChartTooltipContent />}
            formatter={(value: number, _name: string, props) => {
              const category = props?.payload?.category ?? 'Unknown';
              const percentage = props?.payload?.percentage ?? 0;
              return [`$${value.toFixed(2)} (${percentage}%)`, category];
            }}
          />
          <Bar dataKey="total" radius={[0, 4, 4, 0]} name="Total">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
