export type Column =
  | {
      key?: string;
      displayName?: string;
    }
  | string;

export enum DayRangeType {
  MIDNIGHT = 'MIDNIGHT',
  CURRENT = 'CURRENT',
  CUSTOM = 'CUSTOM'
}

export interface DayRangeOption {
  id: DayRangeType;
  label: string;
  description: string;
}

export const DAY_RANGE_OPTIONS: DayRangeOption[] = [
  {
    id: DayRangeType.MIDNIGHT,
    label: 'Range: Midnight to Midnight',
    description: '(default)'
  },
  {
    id: DayRangeType.CURRENT,
    label: 'Range: 24hr Rolling',
    description: '(24h rolling)'
  },
  {
    id: DayRangeType.CUSTOM,
    label: 'Range: Custom',
    description: '(custom)'
  }
];

export interface WxTableOptions {
  mode: 'summary' | 'daily';
  startHour: number;
  endHour: number;
  dayRangeType: DayRangeType;
  start: string;
  end: string;
}
