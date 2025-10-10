"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ChartContainer, ChartTooltipContent } from './ui/chart';

const chartData = [
  { category: "Food", total: 450 },
  { category: "Transport", total: 200 },
  { category: "Shopping", total: 680 },
  { category: "Housing", total: 1200 },
  { category: "Health", total: 150 },
  { category: "Other", total: 300 },
];

export function AnalysisView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Analysis</CardTitle>
        <CardDescription>Here's a breakdown of your spending by category. (Demo data)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} accessibilityLayer>
              <XAxis
                dataKey="category"
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
