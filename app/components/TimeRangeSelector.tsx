interface TimeRangeSelectorProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const TimeRangeSelector = ({ value, onChange }: TimeRangeSelectorProps) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className="neumorphic-button dropdown h-10 w-[140px] text-sm"
    >
      <option value="1">1 Day</option>
      <option value="3">Past 3 Days</option>
      <option value="7">Past 7 Days</option>
      <option value="14">Past 14 Days</option>
      <option value="30">Past 30 Days</option>
      <option value="custom">Custom Range</option>
    </select>
  );
};

export default TimeRangeSelector;