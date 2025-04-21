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
 * IMPORTANT: Multi-day range behavior
 * For time ranges > 1 day with CURRENT or CUSTOM day range type:
 * - The start time is FIXED at 3:00 PM on the day before the first full day
 * - This ensures we capture the afternoon data from the previous day
 * - Single-day ranges still use the exact current time or custom time for consistency
 * 
 * This behavior was implemented to fix an issue where multi-day ranges were
 * incorrectly starting at midnight instead of 3:00 PM the day before.
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
    // Always use the current date/time for the end point when using CURRENT type
    // This ensures we're always looking at data up to now
    let endMoment;
    let currentMoment = moment().tz('America/Los_Angeles');
    
    if (type === DayRangeType.CURRENT) {
      // For CURRENT type, always use the actual current moment as the end point
      endMoment = currentMoment.clone();
    } else {
      // For other types, use the selected date 
      endMoment = moment(date).tz('America/Los_Angeles');
    }
    
    const currentHour = currentMoment.hour();
    const currentMinute = currentMoment.minute();

    // Log date info for debugging
    console.log('⏰ Time Parameters:', {
      startHour: type === DayRangeType.MIDNIGHT ? 0 : (rangeValue > 1 ? 15 : currentHour),
      endHour: type === DayRangeType.MIDNIGHT ? 24 : currentHour,
      dayRangeType: type,
      timeRangeStart: endMoment.clone().subtract(rangeValue, 'days').format('YYYY-MM-DD HH:mm:ss'),
      timeRangeEnd: endMoment.format('YYYY-MM-DD HH:mm:ss')
    });

    switch (type) {
      case DayRangeType.MIDNIGHT:
        const midnightResult = {
          start: endMoment.clone().startOf('day'),
          end: endMoment.clone().startOf('day').add(24 * rangeValue, 'hours'),
          startHour: 0,
          endHour: 24
        };
        return midnightResult;
        
      case DayRangeType.CURRENT:
        if (rangeValue > 1) {
          console.log(`Multi-day range (${rangeValue} days) detected - using fixed 3 PM cutoff`);
          const multiDayResult = {
            // For multi-day ranges, go back the full rangeValue days for the start
            // This ensures we include enough days with 3 PM cutoff points
            start: endMoment.clone()
              .subtract(rangeValue, 'days')
              .hour(15) // Always 3 PM
              .minute(0)
              .second(0),
            end: endMoment.clone(), // End is current time
            startHour: 15,
            endHour: currentHour
          };
          return multiDayResult;
        } else {
          // For single day range, go back exactly 24 hours from now
          const currentResult = {
            start: endMoment.clone()
              .subtract(1, 'days'), // Go back 24 hours from current time
            end: endMoment.clone(),
            startHour: currentHour,
            endHour: currentHour
          };
          return currentResult;
        }

      case DayRangeType.CUSTOM:
        const [hours, minutes] = customTime.split(':').map(Number);
        if (rangeValue > 1) {
          return {
            start: endMoment.clone()
              .subtract(rangeValue, 'days')
              .hour(15)
              .minute(0)
              .second(0),
            end: endMoment.clone()
              .hour(hours)
              .minute(minutes)
              .second(0),
            startHour: 15,
            endHour: hours
          };
        } else {
          return {
            start: endMoment.clone()
              .subtract(1, 'days')
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
        }
    
      default:
        return {
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