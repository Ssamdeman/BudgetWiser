//src/app/actions.ts
"use server";

// Forcing a new server build v1.1

import { z } from "zod";
import { expenseSchema } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { appendExpenseToSheet } from "@/lib/google-sheets";


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

import fs from 'fs/promises';
import path from 'path';
import { parseV2CSV, processV2Entries } from "@/lib/csv-parser";
import type { V2AnalyticsData } from "@/lib/types";

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
