// src/components/log-hub.tsx
"use client";

import React, { useState } from 'react';
import { LogExpenseForm } from '@/components/log-expense-form';
import { LogIncomeForm } from '@/components/log-income-form';
import { LogHoldingForm } from '@/components/log-holding-form';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, PiggyBank } from 'lucide-react';

export function LogHub() {
  const [mode, setMode] = useState<'expense' | 'income' | 'holding'>('expense');

  return (
    <div className="space-y-4">
      {/* Segmented Control */}
      <div className="flex p-1 bg-muted/80 backdrop-blur-md rounded-2xl border border-border/60 shadow-inner">
        <button
          type="button"
          onClick={() => setMode('expense')}
          className={cn(
            "flex-1 py-2 px-1 text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2",
            mode === 'expense'
              ? "bg-card text-foreground shadow-md font-semibold ring-1 ring-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          )}
        >
          <div className={cn(
            "p-1 rounded-md transition-colors",
            mode === 'expense' ? "bg-rose-500/10 text-rose-500" : "text-muted-foreground"
          )}>
            <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span>Expense</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('income')}
          className={cn(
            "flex-1 py-2 px-1 text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2",
            mode === 'income'
              ? "bg-card text-foreground shadow-md font-semibold ring-1 ring-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          )}
        >
          <div className={cn(
            "p-1 rounded-md transition-colors",
            mode === 'income' ? "bg-emerald-500/10 text-emerald-500" : "text-muted-foreground"
          )}>
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span>Income</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('holding')}
          className={cn(
            "flex-1 py-2 px-1 text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2",
            mode === 'holding'
              ? "bg-card text-foreground shadow-md font-semibold ring-1 ring-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          )}
        >
          <div className={cn(
            "p-1 rounded-md transition-colors",
            mode === 'holding' ? "bg-indigo-500/10 text-indigo-500" : "text-muted-foreground"
          )}>
            <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span>Holding</span>
        </button>
      </div>

      {/* Dynamic Content */}
      <div className="transition-all duration-300">
        {mode === 'expense' && <LogExpenseForm />}
        {mode === 'income' && <LogIncomeForm />}
        {mode === 'holding' && <LogHoldingForm />}
      </div>
    </div>
  );
}

