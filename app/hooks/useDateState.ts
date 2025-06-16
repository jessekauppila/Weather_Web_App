import { useState, useCallback } from 'react';
import moment from 'moment-timezone';
import { addDays, subDays, format } from 'date-fns';

/**
 * Custom hook for managing date state in the application
 * Note: While we set dates to the start of day here, 
 * the actual time of day for multi-day ranges (3 PM cutoff)
 * is handled by calculateTimeRange in useTimeRange.ts
 */
export function useDateState(onDateChange?: (newDate: Date) => void) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [useCustomEndDate, setUseCustomEndDate] = useState(false);

  // Wrapper for setSelectedDate that adds logging
  const loggedSetSelectedDate = useCallback((newDate: Date) => {
    //console.log('📅 DATE STATE: Selected date changed to', moment(newDate).format('YYYY-MM-DD'));
    setSelectedDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  }, [setSelectedDate, onDateChange]);

  // Wrapper for setEndDate that adds logging
  const loggedSetEndDate = useCallback((newDate: Date) => {
   // console.log('📅 DATE STATE: End date changed to', moment(newDate).format('YYYY-MM-DD'));
    setEndDate(newDate);
  }, [setEndDate]);

  const handlePrevDay = useCallback(() => {
    const newDate = subDays(selectedDate, 1);
    console.log('📅 DATE STATE: Moving to previous day', moment(newDate).format('YYYY-MM-DD'));
    loggedSetSelectedDate(newDate);
    loggedSetEndDate(newDate);
  }, [selectedDate, loggedSetSelectedDate, loggedSetEndDate]);

  const handleNextDay = useCallback(() => {
    const newDate = addDays(selectedDate, 1);
    if (newDate <= new Date()) {
      //console.log('📅 DATE STATE: Moving to next day', moment(newDate).format('YYYY-MM-DD'));
      loggedSetSelectedDate(newDate);
      loggedSetEndDate(newDate);
    } else {
      console.log('📅 DATE STATE: Cannot move beyond current date');
    }
  }, [selectedDate, loggedSetSelectedDate, loggedSetEndDate]);

  const handleDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    console.log('📅 DATE CONTROLS: Start date changed', {
      value: event.target.value,
      parsed: format(newDate, 'yyyy-MM-dd')
    });
    setSelectedDate(newDate);
  }, [setSelectedDate]);

  const handleEndDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    console.log('📅 DATE CONTROLS: End date changed', {
      value: event.target.value,
      parsed: format(newDate, 'yyyy-MM-dd')
    });
    setEndDate(newDate);
  }, [setEndDate]);

  return {
    selectedDate,
    setSelectedDate: loggedSetSelectedDate,
    endDate,
    setEndDate: loggedSetEndDate,
    useCustomEndDate,
    setUseCustomEndDate,
    handlePrevDay,
    handleNextDay,
    handleDateChange,
    handleEndDateChange
  };
} 