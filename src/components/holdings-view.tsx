// src/components/holdings-view.tsx
"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { fetchHoldingsSummary } from '@/app/actions';
import type { HoldingsSummaryData, HoldingType } from '@/lib/types';
import {
  Landmark,
  PiggyBank,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  History,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(val: number): string {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-$${formatted}` : `$${formatted}`;
}

export function HoldingsView() {
  const [data, setData] = useState<HoldingsSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllMovements, setShowAllMovements] = useState(false);
  const [showSkippedDetails, setShowSkippedDetails] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await fetchHoldingsSummary();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load holdings data');
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading || isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Computing live holdings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-center justify-center py-8 text-destructive text-sm">
          Failed to load holdings: {error}
        </CardContent>
      </Card>
    );
  }

  const hasHoldings = data && data.locations.length > 0;
  const hasSkippedRows = data && data.skippedRowsCount > 0;

  return (
    <div className="space-y-5 pt-2">
      {/* Warning Banner: Surfacing Skipped Typo / Invalid Rows */}
      {hasSkippedRows && (
        <Card className="border-amber-500/50 bg-amber-500/10 backdrop-blur-sm shadow-sm">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {data.skippedRowsCount} {data.skippedRowsCount === 1 ? 'row' : 'rows'} skipped in Holdings sheet
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Unrecognized type or invalid data. Excluded from balance math until fixed in your Google Sheet.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSkippedDetails(!showSkippedDetails)}
                className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 shrink-0 py-1 px-2 rounded-md bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
              >
                {showSkippedDetails ? 'Hide' : 'Fix details'}
                {showSkippedDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showSkippedDetails && (
              <div className="mt-3 pt-2.5 border-t border-amber-500/20 space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Rows requiring attention in sheet:
                </p>
                {data.skippedRows.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-xs flex items-center justify-between p-2 rounded-lg bg-background/60 border border-amber-500/20"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground">Sheet Row {item.rowNumber}</span>
                      {item.location && item.location !== 'Unknown' && (
                        <span className="text-muted-foreground font-medium"> · {item.location}</span>
                      )}
                      <p className="text-destructive font-medium">{item.reason}</p>
                    </div>
                    {item.rawType && (
                      <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-500 shrink-0 ml-2">
                        {item.rawType}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hero: Combined Total Holdings (All-Time) */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-background to-background overflow-hidden relative shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
        <CardContent className="py-6 relative">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-semibold tracking-wide uppercase">
              <Landmark className="w-3.5 h-3.5" />
              <span>All-Time Parked Capital</span>
            </div>

            <p className={cn(
              "text-4xl sm:text-5xl font-extrabold tracking-tight pt-1",
              (data?.combinedBalance ?? 0) < 0 ? "text-destructive" : "text-foreground"
            )}>
              {formatCurrency(data?.combinedBalance || 0)}
            </p>

            <p className="text-xs text-muted-foreground">
              Cumulative balance derived across{' '}
              <strong className="text-foreground font-semibold">
                {data?.accountCount || 0}
              </strong>{' '}
              {(data?.accountCount || 0) === 1 ? 'account' : 'accounts'}
            </p>

            {/* Quick Metrics Strip: Contributed, Opening, Withdrawn (Strictly Separate) */}
            {hasHoldings && (
              <div className="grid grid-cols-3 gap-2 w-full max-w-sm mt-3 pt-3 border-t border-border/50 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Contributed</p>
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(data.combinedContributed)}
                  </p>
                  <span className="text-[9px] text-muted-foreground block">tracked in</span>
                </div>
                <div className="border-l border-r border-border/50">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Opening</p>
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(data.combinedOpening)}
                  </p>
                  <span className="text-[9px] text-muted-foreground block">starting base</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Withdrawn</p>
                  <p className="text-sm font-bold text-muted-foreground">
                    {formatCurrency(data.combinedWithdrawn)}
                  </p>
                  <span className="text-[9px] text-muted-foreground block">pulled out</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Philosophy Callout: Contributed vs Valuation */}
      <div className="px-1 text-[11px] text-muted-foreground text-center">
        Shows capital contributed, not market value. No gains, valuations, or net calculations.
      </div>

      {/* Per Location Breakdown */}
      {hasHoldings ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Accounts ({data.locations.length})
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">Derived from movements</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {data.locations.map((loc) => {
              const isNegative = loc.balance < 0;
              return (
                <Card
                  key={loc.location}
                  className={cn(
                    "border-border/60 hover:border-border transition-colors",
                    isNegative && "border-destructive/40 bg-destructive/5"
                  )}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Top Row: Name & Headline Balance */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground">
                            {loc.location}
                          </span>
                          {isNegative && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Check Entries
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Started {loc.startDate}</span>
                          <span>·</span>
                          <span>{loc.entryCount} {loc.entryCount === 1 ? 'movement' : 'movements'}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Balance
                        </p>
                        <p className={cn(
                          "text-xl font-extrabold tracking-tight",
                          isNegative ? "text-destructive" : "text-foreground"
                        )}>
                          {formatCurrency(loc.balance)}
                        </p>
                      </div>
                    </div>

                    {/* Stats Strip: Three Separate Lines (Contributed, Opening, Withdrawn) */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Contributed</span>
                        <span className="font-semibold text-foreground">{formatCurrency(loc.totalContributed)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Opening</span>
                        <span className="font-medium text-foreground">{formatCurrency(loc.openingBalance)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Withdrawn</span>
                        <span className="font-medium text-muted-foreground">{formatCurrency(loc.totalWithdrawn)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (

        <Card className="border-dashed border-border/70 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
            <Clock className="w-8 h-8 text-muted-foreground/60" />
            <p className="text-sm font-medium">No holdings logged yet</p>
            <p className="text-xs max-w-xs text-muted-foreground">
              Log your opening balance or contributions under the Data tab to track your parked capital here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Movements History Log */}
      {hasHoldings && data.recentEntries.length > 0 && (
        <Card className="border-border/60 hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-lg">Holdings Movement Log</CardTitle>
                  <CardDescription className="text-xs">All-time record of funds parked & moved</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-normal border-border">
                {data.recentEntries.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border/40">
              {(showAllMovements ? data.recentEntries : data.recentEntries.slice(0, 10)).map((entry, idx) => {
                const isOpening = entry.type === 'opening';
                const isWithdrawal = entry.type === 'withdrawal';
                const isContribution = entry.type === 'contribution';

                return (
                  <div key={idx} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl",
                        isOpening && "bg-blue-500/10 text-blue-500",
                        isWithdrawal && "bg-amber-500/10 text-amber-500",
                        isContribution && "bg-indigo-500/10 text-indigo-500"
                      )}>
                        {isOpening && <ShieldCheck className="w-4 h-4" />}
                        {isWithdrawal && <ArrowUpRight className="w-4 h-4" />}
                        {isContribution && <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground leading-tight">
                            {entry.location}
                          </p>
                          <span className={cn(
                            "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                            isOpening && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
                            isWithdrawal && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                            isContribution && "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                          )}>
                            {entry.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.date}
                          {entry.notes && (
                            <span className="italic ml-1">· {entry.notes}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={cn(
                        "font-bold text-base",
                        isWithdrawal ? "text-amber-500" : isOpening ? "text-blue-500" : "text-indigo-500"
                      )}>
                        {isWithdrawal ? '-' : '+'}{formatCurrency(entry.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {data.recentEntries.length > 10 && (
              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllMovements(!showAllMovements)}
                  className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  {showAllMovements ? (
                    <>
                      Show less <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Show all {data.recentEntries.length} movements <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
