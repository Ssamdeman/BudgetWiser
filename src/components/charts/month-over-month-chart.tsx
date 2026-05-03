"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface MonthOverMonthChartProps {
  currentTotal: number;
  previousTotal: number;
  currentMonthName: string;
  previousMonthName: string;
}

export function MonthOverMonthChart({ currentTotal, previousTotal, currentMonthName, previousMonthName }: MonthOverMonthChartProps) {
  const delta = currentTotal - previousTotal;
  const percentDelta = previousTotal > 0 ? (delta / previousTotal) * 100 : 0;
  
  // Down = good (green), Up = bad (red) for spending
  const isUp = delta > 0;
  const isDown = delta < 0;

  const colorClass = isDown ? "text-green-500" : isUp ? "text-red-500" : "text-muted-foreground";
  const bgClass = isDown ? "bg-green-500/10" : isUp ? "bg-red-500/10" : "bg-muted";

  return (
    <Card className="border-border/50 hover:border-border transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Month-over-Month Comparison</CardTitle>
        <CardDescription className="text-xs">How this month compares to last month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{previousMonthName || 'Previous'}</p>
            <p className="text-2xl font-bold tabular-nums">${previousTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          
          <div className="space-y-1 border-l border-border/50 pl-6">
            <p className="text-xs uppercase tracking-widest text-primary">{currentMonthName || 'Current'}</p>
            <p className="text-2xl font-bold tabular-nums">${currentTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>

          <div className={`col-span-2 md:col-span-1 p-4 rounded-xl flex flex-col items-center justify-center ${bgClass}`}>
            <div className={`flex items-center gap-2 ${colorClass}`}>
              {isDown ? <TrendingDown className="w-5 h-5" /> : isUp ? <TrendingUp className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
              <span className="text-xl font-bold tabular-nums">
                {isUp ? '+' : ''}{Math.abs(delta).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {previousTotal > 0 ? (
              <p className={`text-sm font-medium mt-1 ${colorClass}`}>
                {isUp ? '+' : isDown ? '-' : ''}{Math.abs(percentDelta).toFixed(1)}% vs last month
              </p>
            ) : currentTotal > 0 ? (
              <p className={`text-sm font-medium mt-1 ${colorClass}`}>
                No previous data
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
