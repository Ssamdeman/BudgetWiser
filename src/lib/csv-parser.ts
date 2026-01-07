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

// ═══════════════════════════════════════════════════════════════════════════
// V2 PARSER (2026+ Data with Mood, TimeOfDay, DayOfWeek)
// ═══════════════════════════════════════════════════════════════════════════

import type { 
  V2ExpenseEntry, 
  V2AnalyticsData, 
  MoodTotal, 
  MoodByMonth, 
  DayTotal, 
  TimeOfDayTotal, 
  DayTimeHeatmapCell,
  Mood,
  TimeOfDay,
  DayOfWeek
} from './types';
import { expensePurchaseTypes, timeOfDayOptions, daysOfWeek } from './types';

/**
 * Parses V2 CSV format: Month,Date,Amount,Category,Mood,TimeOfDay,DayOfWeek,WeekNumber
 */
function parseV2CSV(csvText: string): V2ExpenseEntry[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const entries: V2ExpenseEntry[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace('\r', '');
    const parts = line.split(',');
    
    if (parts.length < 8) continue;
    
    const [month, date, amount, category, mood, timeOfDay, dayOfWeek, weekNumber] = parts;
    
    if (month && amount && category) {
      entries.push({
        month: month.trim(),
        date: date?.trim() || '',
        amount: parseFloat(amount),
        category: normalizeCategory(category),
        mood: (mood?.trim() || 'Planned') as Mood,
        timeOfDay: (timeOfDay?.trim() || 'Afternoon') as TimeOfDay,
        dayOfWeek: (dayOfWeek?.trim() || 'Monday') as DayOfWeek,
        weekNumber: parseInt(weekNumber?.trim() || '1', 10),
      });
    }
  }
  
  return entries;
}

/**
 * Aggregates V2 entries by mood with percentages
 */
function aggregateByMood(entries: V2ExpenseEntry[]): MoodTotal[] {
  const totals = new Map<string, number>();
  let grandTotal = 0;
  
  entries.forEach(entry => {
    const current = totals.get(entry.mood) || 0;
    totals.set(entry.mood, current + entry.amount);
    grandTotal += entry.amount;
  });
  
  // Ensure all moods are represented
  return (expensePurchaseTypes as readonly string[]).map(mood => {
    const total = totals.get(mood) || 0;
    return {
      mood: mood as Mood,
      total: Math.round(total * 100) / 100,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 1000) / 10 : 0,
    };
  }).filter(m => m.total > 0).sort((a, b) => b.total - a.total);
}

/**
 * Aggregates V2 entries by month with mood breakdown for stacked chart
 */
function aggregateMoodByMonth(entries: V2ExpenseEntry[]): MoodByMonth[] {
  const monthData = new Map<string, Map<string, number>>();
  
  entries.forEach(entry => {
    const shortMonth = entry.month.split(' ')[0];
    if (!monthData.has(shortMonth)) {
      monthData.set(shortMonth, new Map());
    }
    const moodMap = monthData.get(shortMonth)!;
    const current = moodMap.get(entry.mood) || 0;
    moodMap.set(entry.mood, current + entry.amount);
  });
  
  // Return in calendar order, only months with data
  return MONTH_ORDER
    .filter(month => monthData.has(month))
    .map(month => {
      const moodMap = monthData.get(month)!;
      const result: MoodByMonth = { month };
      
      (expensePurchaseTypes as readonly string[]).forEach(mood => {
        result[mood] = Math.round((moodMap.get(mood) || 0) * 100) / 100;
      });
      
      return result;
    });
}

/**
 * Aggregates V2 entries by day of week
 */
function aggregateByDayOfWeek(entries: V2ExpenseEntry[]): DayTotal[] {
  const totals = new Map<string, number>();
  
  entries.forEach(entry => {
    const current = totals.get(entry.dayOfWeek) || 0;
    totals.set(entry.dayOfWeek, current + entry.amount);
  });
  
  return (daysOfWeek as readonly string[]).map(day => ({
    day: day as DayOfWeek,
    total: Math.round((totals.get(day) || 0) * 100) / 100,
  }));
}

/**
 * Aggregates V2 entries by time of day
 */
function aggregateByTimeOfDay(entries: V2ExpenseEntry[]): TimeOfDayTotal[] {
  const totals = new Map<string, number>();
  
  entries.forEach(entry => {
    const current = totals.get(entry.timeOfDay) || 0;
    totals.set(entry.timeOfDay, current + entry.amount);
  });
  
  return (timeOfDayOptions as readonly string[]).map(time => ({
    timeOfDay: time as TimeOfDay,
    total: Math.round((totals.get(time) || 0) * 100) / 100,
  }));
}

/**
 * Creates heatmap data: Day × TimeOfDay grid with intensities
 */
function aggregateDayTimeHeatmap(entries: V2ExpenseEntry[]): DayTimeHeatmapCell[] {
  const grid = new Map<string, number>();
  let maxTotal = 0;
  
  // Build grid
  entries.forEach(entry => {
    const key = `${entry.dayOfWeek}-${entry.timeOfDay}`;
    const current = grid.get(key) || 0;
    const newTotal = current + entry.amount;
    grid.set(key, newTotal);
    maxTotal = Math.max(maxTotal, newTotal);
  });
  
  // Create cells with normalized intensity
  const cells: DayTimeHeatmapCell[] = [];
  
  (daysOfWeek as readonly string[]).forEach(day => {
    (timeOfDayOptions as readonly string[]).forEach(time => {
      const key = `${day}-${time}`;
      const total = grid.get(key) || 0;
      cells.push({
        day: day as DayOfWeek,
        timeOfDay: time as TimeOfDay,
        total: Math.round(total * 100) / 100,
        intensity: maxTotal > 0 ? total / maxTotal : 0,
      });
    });
  });
  
  return cells;
}

/**
 * Find peak spending cell (day + time combination)
 */
function findPeakSpending(heatmap: DayTimeHeatmapCell[]): { day: DayOfWeek; timeOfDay: TimeOfDay; total: number } | null {
  if (heatmap.length === 0) return null;
  
  const peak = heatmap.reduce((max, cell) => cell.total > max.total ? cell : max, heatmap[0]);
  return peak.total > 0 ? { day: peak.day, timeOfDay: peak.timeOfDay, total: peak.total } : null;
}

/**
 * Fetches and parses V2 CSV file (no-cache for live updates)
 */
export async function fetchAndParseV2CSV(): Promise<V2AnalyticsData | null> {
  try {
    const response = await fetch('/V2_master_finances-2026.csv', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    
    if (!response.ok) return null;
    
    const csvText = await response.text();
    if (!csvText.trim() || csvText.trim().split('\n').length < 2) return null;
    
    const entries = parseV2CSV(csvText);
    if (entries.length === 0) return null;
    
    const moodTotals = aggregateByMood(entries);
    const moodByMonth = aggregateMoodByMonth(entries);
    const dayTotals = aggregateByDayOfWeek(entries);
    const timeOfDayTotals = aggregateByTimeOfDay(entries);
    const heatmapData = aggregateDayTimeHeatmap(entries);
    
    // Reuse existing aggregateByCategory for V2
    const v2Entries = entries.map(e => ({
      month: e.month,
      date: e.date,
      amount: e.amount,
      category: e.category,
    }));
    const categoryTotals = aggregateByCategory(v2Entries);
    
    const grandTotal = entries.reduce((sum, e) => sum + e.amount, 0);
    const monthsWithData = new Set(entries.map(e => e.month.split(' ')[0]));
    
    // Hero insights
    const topMood = moodTotals.length > 0 ? { mood: moodTotals[0].mood, percentage: moodTotals[0].percentage } : null;
    const peakSpendingTime = findPeakSpending(heatmapData);
    
    return {
      entries,
      grandTotal: Math.round(grandTotal * 100) / 100,
      monthCount: monthsWithData.size,
      moodTotals,
      moodByMonth,
      dayTotals,
      timeOfDayTotals,
      heatmapData,
      categoryTotals,
      topMood,
      peakSpendingTime,
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE SHEET DATA FUNCTIONS (Current Month Feature)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Converts a date string (e.g. "1/7/2026" or "01/07/2026") to month format "Jan 2026"
 */
function formatDateToMonth(dateStr: string): string {
  if (!dateStr) return '';
  
  const parts = dateStr.split('/');
  if (parts.length < 3) return '';
  
  const monthIndex = parseInt(parts[0], 10) - 1;
  const year = parts[2];
  
  if (monthIndex < 0 || monthIndex > 11) return '';
  
  return `${MONTH_ORDER[monthIndex]} ${year}`;
}

/**
 * Parses Google Sheet rows (C:I columns) to V2ExpenseEntry[]
 * Sheet columns: C=Amount, D=Category, E=Mood, F=TimeOfDay, G=DayOfWeek, H=WeekNumber, I=Date
 */
export function parseSheetToV2Entries(rows: string[][]): V2ExpenseEntry[] {
  return rows
    .filter(row => row[0] && row[6]) // Must have Amount (C) and Date (I)
    .map(row => ({
      month: formatDateToMonth(row[6]),
      date: row[6]?.trim() || '',
      amount: parseFloat(row[0]) || 0,
      category: normalizeCategory(row[1] || 'Other'),
      mood: (row[2]?.trim() || 'Planned') as Mood,
      timeOfDay: (row[3]?.trim() || 'Afternoon') as TimeOfDay,
      dayOfWeek: (row[4]?.trim() || 'Monday') as DayOfWeek,
      weekNumber: parseInt(row[5]?.trim() || '1', 10),
    }))
    .filter(entry => entry.month && entry.amount > 0);
}

/**
 * Merges CSV entries with live sheet entries, deduplicating by date+amount+category
 * Live entries take priority (they're fresher)
 */
export function mergeV2DataSources(
  csvEntries: V2ExpenseEntry[],
  liveEntries: V2ExpenseEntry[]
): V2ExpenseEntry[] {
  const seen = new Set<string>();
  const merged: V2ExpenseEntry[] = [];
  
  // Live entries take priority
  for (const entry of liveEntries) {
    const key = `${entry.date}-${entry.amount}-${entry.category}`;
    seen.add(key);
    merged.push(entry);
  }
  
  // Add CSV entries not in live
  for (const entry of csvEntries) {
    const key = `${entry.date}-${entry.amount}-${entry.category}`;
    if (!seen.has(key)) {
      merged.push(entry);
    }
  }
  
  return merged;
}

/**
 * Processes V2ExpenseEntry[] into full V2AnalyticsData
 * Extracted from fetchAndParseV2CSV for reuse with live data
 */
export function processV2Entries(entries: V2ExpenseEntry[]): V2AnalyticsData | null {
  if (entries.length === 0) return null;
  
  const moodTotals = aggregateByMood(entries);
  const moodByMonth = aggregateMoodByMonth(entries);
  const dayTotals = aggregateByDayOfWeek(entries);
  const timeOfDayTotals = aggregateByTimeOfDay(entries);
  const heatmapData = aggregateDayTimeHeatmap(entries);
  
  // Reuse existing aggregateByCategory for V2
  const v2Entries = entries.map(e => ({
    month: e.month,
    date: e.date,
    amount: e.amount,
    category: e.category,
  }));
  const categoryTotals = aggregateByCategory(v2Entries);
  
  const grandTotal = entries.reduce((sum, e) => sum + e.amount, 0);
  const monthsWithData = new Set(entries.map(e => e.month.split(' ')[0]));
  
  // Hero insights
  const topMood = moodTotals.length > 0 ? { mood: moodTotals[0].mood, percentage: moodTotals[0].percentage } : null;
  const peakSpendingTime = findPeakSpending(heatmapData);
  
  return {
    entries,
    grandTotal: Math.round(grandTotal * 100) / 100,
    monthCount: monthsWithData.size,
    moodTotals,
    moodByMonth,
    dayTotals,
    timeOfDayTotals,
    heatmapData,
    categoryTotals,
    topMood,
    peakSpendingTime,
  };
}
