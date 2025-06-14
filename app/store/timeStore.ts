import { create } from 'zustand';
import { DayRangeType } from '../types';

interface TimeState {
  selectedDate: Date;
  endDate: Date;
  timeRange: number;
  dayRangeType: DayRangeType;
  customTime: string;
  setTimeRange: (start: Date, end: Date) => void;
  setDayRangeType: (type: DayRangeType) => void;
  setCustomTime: (time: string) => void;
}

export const useTimeStore = create<TimeState>((set) => ({
  selectedDate: new Date(),
  endDate: new Date(),
  timeRange: 1,
  dayRangeType: DayRangeType.CURRENT,
  customTime: '',
  setTimeRange: (start, end) => set({ selectedDate: start, endDate: end }),
  setDayRangeType: (type) => set({ dayRangeType: type }),
  setCustomTime: (time) => set({ customTime: time }),
})); 