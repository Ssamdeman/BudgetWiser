// src/components/log-holding-form.tsx
"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { logHoldingAction, fetchHoldingsLocations } from '@/app/actions';
import { holdingSchema, type HoldingFormData, type HoldingType } from '@/lib/types';
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
  Landmark,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Calendar as CalendarIcon,
  PlusCircle,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ADD_NEW_ACCOUNT_VALUE = '__ADD_NEW_ACCOUNT__';

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

export function LogHoldingForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Dynamic accounts derived from sheet
  const [locations, setLocations] = useState<string[]>([]);
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLocationName, setCustomLocationName] = useState('');

  const today = getTodayString();
  const yesterday = getYesterdayString();

  const form = useForm<HoldingFormData>({
    resolver: zodResolver(holdingSchema),
    defaultValues: {
      amount: undefined,
      location: '',
      type: 'contribution',
      date: today,
      notes: '',
    },
  });

  // Fetch derived locations on mount
  useEffect(() => {
    fetchHoldingsLocations()
      .then((derived) => {
        if (derived && derived.length > 0) {
          setLocations(derived);
        }
      })
      .catch((err) => {
        console.error('Failed to load derived holdings locations:', err);
      });
  }, []);

  function handleLocationSelect(val: string) {
    if (val === ADD_NEW_ACCOUNT_VALUE) {
      setIsCustomLocation(true);
      form.setValue('location', customLocationName, { shouldValidate: false });
    } else {
      setIsCustomLocation(false);
      form.setValue('location', val, { shouldValidate: true });
    }
  }

  function handleCustomLocationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setCustomLocationName(val);
    form.setValue('location', val, { shouldValidate: true });
  }

  function handleCancelCustomLocation() {
    setIsCustomLocation(false);
    setCustomLocationName('');
    form.setValue('location', '', { shouldValidate: false });
  }

  function onSubmit(values: HoldingFormData) {
    startTransition(async () => {
      const result = await logHoldingAction(values);

      if (result.success) {
        toast({
          title: 'Movement Logged!',
          description: result.message,
        });

        // Add newly entered location to local list if not already present
        if (values.location && !locations.includes(values.location)) {
          setLocations((prev) => [...prev, values.location].sort());
        }

        form.reset({
          amount: undefined,
          location: values.location, // retain selected location for convenience
          type: 'contribution',
          date: getTodayString(),
          notes: '',
        });
        setIsCustomLocation(false);
        setCustomLocationName('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to log movement',
          description: result.message,
        });
      }
    });
  }

  const selectedType = form.watch('type');

  return (
    <Card className="border-border/60 shadow-lg backdrop-blur-sm bg-card/80">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-3xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <PiggyBank className="w-6 h-6" />
          </div>
          <span>Log Holding</span>
        </CardTitle>
        <p className="text-center text-xs text-muted-foreground mt-1">
          Money parked: savings & investments. Permanent and append-only.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Movement Type - Strict 3-Option Closed Set */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-center block text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    Movement Type
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/70 rounded-xl border border-border/50">
                      {/* Contribution */}
                      <button
                        type="button"
                        onClick={() => form.setValue('type', 'contribution', { shouldValidate: true })}
                        className={cn(
                          "py-2.5 px-2 text-xs font-semibold rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-1",
                          field.value === 'contribution'
                            ? "bg-card text-indigo-500 shadow-sm ring-1 ring-border/60 font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                        )}
                      >
                        <ArrowDownLeft className="w-4 h-4 text-indigo-500" />
                        <span>Contribution</span>
                      </button>

                      {/* Withdrawal */}
                      <button
                        type="button"
                        onClick={() => form.setValue('type', 'withdrawal', { shouldValidate: true })}
                        className={cn(
                          "py-2.5 px-2 text-xs font-semibold rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-1",
                          field.value === 'withdrawal'
                            ? "bg-card text-amber-500 shadow-sm ring-1 ring-border/60 font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                        )}
                      >
                        <ArrowUpRight className="w-4 h-4 text-amber-500" />
                        <span>Withdrawal</span>
                      </button>

                      {/* Opening */}
                      <button
                        type="button"
                        onClick={() => form.setValue('type', 'opening', { shouldValidate: true })}
                        className={cn(
                          "py-2.5 px-2 text-xs font-semibold rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-1",
                          field.value === 'opening'
                            ? "bg-card text-blue-500 shadow-sm ring-1 ring-border/60 font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                        )}
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                        <span>Opening</span>
                      </button>
                    </div>
                  </FormControl>
                  <p className="text-[11px] text-center text-muted-foreground">
                    {selectedType === 'contribution' && 'Money put into this account.'}
                    {selectedType === 'withdrawal' && 'Money pulled out of this account.'}
                    {selectedType === 'opening' && 'Initial balance before tracking began. Once per account.'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Account / Location - Derived Picker with New Account Option */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Account (Location)</FormLabel>
                    {isCustomLocation && (
                      <button
                        type="button"
                        onClick={handleCancelCustomLocation}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Choose existing
                      </button>
                    )}
                  </div>

                  <FormControl>
                    {isCustomLocation || locations.length === 0 ? (
                      <div className="space-y-1.5">
                        <Input
                          autoFocus={isCustomLocation}
                          type="text"
                          placeholder="e.g. Bank X Savings, Brokerage, Pension..."
                          className="h-12"
                          value={isCustomLocation ? customLocationName : (field.value || '')}
                          onChange={(e) => {
                            if (isCustomLocation) {
                              handleCustomLocationChange(e);
                            } else {
                              form.setValue('location', e.target.value, { shouldValidate: true });
                            }
                          }}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          This account name will be saved to your sheet and appear in the picker.
                        </p>
                      </div>
                    ) : (
                      <Select
                        onValueChange={handleLocationSelect}
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
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom">
                          {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              <div className="flex items-center gap-2.5 py-1">
                                <Landmark className="h-4 w-4 text-indigo-500" />
                                <span className="font-medium">{loc}</span>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectSeparator />
                          <SelectItem
                            value={ADD_NEW_ACCOUNT_VALUE}
                            className="text-indigo-500 font-medium focus:text-indigo-500 focus:bg-indigo-500/10"
                          >
                            <div className="flex items-center gap-2 py-1">
                              <PlusCircle className="h-4 w-4" />
                              <span>+ Add new account...</span>
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
                      placeholder="e.g. Monthly auto-transfer, bonus allocation"
                      className="h-11"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-[0.99] transition-all"
            >
              {isPending ? (
                <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
              ) : null}
              Log Movement
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
