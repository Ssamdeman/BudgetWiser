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
    console.log('=== SERVER ACTION DEBUG ===');
    console.log('Received data:', data);

    validatedData = expenseSchema.parse(data);
    console.log('After validation:', validatedData);

    // ✅ MODIFICATION: Destructure the object here
    const { amount, category, purchaseType } = validatedData;

    // Pass values individually instead of the whole object
    console.log("Syncing to Google Sheets with individual values...");
    await appendExpenseToSheet(amount, category, purchaseType); // <-- Pass values, not object
    console.log("Sync complete!");

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
    console.log('📊 Raw rows from sheet:', rows.length, 'rows');
    console.log('📊 First 3 rows:', JSON.stringify(rows.slice(0, 3)));
    
    const entries = parseSheetToV2Entries(rows);
    console.log('📊 Parsed entries:', entries.length);
    console.log('📊 First 3 entries:', JSON.stringify(entries.slice(0, 3)));
    
    // Get current month prefix (e.g., "Jan 2026")
    const now = new Date();
    const currentMonthPrefix = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    console.log('📊 Looking for month:', currentMonthPrefix);
    
    // Filter to current month only
    const filtered = entries.filter(e => e.month === currentMonthPrefix);
    console.log('📊 Filtered to current month:', filtered.length);
    
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
