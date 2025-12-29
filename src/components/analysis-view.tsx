"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';

// V1 Charts
import { MonthlySpendingChart } from './charts/monthly-spending-chart';
import { CategoryBreakdownChart } from './charts/category-breakdown-chart';
import { CategoryByMonthChart } from './charts/category-by-month-chart';
import { MonthOverMonthChart } from './charts/month-over-month-chart';

// V2 Charts
import { MonthlyMoodChart } from './charts/monthly-mood-chart';
import { MoodAnalysisChart } from './charts/mood-analysis-chart';
import { SpendingHeatmap } from './charts/spending-heatmap';
import { DayTimeBarsChart } from './charts/day-time-bars-chart';

// Data & Types
import { fetchAndParseCSV, fetchAndParseV2CSV, type AnalyticsData } from '@/lib/csv-parser';
import type { V2AnalyticsData } from '@/lib/types';

// Icons
import { 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  ArrowUpDown, 
  Brain, 
  Calendar, 
  Clock, 
  Grid3X3, 
  Sparkles,
  History
} from 'lucide-react';

export function AnalysisView() {
  const [v1Data, setV1Data] = useState<AnalyticsData | null>(null);
  const [v2Data, setV2Data] = useState<V2AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAndParseCSV(),
      fetchAndParseV2CSV()
    ])
      .then(([v1, v2]) => {
        setV1Data(v1);
        setV2Data(v2);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your insights...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || (!v1Data && !v2Data)) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-destructive">Failed to load data: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero Section - V2 Insights Summary */}
      {v2Data && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <CardContent className="py-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Spent */}
              <div className="text-center md:text-left">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">2026 Total Spent</p>
                <p className="text-3xl font-bold text-primary tracking-tight">
                  ${v2Data.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  across <span className="font-medium text-foreground">{v2Data.monthCount}</span> months
                </p>
              </div>
              
              {/* Top Mood */}
              {v2Data.topMood && (
                <div className="text-center border-l border-r border-border/30 px-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Top Mood</p>
                  <p className="text-2xl font-bold text-foreground">{v2Data.topMood.mood}</p>
                  <p className="text-sm text-primary font-medium">{v2Data.topMood.percentage}% of spending</p>
                </div>
              )}
              
              {/* Peak Spending Time */}
              {v2Data.peakSpendingTime && (
                <div className="text-center md:text-right">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Peak Spending</p>
                  <p className="text-2xl font-bold text-foreground">
                    {v2Data.peakSpendingTime.day.slice(0, 3)} {v2Data.peakSpendingTime.timeOfDay}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${v2Data.peakSpendingTime.total.toFixed(2)} spent
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback Hero for V1 only */}
      {!v2Data && v1Data && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <CardContent className="py-6 relative">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Total Spent</p>
              <p className="text-4xl font-bold text-primary tracking-tight">
                ${v1Data.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                across <span className="font-medium text-foreground">{v1Data.monthCount}</span> months
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accordion Sections */}
      <Accordion 
        type="multiple" 
        defaultValue={v2Data ? ["v2-insights"] : ["v1-historical"]}
        className="space-y-4"
      >
        {/* V2 Section - 2026 Insights (Expanded by default, FIRST) */}
        {v2Data && (
          <AccordionItem value="v2-insights" className="border border-border/50 rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">2026 Insights</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Current</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal">
                    Mood, timing, and behavioral patterns
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <div className="space-y-5 pt-2">
                {/* Chart 1: Monthly Spending by Mood */}
                <Card className="border-border/50 hover:border-border transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Brain className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Monthly Spending by Mood</CardTitle>
                        <CardDescription className="text-xs">How your spending moods shift over time</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <MonthlyMoodChart data={v2Data.moodByMonth} />
                  </CardContent>
                </Card>

                {/* Chart 2: Category Breakdown (Reused) */}
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
                    <CategoryBreakdownChart data={v2Data.categoryTotals} />
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
                    <MoodAnalysisChart data={v2Data.moodTotals} />
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
                    <SpendingHeatmap data={v2Data.heatmapData} />
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
                    <DayTimeBarsChart dayData={v2Data.dayTotals} timeData={v2Data.timeOfDayTotals} />
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* V1 Section - 2025 Historical (Collapsed by default, SECOND) */}
        {v1Data && (
          <AccordionItem value="v1-historical" className="border border-border/50 rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <History className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">2025 Historical</span>
                    <Badge variant="secondary">Historical</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal">
                    Full year spending analysis
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <div className="space-y-5 pt-2">
                {/* Monthly Spending Chart */}
                <Card className="border-border/50 hover:border-border transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <TrendingUp className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Monthly Spending</CardTitle>
                        <CardDescription className="text-xs">Your spending trends throughout 2025</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <MonthlySpendingChart data={v1Data.monthlyTotals} />
                  </CardContent>
                </Card>

                {/* Category Breakdown Chart */}
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
                    <CategoryBreakdownChart data={v1Data.categoryTotals} />
                  </CardContent>
                </Card>

                {/* Category by Month Chart */}
                <Card className="border-border/50 hover:border-border transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Category by Month</CardTitle>
                        <CardDescription className="text-xs">See which categories dominate each month</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CategoryByMonthChart data={v1Data.categoryByMonth} categories={v1Data.allCategories} />
                  </CardContent>
                </Card>

                {/* Month-over-Month Change Chart */}
                <Card className="border-border/50 hover:border-border transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <ArrowUpDown className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Month-over-Month</CardTitle>
                        <CardDescription className="text-xs">How your spending changes from month to month</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <MonthOverMonthChart data={v1Data.monthlyChanges} />
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
