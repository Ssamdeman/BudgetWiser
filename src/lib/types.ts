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
  
  // Hero insights
  topMood: { mood: Mood; percentage: number } | null;
  peakSpendingTime: { day: DayOfWeek; timeOfDay: TimeOfDay; total: number } | null;
}
