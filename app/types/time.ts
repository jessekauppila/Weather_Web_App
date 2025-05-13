export enum DayRangeType {
  MIDNIGHT = 'MIDNIGHT',
  CURRENT = 'CURRENT',
  CUSTOM = 'CUSTOM'
}

export interface TimeRangeData {
  start_time_pdt: string;
  end_time_pdt: string;
} 