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
 */
export function useWeatherControls(
  setSelectedDate: (date: Date) => void,
  setEndDate: (date: Date) => void,
  setUseCustomEndDate: (use: boolean) => void,
  setIsOneDay: (isOne: boolean) => void,
  setTimeRange: (range: number) => void,
  stations: any[],
  handleRefresh: (isMetric?: boolean) => Promise<void>
) {
  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    console.log('Time range changed:', value);
    
    if (value === 'custom') {
      setUseCustomEndDate(true);
      setIsOneDay(false);
      return;
    }
    
    setUseCustomEndDate(false);
    setTimeRange(Number(value));
    
    const newEndDate = new Date();
    let newStartDate: Date;
    
    switch (value) {
      case '1':
        newStartDate = subDays(newEndDate, 1);
        setIsOneDay(true);
        break;
      case '3':
        newStartDate = subDays(newEndDate, 3);
        setIsOneDay(false);
        break;
      case '7':
        newStartDate = subDays(newEndDate, 7);
        setIsOneDay(false);
        break;
      case '14':
        newStartDate = subDays(newEndDate, 14);
        setIsOneDay(false);
        break;
      case '30':
        newStartDate = subDays(newEndDate, 30);
        setIsOneDay(false);
        break;
      default:
        newStartDate = subDays(newEndDate, 1);
        setIsOneDay(true);
    }

    setSelectedDate(newStartDate);
    setEndDate(newEndDate);
    setUseCustomEndDate(true);
  };

  const handleDayRangeTypeChange = (event: SelectChangeEvent<DayRangeType>) => {
    const newType = event.target.value as DayRangeType;
    return newType;
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = moment(event.target.value)
      .tz('America/Los_Angeles')
      .startOf('day')
      .toDate();
    setEndDate(newDate);
  };

  return {
    handleTimeRangeChange,
    handleDayRangeTypeChange,
    handleEndDateChange,
  };
} 