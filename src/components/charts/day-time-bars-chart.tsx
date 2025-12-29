"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChartContainer } from '../ui/chart';
import type { DayTotal, TimeOfDayTotal } from '@/lib/types';
import { DAY_COLORS, TIME_COLORS } from '@/lib/chart-utils';

interface DayTimeBarsChartProps {
  dayData: DayTotal[];
  timeData: TimeOfDayTotal[];
}

// Premium tooltip
function CustomTooltip({ active, payload, label, valueKey }: { 
  active?: boolean; 
  payload?: Array<{ value: number; color: string }>; 
  label?: string;
  valueKey: string;
}) {
  if (!active || !payload || !payload[0]) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-lg font-bold text-primary tabular-nums">${payload[0].value.toFixed(2)}</p>
    </div>
  );
}

// Short day names
const shortDays: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

export function DayTimeBarsChart({ dayData, timeData }: DayTimeBarsChartProps) {
  // Transform day data with short names
  const dayChartData = dayData.map(d => ({
    ...d,
    label: shortDays[d.day] || d.day,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Day of Week Chart */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">By Day of Week</h4>
        <ChartContainer config={{}} className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dayChartData}
              accessibilityLayer
              margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
            >
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                width={45}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                content={<CustomTooltip valueKey="day" />}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {dayChartData.map((entry) => (
                  <Cell 
                    key={`day-${entry.day}`} 
                    fill={DAY_COLORS[entry.day] || 'hsl(var(--primary))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Time of Day Chart */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">By Time of Day</h4>
        <ChartContainer config={{}} className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timeData}
              accessibilityLayer
              margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
            >
              <XAxis
                dataKey="timeOfDay"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                width={45}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                content={<CustomTooltip valueKey="timeOfDay" />}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {timeData.map((entry) => (
                  <Cell 
                    key={`time-${entry.timeOfDay}`} 
                    fill={TIME_COLORS[entry.timeOfDay] || 'hsl(var(--primary))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
