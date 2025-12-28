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
  categoryByMonth: CategoryByMonth[];
  monthlyChanges: MonthlyChange[];
  allCategories: string[];
  grandTotal: number;
  monthCount: number;
}

// For stacked bar chart - each month has dynamic category keys
export interface CategoryByMonth {
  month: string;
  [category: string]: number | string;
}

// For month-over-month % change chart
export interface MonthlyChange {
  month: string;
  previousMonth: string;
  previousTotal: number;
  currentTotal: number;
  percentChange: number;
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
 * Aggregates entries by month with category breakdown for stacked chart
 */
function aggregateCategoryByMonth(entries: ExpenseEntry[], categories: string[]): CategoryByMonth[] {
  // Group by month first
  const monthData = new Map<string, Map<string, number>>();
  
  entries.forEach(entry => {
    const shortMonth = entry.month.split(' ')[0];
    if (!monthData.has(shortMonth)) {
      monthData.set(shortMonth, new Map());
    }
    const categoryMap = monthData.get(shortMonth)!;
    const current = categoryMap.get(entry.category) || 0;
    categoryMap.set(entry.category, current + entry.amount);
  });
  
  // Convert to array, sorted by MONTH_ORDER, only months with data
  return MONTH_ORDER
    .filter(month => monthData.has(month))
    .map(month => {
      const categoryMap = monthData.get(month)!;
      const result: CategoryByMonth = { month };
      
      categories.forEach(category => {
        result[category] = Math.round((categoryMap.get(category) || 0) * 100) / 100;
      });
      
      return result;
    });
}

/**
 * Calculates month-over-month percentage changes
 */
function calculateMonthOverMonth(monthlyTotals: MonthlyTotal[]): MonthlyChange[] {
  const changes: MonthlyChange[] = [];
  
  // Filter to only months with data
  const monthsWithData = monthlyTotals.filter(m => m.total > 0);
  
  // Skip first month (no previous to compare)
  for (let i = 1; i < monthsWithData.length; i++) {
    const previous = monthsWithData[i - 1];
    const current = monthsWithData[i];
    
    const percentChange = previous.total > 0
      ? Math.round(((current.total - previous.total) / previous.total) * 1000) / 10
      : 0;
    
    changes.push({
      month: current.month,
      previousMonth: previous.month,
      previousTotal: previous.total,
      currentTotal: current.total,
      percentChange,
    });
  }
  
  return changes;
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
  
  // Get all unique categories
  const allCategories = [...new Set(entries.map(e => e.category))].sort();
  
  // Calculate new aggregations
  const categoryByMonth = aggregateCategoryByMonth(entries, allCategories);
  const monthlyChanges = calculateMonthOverMonth(monthlyTotals);
  
  // Calculate grand total and count of months with data
  const grandTotal = entries.reduce((sum, e) => sum + e.amount, 0);
  const monthsWithData = new Set(entries.map(e => e.month.split(' ')[0]));
  
  return {
    entries,
    monthlyTotals,
    categoryTotals,
    categoryByMonth,
    monthlyChanges,
    allCategories,
    grandTotal: Math.round(grandTotal * 100) / 100,
    monthCount: monthsWithData.size,
  };
}
