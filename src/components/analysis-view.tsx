"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { MonthlySpendingChart } from './charts/monthly-spending-chart';
import { CategoryBreakdownChart } from './charts/category-breakdown-chart';
import { fetchAndParseCSV, type AnalyticsData } from '@/lib/csv-parser';

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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-destructive">Failed to load data: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="text-center">
            <span className="text-2xl font-bold text-primary">
              ${data.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="ml-2 text-muted-foreground">
              total spent across {data.monthCount} months
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Spending Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending</CardTitle>
          <CardDescription>Your spending trends throughout 2025</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlySpendingChart data={data.monthlyTotals} />
        </CardContent>
      </Card>

      {/* Category Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Total spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryBreakdownChart data={data.categoryTotals} />
        </CardContent>
      </Card>
    </div>
  );
}
