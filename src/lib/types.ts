// src/lib/types.ts
import { z } from "zod";

export const expenseCategories = [
  "Cooking/Groceries",
  "Eating Out",
  "Transportation",
  "Projects",
  "Utilities",
  "Beauty/Grooming",
  "Clothing",
  "Travel/Adventure",
  "Other",
] as const;

export const expensePurchaseTypes = [
  "Planned",
  "Impulse",
  "Social",
  "Necessary",
  "Treat",
  "Family",
] as const;

export const expenseSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Please enter a valid amount." })
    .positive("Amount must be positive.")
    .min(0.01, "Amount must be at least $0.01"),
  category: z.enum(expenseCategories, {
    required_error: "Please select a category.",
  }),
  purchaseType: z.enum(expensePurchaseTypes, {
    required_error: "Please select the purchase type.",
  }),
});

export type Expense = z.infer<typeof expenseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// Income Types & Schema
// ═══════════════════════════════════════════════════════════════════════════

// Seed fallback only — distinct sources are derived dynamically from the Income tab.
export const seedIncomeSources = [
  "Salary",
  "Gift",
] as const;

export const incomeSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Please enter a valid amount." })
    .positive("Amount must be positive.")
    .min(0.01, "Amount must be at least $0.01"),
  source: z.string({
    required_error: "Please select or enter an income source.",
  }).trim().min(1, "Income source cannot be blank."),
  date: z
    .string({
      required_error: "Please specify the date.",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date (YYYY-MM-DD)."),
  notes: z.string().optional(),
});

export type IncomeFormData = z.infer<typeof incomeSchema>;

export interface IncomeEntry {
  date: string; // YYYY-MM-DD
  source: string;
  amount: number;
  notes?: string;
}

export interface IncomeSourceBreakdown {
  source: string;
  total: number;
  percentage: number;
  count: number;
}

export interface IncomeMonthData {
  month: string; // e.g. "Sep 2026"
  totalIncome: number;
  entriesCount: number;
  breakdown: IncomeSourceBreakdown[];
  entries: IncomeEntry[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Holdings Types & Schema (Phase 2: Money Parked)
// ═══════════════════════════════════════════════════════════════════════════

export const holdingTypes = ["contribution", "withdrawal", "opening"] as const;
export type HoldingType = typeof holdingTypes[number];

export const holdingSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Please enter a valid amount." })
    .positive("Amount must be positive.")
    .min(0.01, "Amount must be at least $0.01"),
  location: z
    .string({
      required_error: "Please select or enter an account location.",
    })
    .trim()
    .min(1, "Account location cannot be blank."),
  type: z.enum(holdingTypes, {
    required_error: "Please select a transaction type.",
  }),
  date: z
    .string({
      required_error: "Please specify the date.",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date (YYYY-MM-DD)."),
  notes: z.string().optional(),
});

export type HoldingFormData = z.infer<typeof holdingSchema>;

export interface HoldingEntry {
  date: string; // YYYY-MM-DD
  location: string;
  amount: number;
  type: HoldingType;
  notes?: string;
}

export interface LocationSummary {
  location: string;
  balance: number;            // opening + contributions - withdrawals
  totalContributed: number;   // sum of contributions
  openingBalance: number;     // opening balance (if any)
  totalWithdrawn: number;     // sum of withdrawals
  startDate: string;          // earliest date among its rows
  entryCount: number;
  lastActivityDate?: string;
}

export interface SkippedHoldingRow {
  rowNumber: number;
  location?: string;
  rawType?: string;
  reason: string;
}

export interface HoldingsSummaryData {
  combinedBalance: number;
  combinedContributed: number; // strictly sum of contributions, excludes opening
  combinedOpening: number;     // strictly sum of opening balances
  combinedWithdrawn: number;
  accountCount: number;
  locations: LocationSummary[];
  recentEntries: HoldingEntry[];
  skippedRowsCount: number;
  skippedRows: SkippedHoldingRow[];
}

// ═══════════════════════════════════════════════════════════════════════════
// V2 Types (2026+ Data with Mood, TimeOfDay, DayOfWeek)
// ═══════════════════════════════════════════════════════════════════════════

export const timeOfDayOptions = ["Morning", "Afternoon", "Evening", "Night"] as const;
export type TimeOfDay = typeof timeOfDayOptions[number];

export const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type DayOfWeek = typeof daysOfWeek[number];

// Mood is same as expensePurchaseTypes but aliased for clarity
export type Mood = typeof expensePurchaseTypes[number];

export interface V2ExpenseEntry {
  month: string;
  date: string;
  amount: number;
  category: string;
  mood: Mood;
  timeOfDay: TimeOfDay;
  dayOfWeek: DayOfWeek;
  weekNumber: number;
}

export interface MoodTotal {
  mood: Mood;
  total: number;
  percentage: number;
}

export interface MoodByMonth {
  month: string;
  [mood: string]: number | string;
}

export interface DayTotal {
  day: DayOfWeek;
  total: number;
}

export interface TimeOfDayTotal {
  timeOfDay: TimeOfDay;
  total: number;
}

export interface DayTimeHeatmapCell {
  day: DayOfWeek;
  timeOfDay: TimeOfDay;
  total: number;
  intensity: number; // 0-1 normalized
}

export interface V2AnalyticsData {
  entries: V2ExpenseEntry[];
  grandTotal: number;
  monthCount: number;

  // Aggregations
  moodTotals: MoodTotal[];
  moodByMonth: MoodByMonth[];
  dayTotals: DayTotal[];
  timeOfDayTotals: TimeOfDayTotal[];
  heatmapData: DayTimeHeatmapCell[];
  categoryTotals: import('@/lib/csv-parser').CategoryTotal[];
  monthlyTotals: import('@/lib/csv-parser').MonthlyTotal[];

  // Hero insights
  topMood: { mood: Mood; percentage: number } | null;
  peakSpendingTime: { day: DayOfWeek; timeOfDay: TimeOfDay; total: number } | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Subscription Types
// ═══════════════════════════════════════════════════════════════════════════

export const subscriptionStatuses = ["Active", "Canceled", "Done"] as const;
export type SubscriptionStatus = typeof subscriptionStatuses[number];

export const subscriptionCycles = ["Monthly-Start", "Monthly-Mid", "Monthly-End", "Yearly"] as const;
export type SubscriptionCycle = typeof subscriptionCycles[number];

export const bankAccounts = ["Navy", "Apple Card", "Santander", "Capital One"] as const;
export type BankAccount = typeof bankAccounts[number];

export interface Subscription {
  name: string;
  status: SubscriptionStatus;
  category: string;
  cost: number;
  cycle: SubscriptionCycle;
  billDate?: number;
  bank?: BankAccount;
  notes?: string;
}

export interface SubscriptionsData {
  subscriptions: Subscription[];
  monthlyTotal: number;      // Sum of Active monthly costs
  yearlyTotal: number;       // (monthlyTotal × 12) + yearly costs
  counts: {
    active: number;
    canceled: number;
    done: number;
  };
}

