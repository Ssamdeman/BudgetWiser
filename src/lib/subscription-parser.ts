// src/lib/subscription-parser.ts
// Parses subscriptions CSV and calculates totals

import type { 
  Subscription, 
  SubscriptionsData, 
  SubscriptionStatus, 
  SubscriptionCycle, 
  BankAccount 
} from './types';
import { subscriptionStatuses, subscriptionCycles, bankAccounts } from './types';

/**
 * Parses subscription CSV string
 */
function parseSubscriptionsCSV(csvText: string): Subscription[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const subscriptions: Subscription[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace('\r', '');
    const parts = line.split(',');
    
    if (parts.length < 5) continue;
    
    const [name, status, category, cost, cycle, billDate, bank, ...notesParts] = parts;
    const notes = notesParts.join(',').trim(); // Notes may contain commas
    
    // Validate status
    const validStatus = subscriptionStatuses.includes(status?.trim() as SubscriptionStatus)
      ? (status.trim() as SubscriptionStatus)
      : 'Active';
    
    // Validate cycle
    const validCycle = subscriptionCycles.includes(cycle?.trim() as SubscriptionCycle)
      ? (cycle.trim() as SubscriptionCycle)
      : 'Monthly-Start';
    
    // Validate bank (optional)
    const validBank = bankAccounts.includes(bank?.trim() as BankAccount)
      ? (bank.trim() as BankAccount)
      : undefined;
    
    subscriptions.push({
      name: name.trim(),
      status: validStatus,
      category: category?.trim() || 'Other',
      cost: parseFloat(cost) || 0,
      cycle: validCycle,
      billDate: billDate?.trim() ? parseInt(billDate.trim(), 10) : undefined,
      bank: validBank,
      notes: notes || undefined,
    });
  }
  
  return subscriptions;
}

/**
 * Calculates totals from subscriptions
 * Excludes items with "not used for calculation" in notes
 */
function calculateTotals(subscriptions: Subscription[]): {
  monthlyTotal: number;
  yearlyTotal: number;
  counts: { active: number; canceled: number; done: number };
} {
  let monthlyTotal = 0;
  let yearlyOnlyTotal = 0;
  const counts = { active: 0, canceled: 0, done: 0 };
  
  subscriptions.forEach(sub => {
    // Count by status
    if (sub.status === 'Active') counts.active++;
    else if (sub.status === 'Canceled') counts.canceled++;
    else if (sub.status === 'Done') counts.done++;
    
    // Check if excluded from calculation
    const excludeFromCalc = sub.notes?.toLowerCase().includes('not used for calculation');
    
    // Only count Active subscriptions for totals, and not excluded
    if (sub.status === 'Active' && !excludeFromCalc) {
      if (sub.cycle === 'Yearly') {
        yearlyOnlyTotal += sub.cost;
      } else {
        // Monthly (any variant)
        monthlyTotal += sub.cost;
      }
    }
  });
  
  // Yearly total = (monthly × 12) + yearly-only costs
  const yearlyTotal = (monthlyTotal * 12) + yearlyOnlyTotal;
  
  return {
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    yearlyTotal: Math.round(yearlyTotal * 100) / 100,
    counts,
  };
}

/**
 * Fetches and parses subscriptions CSV (no-cache)
 */
export async function fetchSubscriptions(): Promise<SubscriptionsData> {
  const response = await fetch('/subscriptions/subscriptions_master.csv', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  });
  
  const csvText = await response.text();
  const subscriptions = parseSubscriptionsCSV(csvText);
  const { monthlyTotal, yearlyTotal, counts } = calculateTotals(subscriptions);
  
  return {
    subscriptions,
    monthlyTotal,
    yearlyTotal,
    counts,
  };
}
