// src/lib/chart-utils.ts
// Shared utilities for chart components

/**
 * Generates distinct colors with orange hue variations
 * Consistent across all charts for the same category count
 */
export function generateCategoryColors(count: number): string[] {
  const baseHue = 25; // Primary orange
  const colors: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Vary hue around orange (15-45) and saturation/lightness
    const hue = baseHue + (i * 8) % 60 - 20;
    const saturation = 75 + (i % 3) * 8;
    const lightness = 45 + (i % 4) * 8;
    colors.push(`hsl(${Math.max(0, Math.min(60, hue))}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
}

/**
 * Creates a stable category → color mapping based on sorted categories
 */
export function createCategoryColorMap(categories: string[]): Record<string, string> {
  const sorted = [...categories].sort();
  const colors = generateCategoryColors(sorted.length);
  
  return sorted.reduce((map, category, index) => {
    map[category] = colors[index];
    return map;
  }, {} as Record<string, string>);
}

// Month-over-month change colors
export const MOM_COLORS = {
  positive: 'hsl(142, 76%, 36%)', // Green
  negative: 'hsl(0, 84%, 60%)',   // Red
  neutral: 'hsl(var(--muted-foreground))',
};
