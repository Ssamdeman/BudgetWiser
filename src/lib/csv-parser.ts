// src/lib/csv-parser.ts
// Parses the master CSV file and returns structured expense data

export interface ExpenseEntry {
  month: string;
  date: string;
  amount: number;
  category: string;
}

export interface MonthlyTotal {
  month: string;
  total: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  percentage: number;
}

export interface AnalyticsData {
  entries: ExpenseEntry[];
  monthlyTotals: MonthlyTotal[];
  categoryTotals: CategoryTotal[];
  grandTotal: number;
  monthCount: number;
}

// Month order for proper sorting
const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Normalizes category names per V1→V2 mapping:
 * - "EAting Out" → "Eating Out" (typo fix)
 * - "Personal-High Falls Gorge" → "Travel/Adventure"
 * - "Personal" → "Beauty/Grooming"
 */
function normalizeCategory(category: string): string {
  const trimmed = category.trim();
  
  // Typo fix
  if (trimmed.toLowerCase() === 'eating out' || trimmed === 'EAting Out') {
    return 'Eating Out';
  }
  
  // Tourist destination → Travel
  if (trimmed === 'Personal-High Falls Gorge') {
    return 'Travel/Adventure';
  }
  
  // Personal → Beauty/Grooming
  if (trimmed === 'Personal') {
    return 'Beauty/Grooming';
  }
  
  return trimmed;
}

/**
 * Parses a CSV string into expense entries
 */
function parseCSV(csvText: string): ExpenseEntry[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const entries: ExpenseEntry[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace('\r', '');
    const [month, date, amount, category] = line.split(',');
    
    if (month && amount && category) {
      entries.push({
        month: month.trim(),
        date: date?.trim() || '',
        amount: parseFloat(amount),
        category: normalizeCategory(category),
      });
    }
  }
  
  return entries;
}

/**
 * Aggregates entries into monthly totals (all 12 months)
 */
function aggregateByMonth(entries: ExpenseEntry[]): MonthlyTotal[] {
  const totals = new Map<string, number>();
  
  // Initialize all months with 0
  MONTH_ORDER.forEach(month => totals.set(month, 0));
  
  // Sum by month
  entries.forEach(entry => {
    // Extract short month name from "Sep 2025" format
    const shortMonth = entry.month.split(' ')[0];
    const current = totals.get(shortMonth) || 0;
    totals.set(shortMonth, current + entry.amount);
  });
  
  // Return in calendar order
  return MONTH_ORDER.map(month => ({
    month,
    total: Math.round((totals.get(month) || 0) * 100) / 100,
  }));
}

/**
 * Aggregates entries into category totals with percentages
 */
function aggregateByCategory(entries: ExpenseEntry[]): CategoryTotal[] {
  const totals = new Map<string, number>();
  let grandTotal = 0;
  
  // Sum by category
  entries.forEach(entry => {
    const current = totals.get(entry.category) || 0;
    totals.set(entry.category, current + entry.amount);
    grandTotal += entry.amount;
  });
  
  // Convert to array with percentages, sorted by total descending
  return Array.from(totals.entries())
    .map(([category, total]) => ({
      category,
      total: Math.round(total * 100) / 100,
      percentage: Math.round((total / grandTotal) * 1000) / 10,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Fetches and parses the master CSV file
 */
export async function fetchAndParseCSV(): Promise<AnalyticsData> {
  const response = await fetch('/V1-2025-Mastered-data/V1_master_finances-2025.csv');
  const csvText = await response.text();
  
  const entries = parseCSV(csvText);
  const monthlyTotals = aggregateByMonth(entries);
  const categoryTotals = aggregateByCategory(entries);
  
  // Calculate grand total and count of months with data
  const grandTotal = entries.reduce((sum, e) => sum + e.amount, 0);
  const monthsWithData = new Set(entries.map(e => e.month.split(' ')[0]));
  
  return {
    entries,
    monthlyTotals,
    categoryTotals,
    grandTotal: Math.round(grandTotal * 100) / 100,
    monthCount: monthsWithData.size,
  };
}
