import { useState, useCallback } from 'react';
import moment from 'moment-timezone';
import { DayRangeType } from '../types';
import { logTime, logDebug } from '../utils/logging';

/**
 * Custom hook for managing time range and date selections
 * Handles:
 * - Current date/time in LA timezone
 * - Selected date state
 * - Time range state (1, 3, 7, 14, 30 days)
 * - Day range type (MIDNIGHT, CURRENT, CUSTOM)
 * - Custom time selection
 * - Calculates time ranges based on selected parameters
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
    logDebug('useTimeRange', 'calculateCurrentTimeRange called', { useCustomEndDate, timeRange });
    
    if (useCustomEndDate && ![1, 3, 7, 14, 30].includes(timeRange)) {
      return 'custom';
    }
    return timeRange.toString();
  }, [useCustomEndDate, timeRange]);

  const calculateTimeRange = (date: Date, type: DayRangeType) => {
    logTime('useTimeRange', 'calculateTimeRange called with:', {
      date: date.toISOString(),
      type,
      rangeValue: timeRange
    });

    const endMoment = moment(date).tz('America/Los_Angeles');
    const currentMoment = moment().tz('America/Los_Angeles');
    const currentHour = currentMoment.hour();
    const currentMinute = currentMoment.minute();

    let result;

    switch (type) {
      case DayRangeType.MIDNIGHT:
        logTime('useTimeRange', 'Using midnight-to-midnight range');
        
        result = {
          start: endMoment.clone().startOf('day'),
          end: endMoment.clone().startOf('day').add(24 * timeRange, 'hours'),
          startHour: 0,
          endHour: 24
        };
        break;
        
      case DayRangeType.CURRENT:
        const endTimeStr = endMoment.clone()
          .hour(currentHour)
          .minute(currentMinute)
          .format('YYYY-MM-DD HH:mm:00');
        
        logTime('useTimeRange', `Using selected date with current time as end point: ${endTimeStr}`);
        
        result = {
          start: endMoment.clone()
            .subtract(timeRange, 'days')
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
        break;

      case DayRangeType.CUSTOM:
        const [hours, minutes] = customTime.split(':').map(Number);
        const customTimeStr = `${hours}:${minutes}`;
        
        logTime('useTimeRange', `Using custom time cutoff: ${customTimeStr}`);
        
        result = {
          start: endMoment.clone()
            .subtract(timeRange, 'days')
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
        logTime('useTimeRange', 'Using default time range (current time)');
        
        result = {
          start: endMoment.clone()
            .subtract(timeRange, 'days')
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

    const formattedResult = {
      start: result.start.format('YYYY-MM-DD HH:mm:00'),
      end: result.end.format('YYYY-MM-DD HH:mm:00'),
      startHour: result.startHour,
      endHour: result.endHour
    };

    logTime('useTimeRange', 'calculateTimeRange result:', formattedResult);

    return result;
  };

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