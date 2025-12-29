"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { SubscriptionPasswordGate } from './subscription-password-gate';
import { fetchSubscriptions } from '@/lib/subscription-parser';
import type { SubscriptionsData, Subscription, SubscriptionStatus } from '@/lib/types';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Auto-lock timer duration (10 minutes in ms)
const AUTO_LOCK_DURATION = 10 * 60 * 1000;

// Status badge styles
const statusConfig: Record<SubscriptionStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  Active: { 
    bg: 'bg-emerald-500/20', 
    text: 'text-emerald-400',
    icon: <CheckCircle2 className="w-3 h-3" />
  },
  Canceled: { 
    bg: 'bg-red-500/20', 
    text: 'text-red-400',
    icon: <XCircle className="w-3 h-3" />
  },
  Done: { 
    bg: 'bg-blue-500/20', 
    text: 'text-blue-400',
    icon: <Clock className="w-3 h-3" />
  },
};

// Bank badge colors
const bankColors: Record<string, string> = {
  Navy: 'bg-blue-900/50 text-blue-300',
  'Apple Card': 'bg-zinc-700/50 text-zinc-300',
  Santander: 'bg-red-800/50 text-red-300',
  'Capital One': 'bg-orange-700/50 text-orange-300',
};

// Format cost display
function formatCost(cost: number, cycle: string): string {
  if (cost === 0) return 'Free';
  const suffix = cycle === 'Yearly' ? '/yr' : '/mo';
  return `$${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
}

// Format bill date
function formatBillDate(billDate?: number): string {
  if (!billDate) return '';
  const suffix = billDate === 1 ? 'st' : billDate === 2 ? 'nd' : billDate === 3 ? 'rd' : 'th';
  return `${billDate}${suffix}`;
}

// Subscription Card Component
function SubscriptionCard({ sub }: { sub: Subscription }) {
  const status = statusConfig[sub.status];
  const isFree = sub.cost === 0;
  
  return (
    <Card className="border-border/50 hover:border-border transition-colors bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Name and details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground truncate">{sub.name}</h4>
              <Badge className={cn('text-xs px-1.5 py-0', status.bg, status.text)}>
                {sub.status}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{sub.category}</span>
              {sub.bank && (
                <span className={cn('px-1.5 py-0.5 rounded text-xs', bankColors[sub.bank] || 'bg-muted')}>
                  {sub.bank}
                </span>
              )}
              {sub.billDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatBillDate(sub.billDate)}
                </span>
              )}
            </div>
            
            {sub.notes && (
              <p className="text-xs text-muted-foreground/70 mt-2 italic truncate">
                {sub.notes}
              </p>
            )}
          </div>
          
          {/* Right: Cost */}
          <div className="text-right shrink-0">
            <p className={cn(
              "text-lg font-bold tabular-nums",
              isFree ? "text-emerald-400" : "text-primary"
            )}>
              {formatCost(sub.cost, sub.cycle)}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {sub.cycle.replace('-', ' ')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Subscription Content (shown after unlock)
function SubscriptionContent({ data }: { data: SubscriptionsData }) {
  // Group subscriptions by status
  const activeList = data.subscriptions.filter(s => s.status === 'Active');
  const doneList = data.subscriptions.filter(s => s.status === 'Done');
  const canceledList = data.subscriptions.filter(s => s.status === 'Canceled');

  return (
    <div className="space-y-5">
      {/* Summary Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <CardContent className="py-5 relative">
          {/* Totals Row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Monthly</p>
              <p className="text-2xl font-bold text-primary tracking-tight">
                ${data.monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Yearly</p>
              <p className="text-2xl font-bold text-foreground tracking-tight">
                ${data.yearlyTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          
          {/* Counts Row */}
          <div className="flex justify-center items-center gap-2 text-sm">
            <span className="font-semibold text-emerald-400">{data.counts.active} Active</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-blue-400">{data.counts.done} Done</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-red-400">{data.counts.canceled} Canceled</span>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Lists - Accordion */}
      <Accordion 
        type="multiple" 
        defaultValue={["active"]}
        className="space-y-3"
      >
        {/* Active Subscriptions */}
        {activeList.length > 0 && (
          <AccordionItem value="active" className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-medium">Active</span>
                <Badge variant="secondary" className="text-xs">{activeList.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-2 pt-1">
                {activeList.map((sub) => (
                  <SubscriptionCard key={sub.name} sub={sub} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Done Subscriptions */}
        {doneList.length > 0 && (
          <AccordionItem value="done" className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="font-medium">Done</span>
                <Badge variant="secondary" className="text-xs">{doneList.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-2 pt-1">
                {doneList.map((sub) => (
                  <SubscriptionCard key={sub.name} sub={sub} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Canceled Subscriptions */}
        {canceledList.length > 0 && (
          <AccordionItem value="canceled" className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="font-medium">Canceled</span>
                <Badge variant="secondary" className="text-xs">{canceledList.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-2 pt-1">
                {canceledList.map((sub) => (
                  <SubscriptionCard key={sub.name} sub={sub} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

export function SubscriptionsView() {
  // Auth state - always starts locked
  const [isUnlocked, setIsUnlocked] = useState(false);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Data state - only fetched after unlock
  const [data, setData] = useState<SubscriptionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
      }
    };
  }, []);

  // Handle successful unlock
  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
    setLoading(true);
    setError(null);
    
    // Fetch data after unlock
    fetchSubscriptions()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    
    // Start 10-minute auto-lock timer (silent)
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
    }
    lockTimerRef.current = setTimeout(() => {
      setIsUnlocked(false);
      setData(null);
    }, AUTO_LOCK_DURATION);
  }, []);

  // Show password gate when locked
  if (!isUnlocked) {
    return <SubscriptionPasswordGate onUnlock={handleUnlock} />;
  }

  // Loading state (after unlock)
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading subscriptions...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-destructive">Failed to load subscriptions: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return <SubscriptionContent data={data} />;
}
