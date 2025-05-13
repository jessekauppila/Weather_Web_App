import { DayRangeType } from '../types/time';

export function calculateTimeRange(
  selectedDate: Date,
  dayRangeType: DayRangeType,
  timeRange: string
): { start: string; end: string; startHour: number; endHour: number } {
  const start = new Date(selectedDate);
  const end = new Date(selectedDate);

  let startHour = 0;
  let endHour = 24;

  switch (dayRangeType) {
    case DayRangeType.MIDNIGHT:
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case DayRangeType.CURRENT:
      // For CURRENT, we use the last 24 hours
      end.setHours(23, 59, 59, 999);
      start.setHours(end.getHours() - 24, 0, 0, 0);
      break;
    case DayRangeType.CUSTOM:
      // Handle custom time range
      const [startTime, endTime] = timeRange.split('-').map(t => parseInt(t));
      startHour = startTime;
      endHour = endTime;
      start.setHours(startTime, 0, 0, 0);
      end.setHours(endTime, 59, 59, 999);
      break;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startHour,
    endHour
  };
} 