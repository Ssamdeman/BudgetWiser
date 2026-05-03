import type { V2ExpenseEntry } from './types';

export function computeHistoricalAverageBaseline(pastEntries: V2ExpenseEntry[]) {
  const monthlyTotals = new Map<string, number>();

  for (const entry of pastEntries) {
    const current = monthlyTotals.get(entry.month) || 0;
    monthlyTotals.set(entry.month, current + entry.amount);
  }

  const completedMonthsCount = monthlyTotals.size;
  let sum = 0;
  for (const amount of monthlyTotals.values()) {
    sum += amount;
  }

  const averageMonthlyBaseline = completedMonthsCount > 0 ? sum / completedMonthsCount : 0;

  return {
    averageMonthlyBaseline,
    completedMonthsCount,
  };
}

export function computePaceCheck(currentSpend: number, averageMonthlyBaseline: number, today: Date) {
  const historicalDailyAverage = averageMonthlyBaseline / 30.4;
  const daysPassed = today.getDate();
  const expectedSpendByNow = historicalDailyAverage * daysPassed;
  const paceDifference = currentSpend - expectedSpendByNow;

  return {
    toDate: currentSpend,
    expectedByNow: expectedSpendByNow,
    paceDifference,
  };
}

export function computeEndOfMonthEstimate(currentSpend: number, today: Date) {
  const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysPassed = today.getDate();
  const daysRemaining = totalDaysInMonth - daysPassed;
  const currentDailyPace = currentSpend / Math.max(1, daysPassed);

  return currentSpend + (currentDailyPace * daysRemaining);
}

export function computeTopCategoryBaselines(pastEntries: V2ExpenseEntry[], completedMonthsCount: number, topN: number = 3) {
  const categoryTotals = new Map<string, number>();

  for (const entry of pastEntries) {
    const current = categoryTotals.get(entry.category) || 0;
    categoryTotals.set(entry.category, current + entry.amount);
  }

  const categoryAverages = Array.from(categoryTotals.entries()).map(([category, total]) => {
    return {
      category,
      average: completedMonthsCount > 0 ? total / completedMonthsCount : 0,
    };
  });

  categoryAverages.sort((a, b) => b.average - a.average);

  return categoryAverages.slice(0, topN);
}

export function computeTopMood(pastEntries: V2ExpenseEntry[]) {
  const moodCounts = new Map<string, number>();
  let totalPastMoods = 0;

  for (const entry of pastEntries) {
    const count = moodCounts.get(entry.mood) || 0;
    moodCounts.set(entry.mood, count + 1);
    totalPastMoods++;
  }

  if (totalPastMoods === 0) {
    return { mood: "Unknown", percentage: 0.0 };
  }

  let topMood = "Unknown";
  let maxCount = -1;

  for (const [mood, count] of moodCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      topMood = mood;
    }
  }

  const percentage = (maxCount / totalPastMoods) * 100;

  return {
    mood: topMood,
    percentage: Math.round(percentage * 10) / 10,
  };
}
