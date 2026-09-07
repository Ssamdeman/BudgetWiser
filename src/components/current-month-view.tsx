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
import { 
  fetchCurrentMonthExpenses, 
  fetchCurrentMonthIncome, 
  fetchSubscriptions 
} from '@/app/actions';
import { processV2Entries } from '@/lib/csv-parser';
import type { 
  V2AnalyticsData, 
  V2ExpenseEntry, 
  IncomeMonthData, 
  SubscriptionsData 
} from '@/lib/types';

// Icons
import { 
  Brain, 
  PieChart, 
  BarChart3, 
  Grid3X3, 
  Clock,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard
} from 'lucide-react';

export function CurrentMonthView() {
  const [data, setData] = useState<V2AnalyticsData | null>(null);
  const [incomeData, setIncomeData] = useState<IncomeMonthData | null>(null);
  const [subsData, setSubsData] = useState<SubscriptionsData | null>(null);
  const [subsUnavailable, setSubsUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      // 1. Core spending and income fetch (must never be broken by subscriptions)
      try {
        const [entries, income] = await Promise.all([
          fetchCurrentMonthExpenses(),
          fetchCurrentMonthIncome(),
        ]);
        const processed = processV2Entries(entries);
        setData(processed);
        setIncomeData(income);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }

      // 2. Subscriptions fetch isolated: failures degrade gracefully without affecting spending/income
      try {
        const subs = await fetchSubscriptions();
        setSubsData(subs);
      } catch (err) {
        console.error('Subscriptions fetch degraded independently:', err);
        setSubsUnavailable(true);
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

  const hasExpenses = data && data.entries.length > 0;
  const hasIncome = incomeData && incomeData.totalIncome > 0;
  const hasCommitted = subsData && subsData.committedThisMonth > 0;

  if (!hasExpenses && !hasIncome && !hasCommitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <Clock className="w-8 h-8" />
        <p className="text-sm">No activity logged this month yet.</p>
        <p className="text-xs">Log an expense or income to see it appear here!</p>
      </div>
    );
  }

  // Financial figures for Current Month
  const loggedSpending = data?.grandTotal || 0;
  const committedRecurring = subsData?.committedThisMonth || 0;
  const totalOut = loggedSpending + committedRecurring;
  const loggedExpensesCount = data?.entries.length || 0;
  const activeCommittedCount = subsData?.counts.active || 0;

  // Temporal labels for month-to-date vs full-month clarity
  const today = new Date();
  const dayOfMonth = today.getDate();
  const monthName = today.toLocaleString('en-US', { month: 'short' });
  const dateRangeLabel = `${monthName} 1–${dayOfMonth}`;
  const isLastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() === dayOfMonth;

  return (
    <div className="space-y-5 pt-2">
      {/* Hero Overview - Money Out (3-line breakdown) & Money In */}
      <div className="space-y-3 px-1">
        {/* Money Out - Distinct Logged vs Committed Breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/70 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-rose-500 flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4" />
              Money Out
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {monthName} {today.getFullYear()}
            </span>
          </div>

          {/* Line 1: Logged spending (Month to date) */}
          <div className="flex items-baseline justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Logged spending</p>
              <p className="text-[11px] text-muted-foreground">
                Month-to-date ({dateRangeLabel} · {loggedExpensesCount} {loggedExpensesCount === 1 ? 'expense' : 'expenses'})
              </p>
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground tabular-nums shrink-0">
              ${loggedSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Line 2: Committed recurring (Full month) - Degrades independently */}
          <div className="flex items-baseline justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Committed recurring</p>
              <p className="text-[11px] text-muted-foreground">
                {subsUnavailable
                  ? 'Registry unavailable'
                  : `Full month (${activeCommittedCount} ${activeCommittedCount === 1 ? 'obligation' : 'obligations'} · rent included)`}
              </p>
            </div>
            {subsUnavailable ? (
              <span className="text-xs text-muted-foreground italic shrink-0">Unavailable</span>
            ) : (
              <p className="text-base sm:text-lg font-bold text-foreground tabular-nums shrink-0">
                ${committedRecurring.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Line 3: Running Floor Out (Reframed as minimum floor, not finished total) */}
          <div className="border-t border-border/60 pt-3 flex items-baseline justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-500">
                {isLastDayOfMonth ? 'Total out' : 'Running floor out'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {subsUnavailable
                  ? 'Committed obligations unavailable'
                  : isLastDayOfMonth
                    ? 'Final month total (spent + committed)'
                    : 'Spent to date + full committed · floor for the month'}
              </p>
            </div>
            {subsUnavailable ? (
              <p className="text-xl sm:text-2xl font-bold text-muted-foreground tabular-nums shrink-0">
                —
              </p>
            ) : (
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums tracking-tight shrink-0">
                ${totalOut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>

        {/* Money In - Total Income */}
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Total Income</p>
              <p className="text-[11px] text-muted-foreground">
                {incomeData?.entriesCount || 0} {(incomeData?.entriesCount || 0) === 1 ? 'payment' : 'payments'} recorded
              </p>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums">
            ${(incomeData?.totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {!hasExpenses && hasIncome && (
        <div className="py-6 text-center text-muted-foreground text-xs">
          No expenses logged yet this month. Tap the Income tab above to view your source breakdown.
        </div>
      )}

      {hasExpenses && data && (
        <>
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
        </>
      )}
    </div>
  );
}
