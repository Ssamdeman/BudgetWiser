"use client";

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

// V2 Charts (same 5 used in 2026 Insights)
import { MonthlyMoodChart } from './charts/monthly-mood-chart';
import { CategoryBreakdownChart } from './charts/category-breakdown-chart';
import { MoodAnalysisChart } from './charts/mood-analysis-chart';
import { SpendingHeatmap } from './charts/spending-heatmap';
import { DayTimeBarsChart } from './charts/day-time-bars-chart';

// Server Actions & Data
import { fetchCurrentMonthExpenses } from '@/app/actions';
import { processV2Entries } from '@/lib/csv-parser';
import type { V2AnalyticsData, V2ExpenseEntry } from '@/lib/types';

// Icons
import { 
  Brain, 
  PieChart, 
  BarChart3, 
  Grid3X3, 
  Clock,
  AlertCircle
} from 'lucide-react';

export function CurrentMonthView() {
  const [data, setData] = useState<V2AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const entries: V2ExpenseEntry[] = await fetchCurrentMonthExpenses();
        const processed = processV2Entries(entries);
        setData(processed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading || isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Loading live data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 py-8 px-4 text-destructive">
        <AlertCircle className="w-5 h-5" />
        <span>Error loading live data: {error}</span>
      </div>
    );
  }

  if (!data || data.entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <Clock className="w-8 h-8" />
        <p className="text-sm">No expenses logged this month yet.</p>
        <p className="text-xs">Log your first expense to see it appear here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2">
      {/* Mini Hero - Current Month Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-1">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-bold text-primary">
            ${data.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        {data.topMood && (
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Top Mood</p>
            <p className="text-lg font-semibold">{data.topMood.mood}</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Entries</p>
          <p className="text-lg font-semibold">{data.entries.length}</p>
        </div>
      </div>

      {/* Chart 1: Monthly Spending by Mood */}
      <Card className="border-border/50 hover:border-border transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Spending by Mood</CardTitle>
              <CardDescription className="text-xs">How your spending moods break down</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <MonthlyMoodChart data={data.moodByMonth} />
        </CardContent>
      </Card>

      {/* Chart 2: Category Breakdown */}
      <Card className="border-border/50 hover:border-border transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <PieChart className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Category Breakdown</CardTitle>
              <CardDescription className="text-xs">Where your money goes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CategoryBreakdownChart data={data.categoryTotals} />
        </CardContent>
      </Card>

      {/* Chart 3: Mood Analysis */}
      <Card className="border-border/50 hover:border-border transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Mood Analysis</CardTitle>
              <CardDescription className="text-xs">Spending breakdown by purchase mood</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <MoodAnalysisChart data={data.moodTotals} />
        </CardContent>
      </Card>

      {/* Chart 4: Spending Heatmap */}
      <Card className="border-border/50 hover:border-border transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Grid3X3 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Spending Heatmap</CardTitle>
              <CardDescription className="text-xs">When you spend the most (Day × Time)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <SpendingHeatmap data={data.heatmapData} />
        </CardContent>
      </Card>

      {/* Chart 5: Day & Time Breakdown */}
      <Card className="border-border/50 hover:border-border transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Day & Time Breakdown</CardTitle>
              <CardDescription className="text-xs">Spending patterns by day of week and time of day</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DayTimeBarsChart dayData={data.dayTotals} timeData={data.timeOfDayTotals} />
        </CardContent>
      </Card>
    </div>
  );
}
