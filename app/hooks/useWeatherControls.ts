import { SelectChangeEvent } from '@mui/material';
import moment from 'moment-timezone';
import { subDays } from 'date-fns';
import { DayRangeType } from '../types';

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
  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    console.log('Time range changed:', value);
    
    if (value === 'custom') {
      // For custom range, we definitely want to show both date pickers
      setUseCustomEndDate(true);
      setIsOneDay(false);
      return;
    }
    
    // For any range value:
    // 1. Set the new time range
    const newTimeRange = Number(value);
    setTimeRange(newTimeRange);
    
    // 2. Update whether we're showing one day or multiple days
    const isOneDay = value === '1';
    setIsOneDay(isOneDay);
    
    // 3. Calculate the new start date based on the end date and time range
    // Use the provided end date or default to today
    const endDate = currentEndDate || new Date();
    
    // For 1-day range, both start and end date are the same
    if (isOneDay) {
      setSelectedDate(endDate);
      setEndDate(endDate);
      setUseCustomEndDate(false);
    } else {
      // For multi-day range, calculate the start date by subtracting days from the end date
      const daysToSubtract = newTimeRange - 1; // Subtract days (range - 1) to get the start date
      const newStartDate = subDays(endDate, daysToSubtract);
      
      // Set the new dates
      setSelectedDate(newStartDate);
      setEndDate(endDate);
      
      // 4. Show both date pickers for multi-day ranges
      setUseCustomEndDate(true);
    }
  };

  const handleDayRangeTypeChange = (event: SelectChangeEvent<DayRangeType>) => {
    const newType = event.target.value as DayRangeType;
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