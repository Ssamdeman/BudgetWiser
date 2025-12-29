"use client";

import type { DayTimeHeatmapCell } from '@/lib/types';
import { timeOfDayOptions, daysOfWeek } from '@/lib/types';
import { getHeatmapColor } from '@/lib/chart-utils';
import { cn } from '@/lib/utils';

interface SpendingHeatmapProps {
  data: DayTimeHeatmapCell[];
}

export function SpendingHeatmap({ data }: SpendingHeatmapProps) {
  // Create a lookup map for fast cell access
  const cellMap = new Map<string, DayTimeHeatmapCell>();
  data.forEach(cell => cellMap.set(`${cell.day}-${cell.timeOfDay}`, cell));

  // Short day names for display
  const shortDays: Record<string, string> = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[320px]">
        {/* Header row - Time of Day */}
        <div className="grid grid-cols-[60px_repeat(4,1fr)] gap-1 mb-1">
          <div /> {/* Empty corner */}
          {(timeOfDayOptions as readonly string[]).map((time) => (
            <div 
              key={time} 
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {time}
            </div>
          ))}
        </div>

        {/* Data rows - Days */}
        {(daysOfWeek as readonly string[]).map((day) => (
          <div key={day} className="grid grid-cols-[60px_repeat(4,1fr)] gap-1 mb-1">
            {/* Day label */}
            <div className="text-xs font-medium text-muted-foreground flex items-center">
              {shortDays[day]}
            </div>
            
            {/* Cells */}
            {(timeOfDayOptions as readonly string[]).map((time) => {
              const cell = cellMap.get(`${day}-${time}`);
              const intensity = cell?.intensity || 0;
              const total = cell?.total || 0;
              
              return (
                <div
                  key={`${day}-${time}`}
                  className={cn(
                    "group relative aspect-square rounded-md transition-all duration-200",
                    "hover:ring-2 hover:ring-primary/50 hover:scale-105 cursor-default",
                    "flex items-center justify-center"
                  )}
                  style={{ backgroundColor: getHeatmapColor(intensity) }}
                >
                  {/* Value shown on hover */}
                  <span className={cn(
                    "text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity",
                    intensity > 0.5 ? "text-white" : "text-foreground"
                  )}>
                    ${total.toFixed(0)}
                  </span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                    <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-xl whitespace-nowrap">
                      <p className="text-xs font-medium">{shortDays[day]} {time}</p>
                      <p className="text-sm font-bold text-primary">${total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-2 border-t border-border/30">
          <span className="text-xs text-muted-foreground">Less</span>
          <div className="flex gap-0.5">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
              <div
                key={intensity}
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: getHeatmapColor(intensity) }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}
