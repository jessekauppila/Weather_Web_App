import { format } from 'date-fns';
import { DayRangeType } from '../types';

interface DateControlsProps {
  isOneDay: boolean;
  selectedDate: Date;
  endDate: Date;
  dayRangeType: DayRangeType;
  customTime: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  onDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEndDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDayRangeTypeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onCustomTimeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const DateControls = ({
  isOneDay,
  selectedDate,
  endDate,
  dayRangeType,
  customTime,
  onPrevDay,
  onNextDay,
  onDateChange,
  onEndDateChange,
  onDayRangeTypeChange,
  onCustomTimeChange
}: DateControlsProps) => {
  return (
    <div className="flex flex-wrap gap-2 items-center justify-center w-full max-w-[400px]">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {isOneDay && (
          <button onClick={onPrevDay} className="neumorphic-button nav-button h-10 w-8 text-sm">
            &lt;
          </button>
        )}
        
        <input
          type="date"
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={onDateChange}
          className="neumorphic-button date-picker h-10 flex-grow min-w-[120px] text-sm"
        />
        
        {isOneDay && (
          <button onClick={onNextDay} className="neumorphic-button nav-button h-10 w-8 text-sm">
            &gt;
          </button>
        )}
      </div>

      {!isOneDay && (
        <input
          type="date"
          value={format(endDate, 'yyyy-MM-dd')}
          onChange={onEndDateChange}
          className="neumorphic-button date-picker h-10 w-full sm:w-auto min-w-[120px] text-sm"
          min={format(selectedDate, 'yyyy-MM-dd')}
        />
      )}

      <div className="relative ml-auto">
        <details className="w-8">
          <summary className="neumorphic-button h-10 w-8 flex items-center justify-center cursor-pointer">
            <span className="transform transition-transform duration-200 details-caret text-sm">▼</span>
          </summary>
          <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 bg-[cornflowerblue] p-4 rounded-lg shadow-lg space-y-4 w-[250px] max-w-[90vw] z-50">
            <select
              value={dayRangeType}
              onChange={onDayRangeTypeChange}
              className="neumorphic-button dropdown h-10 w-full text-sm"
            >
              <option value={DayRangeType.MIDNIGHT}>Range: Midnight to Midnight</option>
              <option value={DayRangeType.CURRENT}>Range: Rolling 24 hours</option>
              <option value={DayRangeType.CUSTOM}>Range: Custom</option>
            </select>

            {dayRangeType === DayRangeType.CUSTOM && (
              <input
                type="time"
                value={customTime}
                onChange={onCustomTimeChange}
                className="neumorphic-button time-picker h-10 w-full text-sm"
              />
            )}
          </div>
        </details>
      </div>
    </div>
  );
};

export default DateControls;
