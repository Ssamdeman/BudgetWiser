"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { fetchSubscriptions } from '@/app/actions';
import type { SubscriptionsData, Subscription, SubscriptionStatus, EndingSoonItem } from '@/lib/types';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Status badge styles
const statusConfig: Record<SubscriptionStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  Active: { 
    bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', 
    text: 'text-emerald-400',
    icon: <CheckCircle2 className="w-3 h-3" />
  },
  Canceled: { 
    bg: 'bg-red-500/15 text-red-400 border-red-500/30', 
    text: 'text-red-400',
    icon: <XCircle className="w-3 h-3" />
  },
  Done: { 
    bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30', 
    text: 'text-blue-400',
    icon: <Clock className="w-3 h-3" />
  },
};

// Bank badge styling with dynamic recognition
function getBankBadgeClass(bank?: string) {
  if (!bank) return 'bg-muted/60 text-muted-foreground border-border/40';
  const b = bank.toLowerCase();
  if (b.includes('apple')) return 'bg-zinc-800/80 text-zinc-200 border-zinc-700/60';
  if (b.includes('navy')) return 'bg-blue-950/60 text-blue-300 border-blue-800/40';
  if (b.includes('amex')) return 'bg-sky-950/60 text-sky-300 border-sky-800/40';
  if (b.includes('santander')) return 'bg-red-950/60 text-red-300 border-red-800/40';
  if (b.includes('capital')) return 'bg-orange-950/60 text-orange-300 border-orange-800/40';
  return 'bg-secondary/60 text-secondary-foreground border-border/40';
}

// Format cost display
function formatCost(cost: number, cycle: string): string {
  if (cost === 0) return 'Free';
  const suffix = cycle === 'Yearly' ? '/yr' : '/mo';
  return `$${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
}

// Format bill date with proper ordinal suffix
function formatBillDate(billDate?: number): string {
  if (!billDate) return '';
  const j = billDate % 10;
  const k = billDate % 100;
  if (j === 1 && k !== 11) return `${billDate}st`;
  if (j === 2 && k !== 12) return `${billDate}nd`;
  if (j === 3 && k !== 13) return `${billDate}rd`;
  return `${billDate}th`;
}

// Subscription Card Component for registry lists
function SubscriptionCard({ sub }: { sub: Subscription }) {
  const status = statusConfig[sub.status] || statusConfig.Active;
  const isFree = sub.cost === 0;
  
  return (
    <Card className="border-border/40 hover:border-border/80 transition-all duration-200 bg-card/60 backdrop-blur-sm shadow-xs">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Name and metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h4 className="font-semibold text-foreground tracking-tight truncate">{sub.name}</h4>
              <Badge variant="outline" className={cn('text-[11px] px-1.5 py-0 border', status.bg)}>
                <span className="flex items-center gap-1">
                  {status.icon}
                  {sub.status}
                </span>
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-muted-foreground">
              <span className="font-medium">{sub.category}</span>
              {sub.bank && (
                <span className={cn('px-1.5 py-0.5 rounded text-[11px] border font-medium', getBankBadgeClass(sub.bank))}>
                  {sub.bank}
                </span>
              )}
              {sub.billDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground/80" />
                  Bills {formatBillDate(sub.billDate)}
                </span>
              )}
              {sub.trialEnds && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  Trial ends {sub.trialEnds}
                </span>
              )}
              {sub.ends && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                  <Clock className="w-3 h-3 text-sky-400" />
                  Stops {sub.ends}
                </span>
              )}
            </div>
            
            {sub.notes && (
              <p className="text-xs text-muted-foreground/75 mt-2 italic truncate">
                {sub.notes}
              </p>
            )}
          </div>
          
          {/* Right: Cost */}
          <div className="text-right shrink-0">
            <p className={cn(
              "text-lg font-bold tabular-nums tracking-tight",
              isFree ? "text-emerald-400" : "text-foreground"
            )}>
              {formatCost(sub.cost, sub.cycle)}
            </p>
            <p className="text-[11px] text-muted-foreground capitalize font-medium">
              {sub.cycle}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Subscription Content Component
function SubscriptionContent({ data }: { data: SubscriptionsData }) {
  const [showSkippedDetails, setShowSkippedDetails] = useState(false);

  // Group subscriptions by status
  const activeList = data.subscriptions.filter(s => s.status === 'Active');
  const doneList = data.subscriptions.filter(s => s.status === 'Done');
  const canceledList = data.subscriptions.filter(s => s.status === 'Canceled');

  return (
    <div className="space-y-6">
      {/* 1. Two-Tier Warning Banner */}
      {(data.skippedRowsCount > 0 || data.flaggedFieldsCount > 0) && (
        <Card className={cn(
          "transition-all duration-200",
          data.skippedRowsCount > 0 
            ? "border-destructive/30 bg-destructive/5" 
            : "border-amber-500/30 bg-amber-500/5"
        )}>
          <CardContent className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className={cn(
                  "w-5 h-5 shrink-0 mt-0.5",
                  data.skippedRowsCount > 0 ? "text-destructive" : "text-amber-500"
                )} />
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {data.skippedRowsCount > 0 && data.flaggedFieldsCount > 0
                      ? `${data.skippedRowsCount} excluded from math • ${data.flaggedFieldsCount} metadata fields flagged`
                      : data.skippedRowsCount > 0
                        ? `${data.skippedRowsCount} ${data.skippedRowsCount === 1 ? 'row' : 'rows'} excluded from math`
                        : `${data.flaggedFieldsCount} ${data.flaggedFieldsCount === 1 ? 'field' : 'fields'} flagged (commitments counted)`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data.skippedRowsCount > 0
                      ? 'Rows with invalid Status, Cycle, or Cost cannot be counted. Metadata issues are counted as ongoing.'
                      : 'Minor date/bill day syntax issues. All subscriptions are counted (unparseable end dates treated as ongoing).'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSkippedDetails(!showSkippedDetails)}
                className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 shrink-0 py-1 px-2 rounded-md bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
              >
                {showSkippedDetails ? 'Hide' : 'Review'}
                {showSkippedDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showSkippedDetails && (
              <div className="mt-3 pt-2.5 border-t border-border/50 space-y-3">
                {/* Tier 1: Excluded from math */}
                {data.skippedRows.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Excluded from Math
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Unusable Status, Cycle, or Cost
                      </span>
                    </div>
                    {data.skippedRows.map((item, idx) => (
                      <div
                        key={`skip-${idx}`}
                        className="text-xs flex items-center justify-between p-2 rounded-lg bg-background/70 border border-destructive/20"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground">Sheet Row {item.rowNumber}</span>
                          {item.name && item.name !== 'Unknown' && (
                            <span className="text-muted-foreground font-medium"> · {item.name}</span>
                          )}
                          <p className="text-destructive font-medium">{item.reason}</p>
                        </div>
                        {item.offendingValue && (
                          <Badge variant="outline" className="text-[10px] font-mono border-destructive/40 text-destructive shrink-0 ml-2">
                            {item.offendingValue}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tier 2: Counted in math, flagged field */}
                {data.flaggedFields.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10">
                        Counted in Math
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Metadata typo (Bill Day, Trial Ends, Ends)
                      </span>
                    </div>
                    {data.flaggedFields.map((item, idx) => (
                      <div
                        key={`flag-${idx}`}
                        className="text-xs flex items-center justify-between p-2 rounded-lg bg-background/70 border border-amber-500/20"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground">Sheet Row {item.rowNumber}</span>
                            <span className="text-muted-foreground font-medium">· {item.name}</span>
                            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1 rounded">
                              {item.field}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-xs">{item.reason}</p>
                        </div>
                        {item.offendingValue && (
                          <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-400 shrink-0 ml-2">
                            {item.offendingValue}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2. Hero: Committed This Month (Single honest number) */}
      <Card className="border-primary/25 bg-gradient-to-br from-primary/10 via-card/50 to-background overflow-hidden relative shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />
        <CardContent className="py-7 relative">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Committed This Month</span>
            </div>

            <p className="text-4xl sm:text-5xl font-extrabold tracking-tight pt-1 text-foreground">
              ${data.committedThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>

            <p className="text-xs text-muted-foreground max-w-xs">
              Active monthly commitments billed this month. Ongoing rent and housing included.
            </p>

            {/* Counts Strip */}
            <div className="flex items-center gap-2 pt-2 text-xs">
              <span className="font-semibold text-emerald-400">{data.counts.active} Active</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-blue-400 font-medium">{data.counts.done} Done</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-red-400 font-medium">{data.counts.canceled} Canceled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Ending Soon Section (Highest value output: within 60 days) */}
      {data.endingSoon.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Ending Soon ({data.endingSoon.length})
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Next 60 days</span>
          </div>

          <div className="space-y-2.5">
            {data.endingSoon.map((item, idx) => {
              const isTrial = item.type === 'trial_ends';
              return (
                <Card 
                  key={idx}
                  className="border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-colors shadow-xs"
                >
                  <CardContent className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-foreground text-sm truncate">{item.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] px-1.5 py-0 font-medium border",
                              isTrial 
                                ? "border-amber-500/40 text-amber-400 bg-amber-500/10" 
                                : "border-sky-500/40 text-sky-400 bg-sky-500/10"
                            )}
                          >
                            {isTrial ? 'Trial Converting' : 'Commitment Ending'}
                          </Badge>
                          <span className="text-[11px] font-semibold text-amber-400/90">
                            {item.daysRemaining === 0 ? 'Due today' : `in ${item.daysRemaining} days`}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {isTrial ? (
                            <>Trial ends <strong className="text-foreground">{item.dateStr}</strong> (price will change)</>
                          ) : (
                            <>Payment stops on <strong className="text-foreground">{item.dateStr}</strong></>
                          )}
                          {item.bank && <span> · {item.bank}</span>}
                        </p>

                        {item.notes && (
                          <p className="text-xs text-muted-foreground/80 italic truncate">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {formatCost(item.cost, item.cycle)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Yearly Items Section (Real discrete payments, never divided by 12) */}
      {data.yearlyItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Yearly Items ({data.yearlyItems.length})
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Billed annually</span>
          </div>

          <p className="text-[11px] text-muted-foreground px-1 -mt-1">
            Real discrete payments due on scheduled dates. Not divided by 12.
          </p>

          <div className="space-y-2">
            {data.yearlyItems.map((item) => (
              <Card 
                key={item.name} 
                className="border-border/40 hover:border-border/80 transition-colors bg-card/50 shadow-xs"
              >
                <CardContent className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground text-sm truncate">{item.name}</h4>
                        <span className="text-xs text-muted-foreground">({item.category})</span>
                        {item.bank && (
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px] border font-medium', getBankBadgeClass(item.bank))}>
                            {item.bank}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {item.billDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due {formatBillDate(item.billDate)}
                          </span>
                        )}
                        {item.trialEnds && (
                          <span className="text-amber-400">
                            Renews / Changes {item.trialEnds}
                          </span>
                        )}
                        {item.notes && (
                          <span className="italic truncate">· {item.notes}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-foreground tabular-nums">
                        ${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">once a year</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 5. Full Registry Accordion (Active, Done, Canceled) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Registry All ({data.subscriptions.length})
          </h3>
          <span className="text-[11px] text-muted-foreground">All sheet records</span>
        </div>

        <Accordion 
          type="multiple" 
          defaultValue={["active"]}
          className="space-y-3"
        >
          {/* Active Subscriptions */}
          {activeList.length > 0 && (
            <AccordionItem value="active" className="border border-border/50 rounded-xl overflow-hidden bg-card/40">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium">Active</span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{activeList.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="space-y-2 pt-1">
                  {activeList.map((sub) => (
                    <SubscriptionCard key={`${sub.name}-${sub.category}`} sub={sub} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Done Subscriptions */}
          {doneList.length > 0 && (
            <AccordionItem value="done" className="border border-border/50 rounded-xl overflow-hidden bg-card/40">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Done</span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{doneList.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="space-y-2 pt-1">
                  {doneList.map((sub) => (
                    <SubscriptionCard key={`${sub.name}-${sub.category}`} sub={sub} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Canceled Subscriptions */}
          {canceledList.length > 0 && (
            <AccordionItem value="canceled" className="border border-border/50 rounded-xl overflow-hidden bg-card/40">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="font-medium">Canceled</span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{canceledList.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="space-y-2 pt-1">
                  {canceledList.map((sub) => (
                    <SubscriptionCard key={`${sub.name}-${sub.category}`} sub={sub} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </div>
  );
}

export function SubscriptionsView() {
  // Data state - fetched on mount
  const [data, setData] = useState<SubscriptionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchSubscriptions()
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading subscriptions from live sheet...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-destructive text-sm font-medium">Failed to load subscriptions: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return <SubscriptionContent data={data} />;
}
