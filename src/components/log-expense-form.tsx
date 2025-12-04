//src/components/log-expenses-form.tsx 
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { logExpenseAction } from '@/app/actions';
import { expenseCategories, expensePurchaseTypes, expenseSchema } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  Car,
  Lightbulb,
  MoreHorizontal,
  ShoppingBag,
  UtensilsCrossed,
  Hammer,
  Scissors,
  Shirt,
  Plane,
  CalendarCheck,
  Zap,
  Users,
  ClipboardCheck,
  Gift,
  Home
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';

const categoryIcons: Record<(typeof expenseCategories)[number], React.ElementType> = {
  "Cooking/Groceries": UtensilsCrossed,
  "Eating Out": ShoppingBag,
  "Transportation": Car,
  "Projects": Hammer,
  "Utilities": Lightbulb,
  "Beauty/Grooming": Scissors,
  "Clothing": Shirt,
  "Travel/Adventure": Plane,
  "Other": MoreHorizontal,
};

const purchaseTypeIcons: Record<(typeof expensePurchaseTypes)[number], React.ElementType> = {
  Planned: CalendarCheck,
  Impulse: Zap,
  Social: Users,
  Necessary: ClipboardCheck,
  Treat: Gift,
  Family: Home,
};

export function LogExpenseForm() {
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      category: undefined,
      purchaseType: undefined,  
    },
  });

  function onSubmit(values: z.infer<typeof expenseSchema>) {
    // 🔍 ADD THIS BEFORE startTransition
    console.log('=== FORM SUBMIT DEBUG ===');
    console.log('Form values:', values);
    console.log('Amount:', values.amount, 'Type:', typeof values.amount);
    console.log('Category:', values.category);
    console.log('Purchase Type:', values.purchaseType);
    console.log('========================');
  
    startTransition(async () => {
      const result = await logExpenseAction(values);
      
      /// 🔍 ADD THIS LINE:
      console.log('--- DEBUG DATA FROM SERVER ---', result.debugData);
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: result.message,
        });
      }
    });
  }

  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-3xl font-bold tracking-tight">Log New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                  <FormItem>
                  <FormLabel className="text-center block">Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-center block">Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger 
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => {
                          // Blur active element to close keyboard on mobile
                          if (document.activeElement instanceof HTMLElement) {
                            document.activeElement.blur();
                          }
                        }}
                      >
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" side="bottom">
                      {expenseCategories.map((category) => {
                        const Icon = categoryIcons[category];
                        return (
                          <SelectItem key={category} value={category}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {category}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchaseType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>What type of purchase was this?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      // FIX: Use `value || ''` to correctly reset the selection
                      value={field.value || ''}
                      className="grid grid-cols-3 gap-4 pt-2"
                    >
                      {expensePurchaseTypes.map((purchaseType) => {
                        const Icon = purchaseTypeIcons[purchaseType];
                        return (
                          <FormItem key={purchaseType} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={purchaseType} className="sr-only" />
                            </FormControl>
                            <FormLabel
                              className={cn(
                                'flex flex-col items-center justify-center rounded-xl border border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200 w-full active:scale-95 shadow-sm',
                                field.value === purchaseType ? 'border-primary ring-1 ring-primary bg-accent/50 text-accent-foreground' : ''
                              )}
                            >
                              <Icon className="h-8 w-8 mb-2" />
                              {purchaseType}
                            </FormLabel>
                          </FormItem>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <div className="mr-2 h-4 w-4 animate-spin border-2 border-background border-t-transparent rounded-full" /> : null}
              Log Expense
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
