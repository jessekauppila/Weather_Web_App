export type Column =
  | {
      key?: string;
      displayName?: string;
    }
  | string;

export enum DayRangeType {
  MIDNIGHT = 'MIDNIGHT',
  CURRENT = 'CURRENT',
  FORECAST = 'FORECAST'
}

export interface DayRangeOption {
  id: DayRangeType;
  label: string;
  description: string;
}

export const DAY_RANGE_OPTIONS: DayRangeOption[] = [
  {
    id: DayRangeType.MIDNIGHT,
    label: 'Daily: Midnight to Midnight',
    description: '(default)'
  },
  {
    id: DayRangeType.CURRENT,
    label: 'Daily: Current Time to Current Time',
    description: '(24h rolling)'
  },
  {
    id: DayRangeType.FORECAST,
    label: 'Daily: 13Z - 12Z',
    description: '(forecasters)'
  }
];
