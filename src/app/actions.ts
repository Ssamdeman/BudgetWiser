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
