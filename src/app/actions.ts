//src/app/actions.ts
"use server";

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

