"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchBudgetData } from "@/app/actions";
import type { BudgetViewData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Wallet,
  Sparkles,
  Layers,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BudgetView() {
  const [budgetData, setBudgetData] = useState<BudgetViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadBudget = () => {
    startTransition(async () => {
      const res = await fetchBudgetData();
      if (res.error) {
        setError(res.error);
      } else {
        setError(null);
        setBudgetData(res.data);
      }
    });
  };

  useEffect(() => {
    loadBudget();
  }, []);

  if (error) {
    return (
      <Card className="border-rose-500/30 bg-rose-500/5">
        <CardContent className="pt-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-medium text-foreground">Budget plan unavailable</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={loadBudget} disabled={isPending}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isPending && "animate-spin")} />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!budgetData) {
    return (
      <div className="py-12 text-center space-y-3">
        <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Loading budget plan from sheet...</p>
      </div>
    );
  }

  const {
    spentSoFar,
    totalCap,
    totalRemaining,
    isOverTotal,
    overTotalAmount,
    daysRemainingInMonth,
    sumOfCaps,
    buffer,
    capsExceedTotal,
    categoryItems,
    noCapItems,
    issues,
    excludedTransactionsCount,
  } = budgetData;

  return (
    <div className="space-y-6">
      {/* 1. Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-headline text-foreground tracking-tight">
            Plan vs Spent
          </h2>
          <p className="text-xs text-muted-foreground">
            Current month logged spending against your sheet plan
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadBudget}
          disabled={isPending}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isPending && "animate-spin")} />
          <span className="text-xs">Refresh</span>
        </Button>
      </div>

      {/* 2. Problem / Diagnostic Banner */}
      {(issues.length > 0 || excludedTransactionsCount > 0) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-500">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Sheet Notices ({issues.length + (excludedTransactionsCount > 0 ? 1 : 0)})</span>
          </div>

          <ul className="space-y-1.5 text-muted-foreground pl-6 list-disc">
            {issues.map((issue, idx) => (
              <li key={idx} className="leading-relaxed">
                {issue.sheetRowNumber ? (
                  <span className="font-mono text-foreground font-medium">
                    {issue.source} Row {issue.sheetRowNumber}:{" "}
                  </span>
                ) : (
                  <span className="font-mono text-foreground font-medium">
                    {issue.source}:{" "}
                  </span>
                )}
                {issue.reason}
              </li>
            ))}
            {excludedTransactionsCount > 0 && (
              <li className="leading-relaxed">
                <span className="font-mono text-foreground font-medium">Transactions: </span>
                {excludedTransactionsCount}{" "}
                {excludedTransactionsCount === 1 ? "row" : "rows"} excluded because amount was blank, zero, or non-numeric.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* 3. Hero Card: Spent So Far vs Total Cap */}
      <Card className="border-border/70 bg-card/60 backdrop-blur-sm overflow-hidden relative shadow-sm">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Spent so far
              </span>
              <p className="text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums tracking-tight">
                ${spentSoFar.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {totalCap !== null ? "Total Cap" : "Total Cap"}
              </span>
              {totalCap !== null ? (
                <p className="text-2xl sm:text-3xl font-bold text-muted-foreground tabular-nums tracking-tight">
                  ${totalCap.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              ) : (
                <p className="text-sm font-semibold text-amber-500 italic">No Total row</p>
              )}
            </div>
          </div>

          {/* Progress Bar for Total Cap */}
          {totalCap !== null && totalCap > 0 && (
            <div className="space-y-2">
              <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isOverTotal ? "bg-rose-500" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(100, Math.round((spentSoFar / totalCap) * 100))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-medium">
                {isOverTotal ? (
                  <span className="text-rose-500 font-semibold">
                    Over by ${overTotalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold">
                    ${(totalRemaining || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                    left
                  </span>
                )}

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {daysRemainingInMonth} {daysRemainingInMonth === 1 ? "day" : "days"} left
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Strip: Guide Caps Sum + Buffer */}
          <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[11px] text-muted-foreground">Guide caps sum</p>
              <p className="font-semibold text-foreground tabular-nums">
                ${sumOfCaps.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Buffer (Total − Caps)</p>
              {buffer !== null ? (
                capsExceedTotal ? (
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/30 text-[10px]">
                    Caps exceed Total by ${Math.abs(buffer).toFixed(2)}
                  </Badge>
                ) : (
                  <p className="font-semibold text-foreground tabular-nums">
                    ${buffer.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )
              ) : (
                <span className="text-muted-foreground italic text-xs">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Category Bars (Guide Caps) */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-sm font-semibold text-foreground">Guide Caps</h3>
          <span className="text-[11px] text-muted-foreground">
            {categoryItems.length} {categoryItems.length === 1 ? "category" : "categories"}
          </span>
        </div>

        {categoryItems.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-6 text-center text-xs text-muted-foreground">
              No category caps found in Budget tab.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {categoryItems.map((item) => {
              const pct = item.cap > 0 ? Math.min(100, Math.round((item.spent / item.cap) * 100)) : 0;
              return (
                <Card
                  key={item.category}
                  className={cn(
                    "border-border/50 bg-card/40 transition-colors",
                    item.isOverCap && "border-rose-500/40 bg-rose-500/[0.02]"
                  )}
                >
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{item.category}</span>
                        {item.isOverCap && (
                          <Badge
                            variant="outline"
                            className="bg-rose-500/10 text-rose-500 border-rose-500/30 text-[10px] py-0 px-1.5 h-4"
                          >
                            Over cap by ${item.overAmount.toFixed(2)}
                          </Badge>
                        )}
                      </div>

                      <div className="text-right text-xs tabular-nums">
                        <span className={cn("font-bold", item.isOverCap ? "text-rose-400" : "text-foreground")}>
                          ${item.spent.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground"> / ${item.cap.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Category bar */}
                    <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          item.isOverCap ? "bg-rose-500" : "bg-primary"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. No-Cap Spending Section */}
      {noCapItems.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-baseline justify-between px-1">
            <div>
              <h3 className="text-sm font-semibold text-foreground">No cap</h3>
              <p className="text-[11px] text-muted-foreground">
                Spending in categories without a guide cap · counts toward Total
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {noCapItems.map((item) => (
              <div
                key={item.category}
                className="p-3 rounded-xl bg-card/40 border border-border/50 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/60" />
                  <span className="font-medium text-foreground">{item.category}</span>
                </div>
                <span className="font-bold text-foreground tabular-nums">
                  ${item.spent.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

