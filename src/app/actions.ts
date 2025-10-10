"use server";

import { z } from "zod";
import { expenseSchema } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function logExpenseAction(data: z.infer<typeof expenseSchema>) {
  try {
    const validatedData = expenseSchema.parse(data);

    // Simulate saving data to Google Sheets
    console.log("Syncing to Google Sheets:", validatedData);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Sync complete!");

    revalidatePath("/");

    return { success: true, message: "Expense logged successfully!" };
  } catch (error) {
    console.error("Error logging expense:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: "Validation failed.", errors: error.flatten().fieldErrors };
    }
    return { success: false, message: "An unexpected error occurred." };
  }
}
