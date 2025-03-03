import { useState } from 'react';
import moment from 'moment-timezone';
import { DayRangeType } from '../types';

export function useTimeRange() {
  const currentMoment = moment().tz('America/Los_Angeles');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState(1);
  const [dayRangeType, setDayRangeType] = useState<DayRangeType>(DayRangeType.CURRENT);
  const [customTime, setCustomTime] = useState(currentMoment.format('HH:mm'));

  const calculateTimeRange = (date: Date, type: DayRangeType) => {
    const endMoment = moment(date).tz('America/Los_Angeles');
    const currentMoment = moment().tz('America/Los_Angeles');
    const currentHour = currentMoment.hour();
    const currentMinute = currentMoment.minute();

    switch (type) {
      case DayRangeType.MIDNIGHT:
        const midnightResult = {
          start: endMoment.clone().startOf('day'),
          end: endMoment.clone().startOf('day').add(24 * timeRange, 'hours'),
          startHour: 0,
          endHour: 24
        };
        return midnightResult;
        
      case DayRangeType.CURRENT:
        const currentResult = {
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
        return currentResult;

      case DayRangeType.CUSTOM:
        const [hours, minutes] = customTime.split(':').map(Number);
        return {
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
    
      default:
        return {
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
  };

  return {
    selectedDate,
    setSelectedDate,
    timeRange,
    setTimeRange,
    dayRangeType,
    setDayRangeType,
    customTime,
    setCustomTime,
    calculateTimeRange
  };
}