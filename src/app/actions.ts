//src/app/actions.ts
"use server";

// Forcing a new server build v1.1

import { z } from "zod";
import {
  expenseSchema,
  incomeSchema,
  seedIncomeSources,
  holdingSchema,
  type IncomeMonthData,
  type IncomeEntry,
  type IncomeSourceBreakdown,
  type HoldingsSummaryData,
  type HoldingEntry,
  type LocationSummary,
  type HoldingType,
  type SkippedHoldingRow,
  type SubscriptionsData,
  type Subscription,
  type SubscriptionStatus,
  type SkippedSubscriptionRow,
  type FlaggedSubscriptionField,
  type EndingSoonItem,
} from "@/lib/types";
import { revalidatePath } from "next/cache";
import {
  appendExpenseToSheet,
  appendIncomeToSheet,
  appendHoldingToSheet,
  fetchLiveIncomeSheetData,
  fetchLiveHoldingsSheetData,
  fetchLiveSubscriptionsSheetData,
} from "@/lib/google-sheets";


export async function logExpenseAction(data: z.infer<typeof expenseSchema>) {
  let validatedData;
  try {
    validatedData = expenseSchema.parse(data);

    const { amount, category, purchaseType } = validatedData;
    await appendExpenseToSheet(amount, category, purchaseType);

    revalidatePath("/");

    return {
      success: true,
      message: "Expense logged successfully!",
      debugData: validatedData
    };
  } catch (error) {
    console.error("Error logging expense:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation failed.",
        errors: error.flatten().fieldErrors,
        debugData: data
      };
    }
    return {
      success: false,
      message: "Failed to log expense. Please try again.",
      debugData: validatedData || data
    };
  }
}

export async function logIncomeAction(data: z.infer<typeof incomeSchema>) {
  let validatedData;
  try {
    validatedData = incomeSchema.parse(data);

    const { amount, source, date, notes } = validatedData;
    await appendIncomeToSheet(date, source, amount, notes);

    revalidatePath("/");

    return {
      success: true,
      message: "Income logged successfully!",
      debugData: validatedData,
    };
  } catch (error) {
    console.error("Error logging income:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation failed.",
        errors: error.flatten().fieldErrors,
        debugData: data,
      };
    }
    return {
      success: false,
      message: "Failed to log income. Please try again.",
      debugData: validatedData || data,
    };
  }
}

/**
 * Derives the list of distinct income sources directly from the live 'Income' tab,
 * unioned with the minimal seed fallback ('Salary', 'Gift').
 * This ensures new client/gig names appear in the picker without any code edits or redeployments.
 */
export async function fetchIncomeSources(): Promise<string[]> {
  try {
    const rows = await fetchLiveIncomeSheetData();
    const sourceSet = new Set<string>(seedIncomeSources);

    if (rows && rows.length > 0) {
      for (const row of rows) {
        if (!row || !row[1]) continue;
        const source = String(row[1]).trim();
        if (source) {
          sourceSet.add(source);
        }
      }
    }

    return Array.from(sourceSet).sort((a, b) => {
      if (a === 'Salary') return -1;
      if (b === 'Salary') return 1;
      if (a === 'Gift') return -1;
      if (b === 'Gift') return 1;
      return a.localeCompare(b);
    });
  } catch (error) {
    console.error('Error deriving income sources from sheet:', error);
    return [...seedIncomeSources];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Holdings Server Actions (Phase 2: Money Parked)
// ═══════════════════════════════════════════════════════════════════════════

export async function logHoldingAction(data: z.infer<typeof holdingSchema>) {
  let validatedData;
  try {
    validatedData = holdingSchema.parse(data);

    const { amount, location, type, date, notes } = validatedData;
    await appendHoldingToSheet(date, location, amount, type, notes);

    revalidatePath("/");

    return {
      success: true,
      message: "Movement logged successfully!",
      debugData: validatedData,
    };
  } catch (error) {
    console.error("Error logging holding movement:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation failed.",
        errors: error.flatten().fieldErrors,
        debugData: data,
      };
    }
    return {
      success: false,
      message: "Failed to log movement. Please try again.",
      debugData: validatedData || data,
    };
  }
}

/**
 * Derives distinct account locations directly from the live 'Holdings' tab.
 * Allows new accounts to be added on the fly without any code changes.
 */
export async function fetchHoldingsLocations(): Promise<string[]> {
  try {
    const rows = await fetchLiveHoldingsSheetData();
    const locationSet = new Set<string>();

    if (rows && rows.length > 0) {
      for (const row of rows) {
        if (!row || !row[1]) continue;
        const loc = String(row[1]).trim();
        if (loc) {
          locationSet.add(loc);
        }
      }
    }

    return Array.from(locationSet).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Error deriving holdings locations from sheet:', error);
    return [];
  }
}

/**
 * Parses numeric amounts from sheets safely, stripping currency symbols/commas.
 */
function parseHoldingAmount(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Fetches all holdings movements from the live sheet and computes balances dynamically.
 * Architectural rule: Balances are derived, never stored or cached.
 * Balance = opening + sum(contributions) - sum(withdrawals)
 * All-time, cumulative, never monthly.
 */
export async function fetchHoldingsSummary(): Promise<HoldingsSummaryData> {
  const defaultSummary: HoldingsSummaryData = {
    combinedBalance: 0,
    combinedContributed: 0,
    combinedOpening: 0,
    combinedWithdrawn: 0,
    accountCount: 0,
    locations: [],
    recentEntries: [],
    skippedRowsCount: 0,
    skippedRows: [],
  };

  try {
    const rows = await fetchLiveHoldingsSheetData();
    if (!rows || rows.length === 0) {
      return defaultSummary;
    }

    interface TempLocationAgg {
      location: string;
      openingBalance: number;
      contributions: number;
      withdrawals: number;
      earliestDate: string;
      latestDate: string;
      count: number;
    }

    const locationMap = new Map<string, TempLocationAgg>();
    const allEntries: HoldingEntry[] = [];
    const skippedRows: SkippedHoldingRow[] = [];

    rows.forEach((row, index) => {
      const sheetRowNumber = index + 2; // Row 1 is header

      // Ignore purely empty rows in the sheet
      const hasAnyContent = row && row.some(cell => cell !== undefined && String(cell).trim() !== '');
      if (!hasAnyContent) {
        return;
      }

      const dateStr = row[0] ? String(row[0]).trim() : '';
      const rawLocation = row[1] ? String(row[1]).trim() : '';
      const rawAmountStr = row[2] !== undefined ? String(row[2]).trim() : '';
      const amount = parseHoldingAmount(row[2]);
      const rawType = row[3] ? String(row[3]).trim().toLowerCase() : '';
      const notes = row[4] ? String(row[4]).trim() : undefined;

      // Validate Date
      if (!dateStr) {
        skippedRows.push({
          rowNumber: sheetRowNumber,
          location: rawLocation || 'Unknown',
          rawType: row[3] ? String(row[3]) : undefined,
          reason: 'Missing date',
        });
        return;
      }

      // Validate Location
      if (!rawLocation) {
        skippedRows.push({
          rowNumber: sheetRowNumber,
          location: 'Unknown',
          rawType: row[3] ? String(row[3]) : undefined,
          reason: 'Missing account/location',
        });
        return;
      }

      // Validate Amount
      if (isNaN(amount) || amount <= 0) {
        skippedRows.push({
          rowNumber: sheetRowNumber,
          location: rawLocation,
          rawType: row[3] ? String(row[3]) : undefined,
          reason: `Invalid or non-positive amount "${rawAmountStr}"`,
        });
        return;
      }

      // Validate Type — strict 3-option closed set (contribution, withdrawal, opening)
      let validHoldingType: HoldingType;
      if (rawType === 'opening') {
        validHoldingType = 'opening';
      } else if (rawType === 'withdrawal') {
        validHoldingType = 'withdrawal';
      } else if (rawType === 'contribution') {
        validHoldingType = 'contribution';
      } else {
        // Genuine typo or unrecognized value — surface to user!
        skippedRows.push({
          rowNumber: sheetRowNumber,
          location: rawLocation,
          rawType: row[3] ? String(row[3]) : 'empty',
          reason: `Unrecognized type "${row[3] || ''}" (expected contribution, withdrawal, or opening)`,
        });
        return;
      }

      allEntries.push({
        date: dateStr,
        location: rawLocation,
        amount,
        type: validHoldingType,
        notes,
      });

      // Aggregate by location
      let agg = locationMap.get(rawLocation);
      if (!agg) {
        agg = {
          location: rawLocation,
          openingBalance: 0,
          contributions: 0,
          withdrawals: 0,
          earliestDate: dateStr,
          latestDate: dateStr,
          count: 0,
        };
        locationMap.set(rawLocation, agg);
      }

      agg.count += 1;

      if (validHoldingType === 'opening') {
        agg.openingBalance += amount;
      } else if (validHoldingType === 'contribution') {
        agg.contributions += amount;
      } else if (validHoldingType === 'withdrawal') {
        agg.withdrawals += amount;
      }

      if (dateStr < agg.earliestDate) {
        agg.earliestDate = dateStr;
      }
      if (dateStr > agg.latestDate) {
        agg.latestDate = dateStr;
      }
    });

    let combinedBalance = 0;
    let combinedContributed = 0; // strictly sum of contributions, excludes opening
    let combinedOpening = 0;     // strictly sum of opening balances
    let combinedWithdrawn = 0;

    const locations: LocationSummary[] = [];

    for (const agg of locationMap.values()) {
      const balance = agg.openingBalance + agg.contributions - agg.withdrawals;
      combinedBalance += balance;
      combinedContributed += agg.contributions;
      combinedOpening += agg.openingBalance;
      combinedWithdrawn += agg.withdrawals;

      locations.push({
        location: agg.location,
        balance: Math.round(balance * 100) / 100,
        totalContributed: Math.round(agg.contributions * 100) / 100, // excludes opening
        openingBalance: Math.round(agg.openingBalance * 100) / 100,
        totalWithdrawn: Math.round(agg.withdrawals * 100) / 100,
        startDate: agg.earliestDate,
        entryCount: agg.count,
        lastActivityDate: agg.latestDate,
      });
    }

    // Sort locations by balance descending
    locations.sort((a, b) => b.balance - a.balance);

    // Sort entries newest first
    allEntries.sort((a, b) => b.date.localeCompare(a.date));

    return {
      combinedBalance: Math.round(combinedBalance * 100) / 100,
      combinedContributed: Math.round(combinedContributed * 100) / 100,
      combinedOpening: Math.round(combinedOpening * 100) / 100,
      combinedWithdrawn: Math.round(combinedWithdrawn * 100) / 100,
      accountCount: locations.length,
      locations,
      recentEntries: allEntries,
      skippedRowsCount: skippedRows.length,
      skippedRows,
    };
  } catch (error) {
    console.error('Error computing live holdings summary:', error);
    return defaultSummary;
  }
}



// ═══════════════════════════════════════════════════════════════════════════
// LIVE SHEET DATA SERVER ACTIONS (Current Month Feature)
// ═══════════════════════════════════════════════════════════════════════════

import { fetchLiveSheetData } from "@/lib/google-sheets";
import { parseSheetToV2Entries } from "@/lib/csv-parser";
import type { V2ExpenseEntry } from "@/lib/types";

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Fetches expenses for the current month only from the live Google Sheet
 */
export async function fetchCurrentMonthExpenses(): Promise<V2ExpenseEntry[]> {
  try {
    const rows = await fetchLiveSheetData();
    const entries = parseSheetToV2Entries(rows);

    // Get current month prefix (e.g., "Jan 2026")
    const now = new Date();
    const currentMonthPrefix = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

    // Filter to current month only
    const filtered = entries.filter(e => e.month === currentMonthPrefix);

    return filtered;
  } catch (error) {
    console.error('Error fetching current month expenses:', error);
    return [];
  }
}

/**
 * Helper to parse various sheet date formats into "Mon YYYY" (e.g. "Sep 2026")
 */
function parseDateToMonth(dateStr: string): string {
  if (!dateStr) return '';
  const dateOnly = dateStr.trim().split(' ')[0];
  if (dateOnly.includes('-')) {
    const parts = dateOnly.split('-');
    if (parts.length >= 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${MONTH_NAMES[monthIndex]} ${year}`;
      }
    }
  }
  if (dateOnly.includes('/')) {
    const parts = dateOnly.split('/');
    if (parts.length >= 3) {
      const monthIndex = parseInt(parts[0], 10) - 1;
      const year = parts[2];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${MONTH_NAMES[monthIndex]} ${year}`;
      }
    }
  }
  return '';
}

/**
 * Fetches all income entries for the current month from the live Google Sheet.
 * Computes total and breakdown on the fly.
 * Permanent append-only, gross and never net.
 * A month with no income returns total 0, never an error.
 */
export async function fetchCurrentMonthIncome(): Promise<IncomeMonthData> {
  const now = new Date();
  const currentMonthPrefix = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const defaultResult: IncomeMonthData = {
    month: currentMonthPrefix,
    totalIncome: 0,
    entriesCount: 0,
    breakdown: [],
    entries: [],
  };

  try {
    const rows = await fetchLiveIncomeSheetData();
    if (!rows || rows.length === 0) {
      return defaultResult;
    }

    const currentEntries: IncomeEntry[] = [];
    let totalIncome = 0;
    const sourceMap: Record<string, { total: number; count: number }> = {};

    for (const row of rows) {
      if (!row || !row[0] || !row[1] || row[2] === undefined) continue;

      const dateStr = String(row[0]).trim();
      const monthPrefix = parseDateToMonth(dateStr);

      if (monthPrefix !== currentMonthPrefix) {
        continue;
      }

      const source = String(row[1]).trim() || 'Other';
      const rawAmount = typeof row[2] === 'number' ? row[2] : parseFloat(String(row[2]).replace(/[^0-9.-]+/g, ''));
      const amount = isNaN(rawAmount) ? 0 : rawAmount;
      if (amount <= 0) continue;

      const notes = row[3] ? String(row[3]).trim() : undefined;

      currentEntries.push({
        date: dateStr,
        source,
        amount,
        notes,
      });

      totalIncome += amount;

      if (!sourceMap[source]) {
        sourceMap[source] = { total: 0, count: 0 };
      }
      sourceMap[source].total += amount;
      sourceMap[source].count += 1;
    }

    const breakdown: IncomeSourceBreakdown[] = Object.entries(sourceMap)
      .map(([src, info]) => ({
        source: src,
        total: Math.round(info.total * 100) / 100,
        percentage: totalIncome > 0 ? Math.round((info.total / totalIncome) * 1000) / 10 : 0,
        count: info.count,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      month: currentMonthPrefix,
      totalIncome: Math.round(totalIncome * 100) / 100,
      entriesCount: currentEntries.length,
      breakdown,
      entries: currentEntries,
    };
  } catch (error) {
    console.error('Error fetching current month income:', error);
    return defaultResult;
  }
}

/**
 * Fetches expenses for the PREVIOUS month dynamically from the V2 CSV file.
 * e.g., if now is Feb 2026, searches "Jan 2026".
 * Wraps properly (Jan 2026 -> Dec 2025).
 */
export async function fetchPreviousMonthExpenses(): Promise<V2ExpenseEntry[]> {
  try {
    const v2Data = await fetchV2CSVData();
    if (!v2Data || !v2Data.entries) return [];

    // Determine the previous month prefix (e.g., "Jan 2026")
    const now = new Date();
    let prevMonthIndex = now.getMonth() - 1;
    let prevMonthYear = now.getFullYear();

    // Wrap around for January -> December of previous year
    if (prevMonthIndex < 0) {
      prevMonthIndex = 11; // December is explicitly index 11
      prevMonthYear -= 1;
    }

    const previousMonthPrefix = `${MONTH_NAMES[prevMonthIndex]} ${prevMonthYear}`;

    // Filter the CSV explicitly to only entries matching the determined previous month
    return v2Data.entries.filter(e => e.month === previousMonthPrefix);
  } catch (error) {
    console.error('Error fetching previous month expenses:', error);
    return [];
  }
}

/**
 * Interface mapping to predictie stats from Python
 */
export interface ForecastMetrics {
  success: boolean;
  historical_monthly_average: number;
  current_spend: number;
  expected_spend_by_now: number;
  pace_difference: number;
  is_overspending: boolean;
  end_of_month_estimate: number;
  category_forecasts: { category: string; average: number }[];
  top_mood: { mood: string; percentage: number };
}

import fs from 'fs/promises';
import path from 'path';
import { parseV2CSV, processV2Entries } from "@/lib/csv-parser";
import type { V2AnalyticsData } from "@/lib/types";

import {
  computeHistoricalAverageBaseline,
  computePaceCheck,
  computeEndOfMonthEstimate,
  computeTopCategoryBaselines,
  computeTopMood
} from '@/lib/forecast';

/**
 * Native TypeScript forecasting module
 */
export async function fetchForecastMetrics(): Promise<ForecastMetrics | null> {
  try {
    const [csvText, currEntries] = await Promise.all([
      fs.readFile(path.join(process.cwd(), 'public', 'V2_master_finances-2026.csv'), 'utf-8').catch(() => ''),
      fetchCurrentMonthExpenses()
    ]);

    const allPastEntries = csvText.trim() ? parseV2CSV(csvText) : [];
    const pastEntries = allPastEntries.filter(e => e.month.endsWith(' 2026'));

    const currentSpend = currEntries.reduce((sum, e) => sum + e.amount, 0);
    const today = new Date();

    const { averageMonthlyBaseline, completedMonthsCount } = computeHistoricalAverageBaseline(pastEntries);
    const paceCheck = computePaceCheck(currentSpend, averageMonthlyBaseline, today);
    const endOfMonthEstimate = computeEndOfMonthEstimate(currentSpend, today);
    const topBaselines = computeTopCategoryBaselines(pastEntries, completedMonthsCount, 3);
    const topMood = computeTopMood(pastEntries);

    return {
      success: true,
      historical_monthly_average: Math.round(averageMonthlyBaseline * 100) / 100,
      current_spend: Math.round(currentSpend * 100) / 100,
      expected_spend_by_now: Math.round(paceCheck.expectedByNow * 100) / 100,
      pace_difference: Math.round(paceCheck.paceDifference * 100) / 100,
      is_overspending: paceCheck.paceDifference > 0,
      end_of_month_estimate: Math.round(endOfMonthEstimate * 100) / 100,
      category_forecasts: topBaselines.map(c => ({ category: c.category, average: Math.round(c.average * 100) / 100 })),
      top_mood: topMood,
    };
  } catch (error) {
    console.error('Error in fetchForecastMetrics:', error);
    return null;
  }
}

/**
 * Fetches ALL expenses from the live Google Sheet (for merging with CSV)
 */
export async function fetchAllLiveExpenses(): Promise<V2ExpenseEntry[]> {
  try {
    const rows = await fetchLiveSheetData();
    return parseSheetToV2Entries(rows);
  } catch (error) {
    console.error('Error fetching all live expenses:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// V2 CSV DATA SERVER ACTIONS
// ═══════════════════════════════════════════════════════════════════════════


/**
 * Fetches and parses the V2 CSV directly from the filesystem (server-side)
 * Bypasses Next.js fetch caching issues by using raw fs.
 */
export async function fetchV2CSVData(): Promise<V2AnalyticsData | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'V2_master_finances-2026.csv');
    const csvText = await fs.readFile(filePath, 'utf-8');

    if (!csvText.trim() || csvText.trim().split('\n').length < 2) {
      return null;
    }

    const entries = parseV2CSV(csvText);
    return processV2Entries(entries);
  } catch (error) {
    console.error('Error reading V2 CSV exactly from filesystem:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Subscriptions Server Actions (Phase 4: Money Committed — Revised)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parses date string in various sheet formats (MM/DD/YYYY, YYYY-MM-DD, M/D/YY).
 * Returns validity, Date object, and formatted string.
 * Blank, 'none', '-', and empty strings are valid empty dates.
 */
function parseSubscriptionDate(dateStr: string): { valid: boolean; date?: Date; formatted?: string } {
  if (!dateStr) return { valid: true };
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed.toLowerCase() === 'none' || trimmed === '-' || trimmed.toLowerCase() === 'n/a') {
    return { valid: true };
  }

  // Handle MM/DD/YYYY or M/D/YYYY
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      if (!isNaN(m) && !isNaN(d) && !isNaN(y) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const parsedDate = new Date(y, m - 1, d);
        const formatted = `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
        return { valid: true, date: parsedDate, formatted };
      }
    }
  }

  // Handle YYYY-MM-DD
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(m) && !isNaN(d) && !isNaN(y) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const parsedDate = new Date(y, m - 1, d);
        const formatted = `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
        return { valid: true, date: parsedDate, formatted };
      }
    }
  }

  // Fallback timestamp
  const timestamp = Date.parse(trimmed);
  if (!isNaN(timestamp)) {
    const dObj = new Date(timestamp);
    const m = dObj.getMonth() + 1;
    const d = dObj.getDate();
    const y = dObj.getFullYear();
    return { valid: true, date: dObj, formatted: `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}` };
  }

  return { valid: false };
}

/**
 * Normalizes status case- and whitespace-insensitively.
 * Valid: Active, Canceled, Done.
 */
function normalizeSubscriptionStatus(val: string): SubscriptionStatus | null {
  const s = val.trim().toLowerCase();
  if (s === 'active') return 'Active';
  if (s === 'canceled' || s === 'cancelled' || s === 'cancel') return 'Canceled';
  if (s === 'done' || s === 'completed' || s === 'paid') return 'Done';
  return null;
}

/**
 * Normalizes cycle case- and whitespace-insensitively.
 * Valid: Monthly, Yearly.
 */
function normalizeSubscriptionCycle(val: string): 'Monthly' | 'Yearly' | null {
  const c = val.trim().toLowerCase();
  if (c.startsWith('month')) return 'Monthly';
  if (c.startsWith('year') || c.startsWith('annual')) return 'Yearly';
  return null;
}

/**
 * Fetches all subscriptions from the live 'Subscriptions' sheet tab (range A2:J).
 * - Normalizes Status, Cycle, Category case- and whitespace-insensitively.
 * - Surfaces any unrecognized or unparseable row as a visible warning in skippedRows.
 * - Computes:
 *   1. Committed this month (Active monthly commitments where Ends is blank or in the future)
 *   2. Yearly items (listed individually with cost and due date)
 *   3. Ending soon (commitments with Ends or Trial Ends within next 60 days)
 */
export async function fetchSubscriptions(): Promise<SubscriptionsData> {
  const defaultData: SubscriptionsData = {
    subscriptions: [],
    committedThisMonth: 0,
    yearlyItems: [],
    endingSoon: [],
    counts: { active: 0, canceled: 0, done: 0 },
    skippedRowsCount: 0,
    skippedRows: [],
    flaggedFieldsCount: 0,
    flaggedFields: [],
  };

  try {
    const rows = await fetchLiveSubscriptionsSheetData();
    if (!rows || rows.length === 0) {
      return defaultData;
    }

    const subscriptions: Subscription[] = [];
    const skippedRows: SkippedSubscriptionRow[] = [];
    const flaggedFields: FlaggedSubscriptionField[] = [];
    const endingSoon: EndingSoonItem[] = [];
    const yearlyItems: Subscription[] = [];
    let committedThisMonth = 0;
    const counts = { active: 0, canceled: 0, done: 0 };

    const now = new Date();
    // Start of current month to determine if commitment was still active during this month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    rows.forEach((row, index) => {
      const sheetRowNumber = index + 2; // Row 1 is header

      const hasAnyContent = row && row.some(cell => cell !== undefined && String(cell).trim() !== '');
      if (!hasAnyContent) {
        return;
      }

      // Column A: Name (Required - Tier 1)
      const rawName = row[0] !== undefined ? String(row[0]).replace(/[\r\n]+/g, '').trim() : '';
      if (!rawName) {
        skippedRows.push({
          rowNumber: sheetRowNumber,
          name: 'Unknown',
          field: 'Name',
          reason: 'Missing subscription name',
        });
        return;
      }

      // Column B: Status (Active, Canceled, Done - Tier 1)
      const rawStatus = row[1] !== undefined ? String(row[1]).replace(/[\r\n]+/g, '').trim() : '';
      const status = normalizeSubscriptionStatus(rawStatus);
      if (!status) {
        skippedRows.push({
          rowNumber: sheetRowNumber,
          name: rawName,
          field: 'Status',
          offendingValue: rawStatus || '(empty)',
          reason: `Unrecognized status "${rawStatus}" (expected Active, Canceled, or Done)`,
        });
        return;
      }

      // Column C: Category
      const rawCategory = row[2] !== undefined ? String(row[2]).replace(/[\r\n]+/g, '').trim() : '';
      const category = rawCategory || 'Other';

      // Column D: Cost (Must be valid number >= 0. $0 is explicitly valid - Tier 1)
      const rawCostStr = row[3] !== undefined ? String(row[3]).replace(/[\r\n]+/g, '').trim() : '';
      const cost = parseHoldingAmount(rawCostStr);
      if (rawCostStr === '' || isNaN(cost) || cost < 0) {
        skippedRows.push({
          rowNumber: sheetRowNumber,
          name: rawName,
          field: 'Cost',
          offendingValue: rawCostStr || '(empty)',
          reason: `Invalid cost "${rawCostStr}" (must be a number >= 0)`,
        });
        return;
      }

      // Column E: Cycle (Monthly, Yearly - Tier 1)
      const rawCycle = row[4] !== undefined ? String(row[4]).replace(/[\r\n]+/g, '').trim() : '';
      const cycle = normalizeSubscriptionCycle(rawCycle);
      if (!cycle) {
        skippedRows.push({
          rowNumber: sheetRowNumber,
          name: rawName,
          field: 'Cycle',
          offendingValue: rawCycle || '(empty)',
          reason: `Unrecognized cycle "${rawCycle}" (expected Monthly or Yearly)`,
        });
        return;
      }

      // Column F: Bill Day (Blank is valid. Tier 2: count row, flag bad field)
      const rawBillDay = row[5] !== undefined ? String(row[5]).replace(/[\r\n]+/g, '').trim() : '';
      let billDate: number | undefined = undefined;
      if (rawBillDay) {
        const match = rawBillDay.match(/\d+/);
        if (match) {
          const parsedDay = parseInt(match[0], 10);
          if (parsedDay >= 1 && parsedDay <= 31) {
            billDate = parsedDay;
          } else {
            flaggedFields.push({
              rowNumber: sheetRowNumber,
              name: rawName,
              field: 'Bill Day',
              offendingValue: rawBillDay,
              reason: `Bill day ${parsedDay} is out of range 1-31. Field ignored; commitment counted.`,
            });
          }
        } else {
          flaggedFields.push({
            rowNumber: sheetRowNumber,
            name: rawName,
            field: 'Bill Day',
            offendingValue: rawBillDay,
            reason: `Unparseable bill day "${rawBillDay}". Field ignored; commitment counted.`,
          });
        }
      }

      // Column G: Bank (Blank is valid)
      const rawBank = row[6] !== undefined ? String(row[6]).replace(/[\r\n]+/g, '').trim() : '';
      let bank: string | undefined = undefined;
      if (rawBank && rawBank.toLowerCase() !== 'none') {
        bank = rawBank.replace(/_/g, ' ');
      }

      // Column H: Trial Ends (Blank is valid. Tier 2: count row, flag bad field)
      const rawTrialEnds = row[7] !== undefined ? String(row[7]).replace(/[\r\n]+/g, '').trim() : '';
      let trialEnds: string | undefined = undefined;
      let trialEndsDate: Date | undefined = undefined;
      if (rawTrialEnds) {
        const parsed = parseSubscriptionDate(rawTrialEnds);
        if (!parsed.valid) {
          flaggedFields.push({
            rowNumber: sheetRowNumber,
            name: rawName,
            field: 'Trial Ends',
            offendingValue: rawTrialEnds,
            reason: `Unparseable trial end date "${rawTrialEnds}". Field ignored; commitment counted.`,
          });
        } else {
          trialEnds = parsed.formatted;
          trialEndsDate = parsed.date;
        }
      }

      // Column I: Notes (Blank is valid)
      const rawNotes = row[8] !== undefined ? String(row[8]).replace(/[\r\n]+/g, '').trim() : '';
      let notes: string | undefined = undefined;
      if (rawNotes && rawNotes.toLowerCase() !== 'none') {
        notes = rawNotes;
      }

      // Column J: Ends (Blank is valid. Tier 2: treat unparseable as ongoing, count row, flag bad field)
      const rawEnds = row[9] !== undefined ? String(row[9]).replace(/[\r\n]+/g, '').trim() : '';
      let ends: string | undefined = undefined;
      let endsDate: Date | undefined = undefined;
      if (rawEnds) {
        const parsed = parseSubscriptionDate(rawEnds);
        if (!parsed.valid) {
          flaggedFields.push({
            rowNumber: sheetRowNumber,
            name: rawName,
            field: 'Ends',
            offendingValue: rawEnds,
            reason: `Unparseable commitment end date "${rawEnds}". Treated as ongoing and counted.`,
          });
          // Unparseable ends is treated as ongoing (endsDate remains undefined)
        } else {
          ends = parsed.formatted;
          endsDate = parsed.date;
        }
      }

      const subscription: Subscription = {
        name: rawName,
        status,
        category,
        cost,
        cycle,
        billDate,
        bank,
        trialEnds,
        notes,
        ends,
      };

      subscriptions.push(subscription);

      // Status counts
      if (status === 'Active') {
        counts.active++;

        // 1. Committed this month calculation:
        // Sum of Active monthly subscriptions where Ends is blank or in the future
        const isCommitmentActiveThisMonth = !endsDate || endsDate >= startOfCurrentMonth;
        if (cycle === 'Monthly' && isCommitmentActiveThisMonth) {
          committedThisMonth += cost;
        }

        // 2. Yearly items:
        if (cycle === 'Yearly') {
          yearlyItems.push(subscription);
        }

        // 3. Ending soon check (within next 60 days):
        // A) Trial Ends within next 60 days (Price changes)
        if (trialEndsDate) {
          const diffMs = trialEndsDate.getTime() - now.getTime();
          const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (daysRemaining >= 0 && daysRemaining <= 60) {
            endingSoon.push({
              name: rawName,
              category,
              cost,
              cycle,
              bank,
              type: 'trial_ends',
              dateStr: trialEnds!,
              daysRemaining,
              notes,
            });
          }
        }

        // B) Ends within next 60 days (Payment stops)
        if (endsDate) {
          const diffMs = endsDate.getTime() - now.getTime();
          const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (daysRemaining >= 0 && daysRemaining <= 60) {
            endingSoon.push({
              name: rawName,
              category,
              cost,
              cycle,
              bank,
              type: 'commitment_ends',
              dateStr: ends!,
              daysRemaining,
              notes,
            });
          }
        }
      } else if (status === 'Canceled') {
        counts.canceled++;
      } else if (status === 'Done') {
        counts.done++;
      }
    });

    // Sort ending soon by daysRemaining ascending (most urgent first)
    endingSoon.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Sort yearly items by billDate if available
    yearlyItems.sort((a, b) => (a.billDate || 0) - (b.billDate || 0));

    return {
      subscriptions,
      committedThisMonth: Math.round(committedThisMonth * 100) / 100,
      yearlyItems,
      endingSoon,
      counts,
      skippedRowsCount: skippedRows.length,
      skippedRows,
      flaggedFieldsCount: flaggedFields.length,
      flaggedFields,
    };
  } catch (error) {
    console.error('Error fetching subscriptions from live sheet:', error);
    return defaultData;
  }
}


