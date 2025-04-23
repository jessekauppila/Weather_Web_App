import { SelectChangeEvent } from '@mui/material';
import moment from 'moment-timezone';
import { subDays } from 'date-fns';
import { DayRangeType } from '../types';
import { useCallback } from 'react';

/**
 * Custom hook for handling weather control UI interactions
 * Manages:
 * - Time range selection changes (1-30 days)
 * - Date selection changes
 * - Custom date range toggles
 * - Updates start/end dates based on selections
 * Requires setters for dates, custom end date flag, and time range
 * 
 * Note: While we set dates to the start of day here for UI consistency, 
 * the actual time of day for multi-day ranges (3 PM cutoff) is handled 
 * by calculateTimeRange in useTimeRange.ts
 */
export function useWeatherControls(
  setSelectedDate: (date: Date) => void,
  setEndDate: (date: Date) => void,
  setUseCustomEndDate: (use: boolean) => void,
  setIsOneDay: (isOne: boolean) => void,
  setTimeRange: (range: number) => void,
  stations: any[],
  handleRefresh: (isMetric?: boolean) => Promise<void>,
  currentTimeRange?: number, // Current time range value
  currentEndDate?: Date // Current end date from state
) {
  const handleTimeRangeChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const value = event.target.value;
      
      console.log('Time range changed to', value);
      
      // Don't change the selected date, just the range
      setTimeRange(Number(value));
      
      // Trigger data refresh after changing range
      handleRefresh();
    },
    [setTimeRange, handleRefresh]
  );

  const handleDayRangeTypeChange = (event: SelectChangeEvent<DayRangeType>) => {
    const newType = event.target.value as DayRangeType;
    console.log('⏱️ DAY RANGE TYPE: Changed to', newType);
    return newType;
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // This sets the date to start of day for UI consistency
    // Note: The actual time used for multi-day ranges (starting at 3 PM)
    // is applied in calculateTimeRange within useTimeRange.ts
    const newEndDate = moment(event.target.value)
      .tz('America/Los_Angeles')
      .startOf('day')
      .toDate();
    console.log('📅 END DATE CHANGE: Changed to', moment(newEndDate).format('YYYY-MM-DD'));
    
    // Update the end date
    setEndDate(newEndDate);
    
    // If we have a time range greater than 1, adjust the start date accordingly
    if (currentTimeRange && currentTimeRange > 1) {
      const daysToSubtract = currentTimeRange - 1;
      const newStartDate = subDays(newEndDate, daysToSubtract);
      setSelectedDate(newStartDate);
    } else {
      // If it's a single day or no time range provided, just set both dates to the same
      setSelectedDate(newEndDate);
    }
  };

  return {
    handleTimeRangeChange,
    handleDayRangeTypeChange,
    handleEndDateChange,
  };
} 