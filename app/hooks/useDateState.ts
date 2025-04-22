import { useState } from 'react';
import moment from 'moment-timezone';
import { addDays, subDays } from 'date-fns';

/**
 * Custom hook for managing date state in the application
 * Note: While we set dates to the start of day here, 
 * the actual time of day for multi-day ranges (3 PM cutoff)
 * is handled by calculateTimeRange in useTimeRange.ts
 */
export function useDateState(onDateChange?: (date: Date) => void) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [useCustomEndDate, setUseCustomEndDate] = useState(false);

  // Create enhanced setters that log changes
  const setSelectedDateWithLog = (date: Date) => {
    console.log('📅 setSelectedDate called with:', date.toISOString());
    setSelectedDate(date);
  };

  const setEndDateWithLog = (date: Date) => {
    console.log('📅 setEndDate called with:', date.toISOString());
    setEndDate(date);
  };

  const handlePrevDay = () => {
    console.log('⬅️ handlePrevDay called from:', selectedDate.toISOString());
    const newDate = subDays(selectedDate, 1);
    console.log('⬅️ New date will be:', newDate.toISOString());
    
    setSelectedDateWithLog(newDate);
    
    // When using the prev/next buttons, we want to keep the end date in sync
    // with the selected date for single day view
    setEndDateWithLog(newDate);
    
    // Call the callback if provided
    if (onDateChange) {
      console.log('⬅️ Calling onDateChange callback with:', newDate.toISOString());
      onDateChange(newDate);
    }
  };

  const handleNextDay = () => {
    console.log('➡️ handleNextDay called from:', selectedDate.toISOString());
    const newDate = addDays(selectedDate, 1);
    console.log('➡️ New date would be:', newDate.toISOString());
    
    if (newDate <= new Date()) {
      setSelectedDateWithLog(newDate);
      
      // When using the prev/next buttons, we want to keep the end date in sync
      // with the selected date for single day view
      setEndDateWithLog(newDate);
      
      // Call the callback if provided
      if (onDateChange) {
        console.log('➡️ Calling onDateChange callback with:', newDate.toISOString());
        onDateChange(newDate);
      }
    } else {
      console.log('➡️ Not updating date - would be in future');
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📆 handleDateChange called with value:', event.target.value);
    
    // This sets the date to start of day for UI consistency
    // Note: The actual time used for multi-day ranges (starting at 3 PM)
    // is applied in calculateTimeRange within useTimeRange.ts
    const newDate = moment(event.target.value)
      .tz('America/Los_Angeles')
      .startOf('day')
      .toDate();
    
    console.log('📆 Converted to:', newDate.toISOString());
    
    // Update the selected date
    setSelectedDateWithLog(newDate);
    
    // Also update the end date to match the selected date
    // This ensures that for single day view, we're looking at the selected date
    // For multi-day views, the timeRangeData calculation will handle going 
    // back the correct number of days from this end date
    setEndDateWithLog(newDate);
    
    // Call the callback if provided
    if (onDateChange) {
      console.log('📆 Calling onDateChange callback with:', newDate.toISOString());
      onDateChange(newDate);
    }
  };

  return {
    selectedDate,
    setSelectedDate: setSelectedDateWithLog,
    endDate,
    setEndDate: setEndDateWithLog,
    useCustomEndDate,
    setUseCustomEndDate,
    handlePrevDay,
    handleNextDay,
    handleDateChange
  };
} 