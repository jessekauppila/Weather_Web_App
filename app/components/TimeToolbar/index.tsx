import React, { useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { DateControls } from './DateControls';
import { TimeRangeSelector } from './TimeRangeSelector';
import { UnitsSwitch as UnitsSwitchComponent } from './UnitsSwitch';
import TableModeSwitch from './TableModeSwitch';
import TimeModeSwitch from './TimeModeSwitch';

// Types
export type TimeMode = 'real-time' | 'historical';
export type DayRangeType = '1d' | '3d' | '7d' | '14d' | '30d' | 'custom';
export interface StationObject {
  id: string;
  name: string;
  [key: string]: any;
}

export interface TimeToolbarProps {
  selectedStation?: StationObject | null;
  onStationSelect?: (station: StationObject | null) => void;
  onSliderChange?: (newValue: number[]) => void;
  onRangeTypeChange?: (dayRange: DayRangeType) => void;
  onTimeRangeCalculate?: (start: Date, end: Date) => void;
  onRefreshClick?: () => void;
  onDateChange?: (date: Date) => void;
  onTimeModeChange?: (mode: TimeMode) => void;
  onTableModeChange?: (mode: 'summary' | 'daily') => void;
  onUnitsToggle?: (isMetric: boolean) => void;
  customTime?: string;
  onCustomTimeChange?: (time: string) => void;
  dayRangeType?: DayRangeType;
  isMetric?: boolean;
  hideStationSelect?: boolean;
  hideUnitsToggle?: boolean;
  mobile?: boolean;
  tableMode?: 'summary' | 'daily';
}

export default function TimeToolbar({
  selectedStation,
  onStationSelect,
  onSliderChange,
  onRangeTypeChange,
  onTimeRangeCalculate,
  onRefreshClick,
  onDateChange,
  onTimeModeChange,
  onTableModeChange,
  onUnitsToggle,
  customTime,
  onCustomTimeChange,
  dayRangeType = '1d',
  isMetric = false,
  hideStationSelect = false,
  hideUnitsToggle = false,
  mobile = false,
  tableMode = 'summary',
}: TimeToolbarProps) {
  // handle table mode change
  const handleTableModeChange = (mode: 'summary' | 'daily') => {
    if (onTableModeChange) {
      onTableModeChange(mode);
    }
  };
  
  return (
    <div className="flex flex-col items-center w-full">
      <div className="app-toolbar flex flex-col space-y-2 p-2 sm:p-4 w-full max-w-[1200px]">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 w-full">
          <TimeRangeSelector
            calculateCurrentTimeRange={() => "Custom Range"}
            handleTimeRangeChange={() => {}}
          />
          
          <DateControls
            selectedDate={new Date()}
            endDate={new Date()}
            handleDateChange={() => {}}
            handleEndDateChange={() => {}}
            handlePrevDay={() => {}}
            handleNextDay={() => {}}
            useCustomEndDate={false}
          />
          
          {/* RefreshButton - implement if needed */}
          {onRefreshClick && (
            <button 
              onClick={onRefreshClick}
              className="app-button px-2 py-1 text-sm bg-blue-500 text-white rounded"
            >
              Refresh
            </button>
          )}
          
          {/* TableModeSwitch */}
          {onTableModeChange && (
            <TableModeSwitch
              tableMode={tableMode}
              onTableModeChange={handleTableModeChange}
            />
          )}
          
          {/* TimeModeSwitch if onTimeModeChange is provided */}
          {onTimeModeChange && (
            <TimeModeSwitch
              timeMode="real-time"
              onTimeModeChange={(mode) => onTimeModeChange(mode)}
            />
          )}
          
          {/* UnitsSwitch if not hidden */}
          {!hideUnitsToggle && onUnitsToggle && (
            <div className="flex items-center">
              <label className="text-white text-sm mr-1">Units:</label>
              <button 
                onClick={() => onUnitsToggle(!isMetric)}
                className="app-button px-2 py-1 text-sm bg-blue-500 text-white rounded"
              >
                {isMetric ? 'Metric' : 'Imperial'}
              </button>
            </div>
          )}
        </div>
        
        {/* StationSelector if not hidden */}
        {!hideStationSelect && onStationSelect && (
          <div className="w-full max-w-[800px] mx-auto mt-2">
            <div className="app-select-container">
              <select
                value={selectedStation?.id || ""}
                onChange={(e) => {
                  // Simple implementation - can be expanded later
                  if (onStationSelect) {
                    if (e.target.value) {
                      onStationSelect({ id: e.target.value, name: e.target.value });
                    } else {
                      onStationSelect(null);
                    }
                  }
                }}
                className="app-select w-full p-2 bg-transparent text-white border border-gray-600 rounded"
              >
                <option value="">Select a station...</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 