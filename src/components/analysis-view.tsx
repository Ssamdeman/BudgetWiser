"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { MonthlySpendingChart } from './charts/monthly-spending-chart';
import { CategoryBreakdownChart } from './charts/category-breakdown-chart';
import { CategoryByMonthChart } from './charts/category-by-month-chart';
import { MonthOverMonthChart } from './charts/month-over-month-chart';
import { fetchAndParseCSV, type AnalyticsData } from '@/lib/csv-parser';
import { TrendingUp, PieChart, BarChart3, ArrowUpDown } from 'lucide-react';

export function AnalysisView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAndParseCSV()
      .then(setData)
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

  if (error || !data) {
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
      {/* Hero Total Summary */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <CardContent className="py-6 relative">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Total Spent</p>
            <p className="text-4xl font-bold text-primary tracking-tight">
              ${data.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              across <span className="font-medium text-foreground">{data.monthCount}</span> months
            </p>
          </div>
        </CardContent>
      </Card>

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
          <MonthlySpendingChart data={data.monthlyTotals} />
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
          <CategoryBreakdownChart data={data.categoryTotals} />
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
          <CategoryByMonthChart data={data.categoryByMonth} categories={data.allCategories} />
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
          <MonthOverMonthChart data={data.monthlyChanges} />
        </CardContent>
      </Card>
    </div>
  );
}
