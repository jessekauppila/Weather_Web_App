import { useState, useCallback } from 'react';
import moment from 'moment-timezone';
import { DayRangeType } from '../types';

/**
 * Custom hook for managing time range and date selections
 * Handles:
 * - Current date/time in LA timezone
 * - Selected date state
 * - Time range state (1, 3, 7, 14, 30 days)
 * - Day range type (MIDNIGHT, CURRENT, CUSTOM)
 * - Custom time selection
 * - Calculates time ranges based on selected parameters
 * 
 * Time range behavior:
 * For all time ranges (including multi-day):
 * - The exact selected time (current or custom) is used for consistency
 * - This ensures the same time of day is used for the start and end dates
 */

const VALID_TIME_RANGES = [1, 3, 7, 14, 30];

/**
 * Calculates the start and end times based on the selected date and range type
 * @param date - The base date to calculate the range from
 * @param type - The type of range (MIDNIGHT, CURRENT, or FORECAST)
 * @returns Object containing start time, end time, and corresponding hours
 */

export function useTimeRange() {
  const currentMoment = moment().tz('America/Los_Angeles');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState(1);
  const [dayRangeType, setDayRangeType] = useState<DayRangeType>(DayRangeType.CURRENT);
  const [useCustomEndDate, setUseCustomEndDate] = useState(false);
  const [customTime, setCustomTime] = useState<string>('');

  const calculateCurrentTimeRange = useCallback(() => {
    if (useCustomEndDate && ![1, 3, 7, 14, 30].includes(timeRange)) {
      return 'custom';
    }
    return timeRange.toString();
  }, [useCustomEndDate, timeRange]);

  const calculateTimeRange = useCallback((date: Date, type: DayRangeType, rangeValue: number = timeRange) => {
    // IMPORTANT CHANGE: Always use the selected date as the END DATE, not as a midpoint
    const endMoment = moment(date).tz('America/Los_Angeles');
    let currentMoment = moment().tz('America/Los_Angeles');
    
    // Determine the actual time to use based on the day range type
    if (type === DayRangeType.CURRENT) {
      // For CURRENT type, use the current time of day on the selected date
      endMoment.hour(currentMoment.hour())
        .minute(currentMoment.minute())
        .second(0);
    } else if (type === DayRangeType.MIDNIGHT) {
      // For MIDNIGHT type, set to end of day
      endMoment.hour(23).minute(59).second(59);
    } else if (type === DayRangeType.CUSTOM && customTime) {
      // For CUSTOM type, use the specified time on the selected date
      const [hours, minutes] = customTime.split(':').map(Number);
      endMoment.hour(hours).minute(minutes).second(0);
    }
    
    // Calculate the start date by subtracting the full range value
    // FIX: Always subtract full range (not range-1) to ensure proper days difference
    const startMoment = endMoment.clone().subtract(rangeValue, 'days');
    
    // Now adjust the time based on type
    if (type === DayRangeType.MIDNIGHT) {
      // For MIDNIGHT, start at beginning of day and end at end of day
      startMoment.hour(0).minute(0).second(0);
    } else if (type === DayRangeType.CURRENT) {
      // For CURRENT, use same time for both start and end
      startMoment.hour(endMoment.hour()).minute(endMoment.minute()).second(0);
    } else if (type === DayRangeType.CUSTOM && customTime) {
      // For CUSTOM, use same custom time for both start and end
      const [hours, minutes] = customTime.split(':').map(Number);
      startMoment.hour(hours).minute(minutes).second(0);
    }
    
    const currentHour = endMoment.hour();
    const currentMinute = endMoment.minute();
    
    const result = {
      start: startMoment,
      end: endMoment,
      startHour: type === DayRangeType.MIDNIGHT ? 0 : currentHour,
      endHour: type === DayRangeType.MIDNIGHT ? 24 : currentHour
    };
    
    return result;
  }, [customTime]);

  return {
    selectedDate,
    setSelectedDate,
    timeRange,
    setTimeRange,
    dayRangeType,
    setDayRangeType,
    useCustomEndDate,
    setUseCustomEndDate,
    customTime,
    setCustomTime,
    calculateCurrentTimeRange,
    calculateTimeRange
  };
}