//this is the drop down menu for the time range on the home page

//was in components folder...

import { DayRangeType, DAY_RANGE_OPTIONS } from '../types';

interface DayRangeSelectProps {
  value: DayRangeType;
  onChange: (value: DayRangeType) => void;
}

export function DayRangeSelect({ value, onChange }: DayRangeSelectProps) {
  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value as DayRangeType)}
      className="neumorphic-button dropdown h-10"
    >
      {DAY_RANGE_OPTIONS.map(option => (
        <option key={option.id} value={option.id}>
          {option.label} {option.description}
        </option>
      ))}
    </select>
  );
}