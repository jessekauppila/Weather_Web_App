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
  // Add a debug flag, set to false by default

  const calculateCurrentTimeRange = useCallback(() => {
    if (useCustomEndDate && ![1, 3, 7, 14, 30].includes(timeRange)) {
      return 'custom';
    }
    return timeRange.toString();
  }, [useCustomEndDate, timeRange]);

  const calculateTimeRange = useCallback((date: Date, type: DayRangeType, rangeValue: number = timeRange) => {
    console.log('⏱️ calculateTimeRange called with:', {
      date: date.toISOString(),
      type,
      rangeValue
    });
    
    // Always use the selected date as the basis, applying the current time only for CURRENT type
    const selectedMoment = moment(date).tz('America/Los_Angeles');
    let endMoment;
    let currentMoment = moment().tz('America/Los_Angeles');
    
    if (type === DayRangeType.CURRENT) {
      // For CURRENT type, use the selected date but with the current time
      endMoment = selectedMoment.clone()
        .hour(currentMoment.hour())
        .minute(currentMoment.minute())
        .second(0);
      console.log('⏱️ Using selected date with current time as end point:', endMoment.format('YYYY-MM-DD HH:mm:ss'));
    } else {
      // For other types, use the selected date 
      endMoment = selectedMoment.clone();
      console.log('⏱️ Using selected date as end point:', endMoment.format('YYYY-MM-DD HH:mm:ss'));
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
        if (rangeValue > 1) {
          result = {
            // For multi-day ranges, go back the full rangeValue days for the start
            // This ensures we include enough days with 3 PM cutoff points
            start: endMoment.clone()
              .subtract(rangeValue, 'days')
              .hour(15) // Always 3 PM
              .minute(0)
              .second(0),
            end: endMoment.clone(), // End is current time but on selected date
            startHour: 15,
            endHour: currentHour
          };
        } else {
          // For single day range, go back exactly 24 hours from the end time
          result = {
            start: endMoment.clone()
              .subtract(1, 'days'), // Go back 24 hours from end time
            end: endMoment.clone(),
            startHour: currentHour,
            endHour: currentHour
          };
        }
        break;

      case DayRangeType.CUSTOM:
        const [hours, minutes] = customTime.split(':').map(Number);
        if (rangeValue > 1) {
          result = {
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
          result = {
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
    
    console.log('⏱️ calculateTimeRange result:', {
      start: result.start.format('YYYY-MM-DD HH:mm:ss'),
      end: result.end.format('YYYY-MM-DD HH:mm:ss'),
      startHour: result.startHour,
      endHour: result.endHour
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