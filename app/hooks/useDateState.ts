import { useState } from 'react';
import moment from 'moment-timezone';
import { addDays, subDays } from 'date-fns';

/**
 * Custom hook for managing date state in the application
 * Note: While we set dates to the start of day here, 
 * the actual time of day for multi-day ranges (3 PM cutoff)
 * is handled by calculateTimeRange in useTimeRange.ts
 */
export function useDateState() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [useCustomEndDate, setUseCustomEndDate] = useState(false);

  const handlePrevDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    
    // When using the prev/next buttons, we want to keep the end date in sync
    // with the selected date for single day view
    setEndDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
      
      // When using the prev/next buttons, we want to keep the end date in sync
      // with the selected date for single day view
      setEndDate(newDate);
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // This sets the date to start of day for UI consistency
    // Note: The actual time used for multi-day ranges (starting at 3 PM)
    // is applied in calculateTimeRange within useTimeRange.ts
    const newDate = moment(event.target.value)
      .tz('America/Los_Angeles')
      .startOf('day')
      .toDate();
    
    // Update the selected date
    setSelectedDate(newDate);
    
    // Also update the end date to match the selected date
    // This ensures that for single day view, we're looking at the selected date
    // For multi-day views, the timeRangeData calculation will handle going 
    // back the correct number of days from this end date
    setEndDate(newDate);
  };

  return {
    selectedDate,
    setSelectedDate,
    endDate,
    setEndDate,
    useCustomEndDate,
    setUseCustomEndDate,
    handlePrevDay,
    handleNextDay,
    handleDateChange
  };
} 