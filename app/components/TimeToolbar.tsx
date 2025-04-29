import { useState, useCallback } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { format } from 'date-fns';
import { DayRangeType } from '../types';

import { TimeRangeSelector } from './TimeToolbar/TimeRangeSelector';
import { DateControls } from './TimeToolbar/DateControls';
import { CutoffControls } from './TimeToolbar/CutoffControls';
import { DataInfo } from './TimeToolbar/DataInfo';
import { UnitsSwitch } from './TimeToolbar/UnitsSwitch';
import { StationSelector } from './TimeToolbar/StationSelector';

interface TimeToolbarProps {
  calculateCurrentTimeRange: () => string;
  handleTimeRangeChange: (event: SelectChangeEvent<string>) => void;
  isOneDay: boolean;
  handlePrevDay: () => void;
  handleNextDay: () => void;
  selectedDate: Date;
  handleDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  endDate: Date;
  handleEndDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  dayRangeType: DayRangeType;
  handleDayRangeTypeChange: (event: SelectChangeEvent<DayRangeType>) => void;
  customTime: string;
  setCustomTime: (value: string) => void;
  selectedStation: string;
  stations: Array<{ id: string; name: string }>;
  handleStationChange: (event: SelectChangeEvent<string>) => void;
  stationIds: string[];
  filteredObservationsDataHour?: {
    data: any[];
    title: string;
  } | null;
  onRefresh: (newIsMetric?: boolean) => Promise<void>;
  tableMode: 'summary' | 'daily';
  startHour: number;
  endHour: number;
  setObservationsDataDay: (data: any) => void;
  setObservationsDataHour: (data: any) => void;
  setFilteredObservationsDataHour: (data: any) => void;
  setIsLoading: (loading: boolean) => void;
  isMetric: boolean;
  setIsMetric: (isMetric: boolean) => void;
  useCustomEndDate: boolean;
}

export default function TimeToolbar({
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
  filteredObservationsDataHour,
  onRefresh,
  isMetric,
  setIsMetric,
  useCustomEndDate
}: TimeToolbarProps) {
  const [dataAnchorEl, setDataAnchorEl] = useState<null | HTMLElement>(null);
  const [cutOffAnchorEl, setCutOffAnchorEl] = useState<null | HTMLElement>(null);
  const [unitsAnchorEl, setUnitsAnchorEl] = useState<null | HTMLElement>(null);

  const handleCustomTimeButtonClick = async () => {
    await handleDayRangeTypeChange({ 
      target: { value: DayRangeType.CUSTOM } 
    } as SelectChangeEvent<DayRangeType>);
    
    handleTimeRangeChange({ 
      target: { value: calculateCurrentTimeRange() } 
    } as SelectChangeEvent<string>);
  };

  const memoizedHandleCustomTime = useCallback(handleCustomTimeButtonClick, [handleDayRangeTypeChange, handleTimeRangeChange, calculateCurrentTimeRange]);

  const handleUnitsPopupButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setUnitsAnchorEl(event.currentTarget);
  };

  const handleDataPopupButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setDataAnchorEl(event.currentTarget);
  };

  const handleCutOffPopupButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setCutOffAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setDataAnchorEl(null);
    setCutOffAnchorEl(null);
    setUnitsAnchorEl(null);
  };

  const handleRefreshButtonClick = async () => {
    await onRefresh();
    await handleDateChange({ 
      target: { value: format(selectedDate, 'yyyy-MM-dd') } 
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="app-toolbar flex flex-col space-y-2 p-2 sm:p-4 w-full max-w-[1200px]">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 w-full">
          <TimeRangeSelector
            calculateCurrentTimeRange={calculateCurrentTimeRange}
            handleTimeRangeChange={handleTimeRangeChange}
          />
          
          <DateControls
            selectedDate={selectedDate}
            endDate={endDate}
            handleDateChange={handleDateChange}
            handleEndDateChange={handleEndDateChange}
            handlePrevDay={handlePrevDay}
            handleNextDay={handleNextDay}
            useCustomEndDate={useCustomEndDate}
          />
          
          <CutoffControls
            dayRangeType={dayRangeType}
            handleDayRangeTypeChange={handleDayRangeTypeChange}
            customTime={customTime}
            setCustomTime={setCustomTime}
            handleCustomTimeButtonClick={memoizedHandleCustomTime}
            anchorEl={cutOffAnchorEl}
            handleClose={handleClose}
            handleCutOffPopupButtonClick={handleCutOffPopupButtonClick}
          />

          <DataInfo
            filteredObservationsDataHour={filteredObservationsDataHour}
            handleRefreshButtonClick={handleRefreshButtonClick}
            anchorEl={dataAnchorEl}
            handleClose={handleClose}
            handleDataPopupButtonClick={handleDataPopupButtonClick}
          />

          <UnitsSwitch
            isMetric={isMetric}
            onRefresh={onRefresh}
            setIsMetric={setIsMetric}
            anchorEl={unitsAnchorEl}
            handleClose={handleClose}
            handleUnitsPopupButtonClick={handleUnitsPopupButtonClick}
          />
        </div>

        {/* <div className="w-full max-w-[800px] mx-auto">
          <StationSelector
            selectedStation={selectedStation}
            stations={stations}
            handleStationChange={handleStationChange}
          />
        </div> */}
      </div>
    </div>
  );
} 