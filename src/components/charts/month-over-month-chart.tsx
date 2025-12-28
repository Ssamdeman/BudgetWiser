"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList, ReferenceLine } from 'recharts';
import { ChartContainer } from '../ui/chart';
import type { MonthlyChange } from '@/lib/csv-parser';
import { MOM_COLORS } from '@/lib/chart-utils';

interface MonthOverMonthChartProps {
  data: MonthlyChange[];
}

// Custom tooltip with clear comparison context
function CustomTooltip({ active, payload, label }: { 
  active?: boolean; 
  payload?: Array<{ payload: MonthlyChange }>; 
  label?: string 
}) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const isPositive = data.percentChange >= 0;

  return (
    <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 shadow-2xl min-w-[180px]">
      <div className="font-semibold text-foreground mb-3 text-center">
        <span className="text-muted-foreground">{data.previousMonth}</span>
        <span className="mx-2 text-muted-foreground/50">→</span>
        <span className="text-primary">{data.month}</span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{data.previousMonth}</span>
          <span className="font-medium tabular-nums">${data.previousTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{data.month}</span>
          <span className="font-medium tabular-nums">${data.currentTotal.toFixed(2)}</span>
        </div>
        <div className="border-t border-border/30 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Change</span>
            <span 
              className="font-bold tabular-nums"
              style={{ color: isPositive ? MOM_COLORS.positive : MOM_COLORS.negative }}
            >
              {isPositive ? '+' : ''}{data.percentChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MonthOverMonthChart({ data }: MonthOverMonthChartProps) {
  const chartHeight = 300;

  // Transform data to show "Apr vs Mar" style labels
  const transformedData = data.map(d => ({
    ...d,
    displayLabel: `${d.month}`,
  }));

  return (
    <ChartContainer config={{}} className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={transformedData}
          accessibilityLayer
          margin={{ left: 0, right: 10, top: 30, bottom: 10 }}
        >
          <XAxis
            dataKey="displayLabel"
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
            tickFormatter={(value) => `${value}%`}
            width={50}
            domain={['auto', 'auto']}
          />
          {/* Zero reference line for visual clarity */}
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
            content={<CustomTooltip />}
          />
          
          <Bar 
            dataKey="percentChange" 
            name="% Change"
            radius={[6, 6, 0, 0]}
          >
            {transformedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.percentChange >= 0 ? MOM_COLORS.positive : MOM_COLORS.negative}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
            ))}
            <LabelList
              dataKey="percentChange"
              position="top"
              formatter={(value: number) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
              fontSize={11}
              fontWeight={600}
              fill="hsl(var(--foreground))"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
