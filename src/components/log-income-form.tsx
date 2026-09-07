// src/components/log-income-form.tsx
"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { logIncomeAction, fetchIncomeSources } from '@/app/actions';
import { seedIncomeSources, incomeSchema, type IncomeFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  DollarSign,
  Briefcase,
  Gift,
  HelpCircle,
  Calendar as CalendarIcon,
  PlusCircle,
  ArrowLeft,
} from 'lucide-react';

const ADD_NEW_SOURCE_VALUE = '__ADD_NEW_SOURCE__';

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function LogIncomeForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Dynamic sources derived from sheet + seed fallback
  const [sources, setSources] = useState<string[]>([...seedIncomeSources]);
  const [isCustomSource, setIsCustomSource] = useState(false);
  const [customSourceName, setCustomSourceName] = useState('');

  const today = getTodayString();
  const yesterday = getYesterdayString();

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: undefined,
      source: '',
      date: today,
      notes: '',
    },
  });

  // Fetch derived sources from sheet on mount
  useEffect(() => {
    fetchIncomeSources()
      .then((derived) => {
        if (derived && derived.length > 0) {
          setSources(derived);
        }
      })
      .catch((err) => {
        console.error('Failed to load derived sources:', err);
      });
  }, []);

  function handleSourceSelect(val: string) {
    if (val === ADD_NEW_SOURCE_VALUE) {
      setIsCustomSource(true);
      form.setValue('source', customSourceName, { shouldValidate: false });
    } else {
      setIsCustomSource(false);
      form.setValue('source', val, { shouldValidate: true });
    }
  }

  function handleCustomSourceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setCustomSourceName(val);
    form.setValue('source', val, { shouldValidate: true });
  }

  function handleCancelCustomSource() {
    setIsCustomSource(false);
    setCustomSourceName('');
    form.setValue('source', '', { shouldValidate: false });
  }

  function onSubmit(values: IncomeFormData) {
    startTransition(async () => {
      const result = await logIncomeAction(values);

      if (result.success) {
        toast({
          title: 'Income Logged!',
          description: result.message,
        });

        // Add newly entered source to local list if not already present
        if (values.source && !sources.includes(values.source)) {
          setSources((prev) => [...prev, values.source].sort());
        }

        form.reset({
          amount: undefined,
          source: '',
          date: getTodayString(),
          notes: '',
        });
        setIsCustomSource(false);
        setCustomSourceName('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to log income',
          description: result.message,
        });
      }
    });
  }

  return (
    <Card className="border-border/60 shadow-lg backdrop-blur-sm bg-card/80">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-3xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <DollarSign className="w-6 h-6" />
          </div>
          <span>Log Income</span>
        </CardTitle>
        <p className="text-center text-xs text-muted-foreground mt-1">
          Gross money arrived. Permanent and append-only.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-center block text-sm font-medium">Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-semibold">
                        $
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8 text-lg font-semibold h-12"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source - Derived Picker with New Source Option */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Source</FormLabel>
                    {isCustomSource && (
                      <button
                        type="button"
                        onClick={handleCancelCustomSource}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Choose existing
                      </button>
                    )}
                  </div>

                  <FormControl>
                    {isCustomSource ? (
                      <div className="space-y-1.5">
                        <Input
                          autoFocus
                          type="text"
                          placeholder="Type new client or source name..."
                          className="h-12"
                          value={customSourceName}
                          onChange={handleCustomSourceChange}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          This name will be saved to your sheet and appear in the picker from now on.
                        </p>
                      </div>
                    ) : (
                      <Select
                        onValueChange={handleSourceSelect}
                        value={field.value || ''}
                      >
                        <SelectTrigger
                          className="h-12"
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (document.activeElement instanceof HTMLElement) {
                              document.activeElement.blur();
                            }
                          }}
                        >
                          <SelectValue placeholder="Select income source" />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom">
                          {sources.map((source) => {
                            const isSalary = source === 'Salary';
                            const isGift = source === 'Gift';
                            const Icon = isSalary ? Briefcase : isGift ? Gift : HelpCircle;
                            return (
                              <SelectItem key={source} value={source}>
                                <div className="flex items-center gap-2.5 py-1">
                                  <Icon className="h-4 w-4 text-emerald-500" />
                                  <span className="font-medium">{source}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                          <SelectSeparator />
                          <SelectItem
                            value={ADD_NEW_SOURCE_VALUE}
                            className="text-emerald-500 font-medium focus:text-emerald-500 focus:bg-emerald-500/10"
                          >
                            <div className="flex items-center gap-2 py-1">
                              <PlusCircle className="h-4 w-4" />
                              <span>+ Add new source...</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date with quick pills */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Date</FormLabel>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => form.setValue('date', today, { shouldValidate: true })}
                        className={`text-xs px-2.5 py-0.5 rounded-full border transition-all ${
                          field.value === today
                            ? 'bg-primary text-primary-foreground border-primary font-medium'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted border-border'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => form.setValue('date', yesterday, { shouldValidate: true })}
                        className={`text-xs px-2.5 py-0.5 rounded-full border transition-all ${
                          field.value === yesterday
                            ? 'bg-primary text-primary-foreground border-primary font-medium'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted border-border'
                        }`}
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="date"
                        className="pl-9 h-11"
                        {...field}
                        value={field.value ?? today}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes (Optional) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Notes <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g. Acme invoice #102, birthday gift"
                      className="h-11"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all"
            >
              {isPending ? (
                <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
              ) : null}
              Log Income
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
