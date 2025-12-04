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
