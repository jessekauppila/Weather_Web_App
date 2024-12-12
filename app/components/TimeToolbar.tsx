import { format } from 'date-fns';
import { DayRangeType } from '../types';

interface TimeToolbarProps {
  calculateCurrentTimeRange: () => string;
  handleTimeRangeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  isOneDay: boolean;
  handlePrevDay: () => void;
  handleNextDay: () => void;
  selectedDate: Date;
  handleDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  endDate: Date;
  handleEndDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  dayRangeType: DayRangeType;
  handleDayRangeTypeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  customTime: string;
  setCustomTime: (value: string) => void;
  selectedStation: string;
  stations: Array<{ id: string; name: string }>;
  handleStationChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  stationIds: string[];
}

const TimeToolbar = ({
  calculateCurrentTimeRange,
  handleTimeRangeChange,
  isOneDay,
  handlePrevDay,
  handleNextDay,
  selectedDate,
  handleDateChange,
  endDate,
  handleEndDateChange,
  dayRangeType,
  handleDayRangeTypeChange,
  customTime,
  setCustomTime,
  selectedStation,
  stations,
  handleStationChange,
  stationIds,
}: TimeToolbarProps) => {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col space-y-4 bg-[cornflowerblue] p-2 sm:p-4 rounded-xl shadow-md w-full">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 w-full">
          {/* Time range selector */}
          <div className="w-full sm:w-auto">
            <select
              value={calculateCurrentTimeRange()}
              onChange={handleTimeRangeChange}
              className="neumorphic-button dropdown h-10 w-full min-w-[140px]"
            >
              <option value="1">1 Day</option>
              <option value="3">Past 3 Days</option>
              <option value="7">Past 7 Days</option>
              <option value="14">Past 14 Days</option>
              <option value="30">Past 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Date controls container */}
          <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-nowrap min-w-[280px]">
              {isOneDay && (
                <button 
                  onClick={handlePrevDay} 
                  className="neumorphic-button nav-button h-10 w-10 flex-shrink-0"
                >
                  &lt;
                </button>
              )}
              
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                className="neumorphic-button date-picker h-10 flex-grow"
              />
              
              {isOneDay && (
                <button 
                  onClick={handleNextDay} 
                  className="neumorphic-button nav-button h-10 w-10 flex-shrink-0"
                >
                  &gt;
                </button>
              )}
            </div>

            {!isOneDay && (
              <input
                type="date"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={handleEndDateChange}
                className="neumorphic-button date-picker h-10 flex-grow"
                min={format(selectedDate, 'yyyy-MM-dd')}
              />
            )}

            {/* Settings dropdown */}
            <div className="relative flex-shrink-0">
              <details className="w-10">
                <summary className="neumorphic-button h-10 w-10 flex items-center justify-center cursor-pointer">
                  <span className="transform transition-transform duration-200 details-caret">▼</span>
                </summary>
                <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 bg-[cornflowerblue] p-4 rounded-lg shadow-lg space-y-4 w-[300px] max-w-[90vw] z-50">
                  <select
                    value={dayRangeType}
                    onChange={handleDayRangeTypeChange}
                    className="neumorphic-button dropdown h-10 w-full"
                  >
                    <option value={DayRangeType.MIDNIGHT}>Range: Midnight to Midnight</option>
                    <option value={DayRangeType.CURRENT}>Range: Rolling 24 hours</option>
                    <option value={DayRangeType.CUSTOM}>Range: Custom</option>
                  </select>

                  {dayRangeType === DayRangeType.CUSTOM && (
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="neumorphic-button time-picker h-10 w-full"
                    />
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Station selector */}
        {(selectedStation || stationIds.length === 1) && (
          <div className="flex justify-center w-full">
            <select
              value={selectedStation}
              onChange={handleStationChange}
              className="neumorphic-button dropdown h-10 w-full sm:w-auto"
            >
              <option value="">All Stations</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeToolbar;