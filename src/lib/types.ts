import { z } from "zod";

export const expenseCategories = ["Food", "Transport", "Shopping", "Housing", "Health", "Other"] as const;
export const expenseMoods = ["Happy", "Neutral", "Sad"] as const;

export const expenseSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Please enter a valid amount." })
    .positive({ message: "Amount must be positive." })
    .min(0.01, { message: "Amount must be at least 0.01." }),
  category: z.enum(expenseCategories, {
    required_error: "Please select a category.",
  }),
  mood: z.enum(expenseMoods, { required_error: "Please select your mood." }),
});

export type Expense = z.infer<typeof expenseSchema>;
