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
    // Always use the selected date as the basis, applying the current time only for CURRENT type
    const selectedMoment = moment(date).tz('America/Los_Angeles');
    let endMoment;
    let currentMoment = moment().tz('America/Los_Angeles');
    
    // Log the initial inputs to the time range calculation
    console.log('⏱️ TIME RANGE INPUTS:', {
      date: date.toISOString(),
      type: type.toString(),
      rangeValue
    });
    
    if (type === DayRangeType.CURRENT) {
      // For CURRENT type, use the selected date but with the current time
      endMoment = selectedMoment.clone()
        .hour(currentMoment.hour())
        .minute(currentMoment.minute())
        .second(0);
    } else {
      // For other types, use the selected date 
      endMoment = selectedMoment.clone();
    }
    
    const currentHour = currentMoment.hour();
    const currentMinute = currentMoment.minute();

    let result;
    switch (type) {
      case DayRangeType.MIDNIGHT:
        result = {
          start: endMoment.clone().startOf('day'),
          end: endMoment.clone().startOf('day').add(24 * rangeValue, 'hours'),
          startHour: 0,
          endHour: 24
        };
        break;
        
      case DayRangeType.CURRENT:
        // Use same current time for both start and end dates
        result = {
          start: endMoment.clone()
            .subtract(rangeValue, 'days'), // Go back the full range
          end: endMoment.clone(),
          startHour: currentHour,
          endHour: currentHour
        };
        break;

      case DayRangeType.CUSTOM:
        const [hours, minutes] = customTime.split(':').map(Number);
        // Use same custom time for both start and end dates
        result = {
          start: endMoment.clone()
            .subtract(rangeValue, 'days')
            .hour(hours)
            .minute(minutes)
            .second(0),
          end: endMoment.clone()
            .hour(hours)
            .minute(minutes)
            .second(0),
          startHour: hours,
          endHour: hours
        };
        break;
    
      default:
        result = {
          start: endMoment.clone()
            .subtract(rangeValue, 'days')
            .hour(currentHour)
            .minute(currentMinute)
            .second(0),
          end: endMoment.clone()
            .hour(currentHour)
            .minute(currentMinute)
            .second(0),
          startHour: currentHour,
          endHour: currentHour
        };
    }
    
    // Log the final calculated time range
    console.log('⏱️ TIME RANGE RESULT:', {
      start: result.start.format('YYYY-MM-DD HH:mm:ss'),
      end: result.end.format('YYYY-MM-DD HH:mm:ss'),
      startHour: result.startHour,
      endHour: result.endHour,
      days: result.end.diff(result.start, 'days')
    });
    
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