"use client";

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

// Charts
import { MonthOverMonthChart } from './charts/month-over-month-chart';
import { CategoryBreakdownChart } from './charts/category-breakdown-chart';
import { MoodAnalysisChart } from './charts/mood-analysis-chart';

// Server Actions & Data
import { fetchPreviousMonthExpenses, fetchCurrentMonthExpenses } from '@/app/actions';
import { processV2Entries } from '@/lib/csv-parser';
import type { V2AnalyticsData } from '@/lib/types';

// Icons
import { PieChart, BarChart3, AlertCircle, Clock } from 'lucide-react';

export function PreviousMonthView() {
  const [data, setData] = useState<V2AnalyticsData | null>(null);
  const [currentTotal, setCurrentTotal] = useState<number>(0);
  const [currentMonthName, setCurrentMonthName] = useState<string>('');
  const [prevMonthName, setPrevMonthName] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const [prevEntries, currEntries] = await Promise.all([
          fetchPreviousMonthExpenses(),
          fetchCurrentMonthExpenses()
        ]);
        
        const processedPrev = processV2Entries(prevEntries);
        setData(processedPrev);
        
        const currTotal = currEntries.reduce((sum, e) => sum + e.amount, 0);
        setCurrentTotal(currTotal);
        
        const now = new Date();
        const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        if (currEntries.length > 0) {
          setCurrentMonthName(currEntries[0].month);
        } else {
          setCurrentMonthName(`${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`);
        }

        if (prevEntries.length > 0) {
          setPrevMonthName(prevEntries[0].month);
        } else {
          let pIndex = now.getMonth() - 1;
          let pYear = now.getFullYear();
          if (pIndex < 0) { pIndex = 11; pYear -= 1; }
          setPrevMonthName(`${MONTH_NAMES[pIndex]} ${pYear}`);
        }
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
        <p className="text-muted-foreground text-sm">Loading past data...</p>
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

  return (
    <div className="space-y-5 pt-2">
      <MonthOverMonthChart 
        currentTotal={currentTotal} 
        previousTotal={data?.grandTotal || 0} 
        currentMonthName={currentMonthName} 
        previousMonthName={prevMonthName} 
      />

      {data && data.entries.length > 0 ? (
        <>
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
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Clock className="w-8 h-8" />
          <p className="text-sm">No expenses logged in the previous month.</p>
          <p className="text-xs">Once you have historical data, it will appear here.</p>
        </div>
      )}
    </div>
  );
}
