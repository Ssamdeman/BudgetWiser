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

// ═══════════════════════════════════════════════════════════════════════════
// V2 Color Palettes
// ═══════════════════════════════════════════════════════════════════════════

// Mood colors - distinct, vibrant, semantic
export const MOOD_COLORS: Record<string, string> = {
  Planned: 'hsl(210, 76%, 50%)',    // Blue - intentional
  Impulse: 'hsl(340, 82%, 52%)',    // Rose - spontaneous
  Social: 'hsl(262, 70%, 58%)',     // Purple - connection
  Necessary: 'hsl(160, 60%, 42%)',  // Teal - essential
  Treat: 'hsl(32, 95%, 55%)',       // Orange - reward
  Family: 'hsl(280, 65%, 55%)',     // Violet - loved ones
};

// Day of week colors - warm → cool gradient through week
export const DAY_COLORS: Record<string, string> = {
  Monday: 'hsl(200, 70%, 50%)',
  Tuesday: 'hsl(215, 70%, 55%)',
  Wednesday: 'hsl(230, 65%, 55%)',
  Thursday: 'hsl(250, 60%, 55%)',
  Friday: 'hsl(270, 65%, 55%)',
  Saturday: 'hsl(340, 70%, 55%)',
  Sunday: 'hsl(25, 85%, 55%)',
};

// Time of day colors - light → dark
export const TIME_COLORS: Record<string, string> = {
  Morning: 'hsl(45, 90%, 55%)',     // Golden
  Afternoon: 'hsl(25, 85%, 55%)',   // Orange
  Evening: 'hsl(260, 60%, 50%)',    // Purple
  Night: 'hsl(240, 50%, 35%)',      // Deep blue
};

// Heatmap intensity gradient (orange based)
export const HEATMAP_BASE_HUE = 25; // Orange

export function getHeatmapColor(intensity: number): string {
  // intensity: 0-1
  // low = light/transparent, high = saturated orange
  const saturation = 20 + intensity * 70;  // 20% → 90%
  const lightness = 90 - intensity * 45;   // 90% → 45%
  const alpha = 0.2 + intensity * 0.8;     // 0.2 → 1
  
  return `hsla(${HEATMAP_BASE_HUE}, ${saturation}%, ${lightness}%, ${alpha})`;
}

