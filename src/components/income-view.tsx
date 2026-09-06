// src/components/income-view.tsx
"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { fetchCurrentMonthIncome } from '@/app/actions';
import type { IncomeMonthData } from '@/lib/types';
import {
  DollarSign,
  Briefcase,
  Gift,
  Award,
  Laptop,
  Sparkles,
  HelpCircle,
  Clock,
  TrendingUp,
  Receipt,
  FileText
} from 'lucide-react';

const sourceIcons: Record<string, React.ElementType> = {
  Salary: Briefcase,
  Gift: Gift,
  Bonus: Award,
  Freelance: Laptop,
  Consulting: Sparkles,
  Other: HelpCircle,
};

export function IncomeView() {
  const [data, setData] = useState<IncomeMonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await fetchCurrentMonthIncome();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load income data');
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading || isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Calculating live income...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-center justify-center py-8 text-destructive text-sm">
          Failed to load income: {error}
        </CardContent>
      </Card>
    );
  }

  const hasIncome = data && data.totalIncome > 0;

  return (
    <div className="space-y-5 pt-2">
      {/* Hero: Current Month Gross Income */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background overflow-hidden relative shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent pointer-events-none" />
        <CardContent className="py-6 relative">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold tracking-wide uppercase">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{data?.month || 'Current Month'} Gross Income</span>
            </div>

            <p className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight pt-1">
              ${(data?.totalIncome || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <p className="text-sm text-muted-foreground">
              {hasIncome ? (
                <span>
                  Received across{' '}
                  <strong className="text-foreground font-semibold">
                    {data.entriesCount}
                  </strong>{' '}
                  {data.entriesCount === 1 ? 'payment' : 'payments'}
                </span>
              ) : (
                'No income logged this month yet'
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown by Source */}
      {hasIncome ? (
        <Card className="border-border/60 hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-lg">Income by Source</CardTitle>
                  <CardDescription className="text-xs">Distribution of money arrived</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-normal border-emerald-500/30 text-emerald-500">
                {data.breakdown.length} {data.breakdown.length === 1 ? 'source' : 'sources'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {data.breakdown.map((item) => {
              const Icon = sourceIcons[item.source] || HelpCircle;
              return (
                <div key={item.source} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-muted text-muted-foreground">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-foreground">{item.source}</span>
                      <span className="text-xs text-muted-foreground">
                        ({item.count} {item.count === 1 ? 'entry' : 'entries'})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">
                        ${item.total.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 font-medium">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-border/70 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
            <Clock className="w-8 h-8 text-muted-foreground/60" />
            <p className="text-sm font-medium">Awaiting income entries</p>
            <p className="text-xs max-w-xs text-muted-foreground">
              Once money arrives and is logged, your source breakdown and gross totals will appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Income Log Entries */}
      {hasIncome && data.entries.length > 0 && (
        <Card className="border-border/60 hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-lg">Monthly Log</CardTitle>
                <CardDescription className="text-xs">Individual payments received</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border/40">
              {data.entries.map((entry, index) => {
                const Icon = sourceIcons[entry.source] || HelpCircle;
                return (
                  <div key={index} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-muted/60 text-muted-foreground">
                        <Icon className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-tight">
                          {entry.source}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.date}
                          {entry.notes && (
                            <span className="italic ml-1">· {entry.notes}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-500 text-base">
                        +${entry.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
