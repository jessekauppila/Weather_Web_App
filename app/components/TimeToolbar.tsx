import { useState, useCallback, useEffect, useRef } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { format } from 'date-fns';
import { DayRangeType } from '../types';
import { Typography } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Map_BlockProperties } from '../map/map';

import { TimeRangeSelector } from './TimeToolbar/TimeRangeSelector';
import { DateControls } from './TimeToolbar/DateControls';
import { CutoffControls } from './TimeToolbar/CutoffControls';
import { DataInfo } from './TimeToolbar/DataInfo';
import { UnitsSwitch } from './TimeToolbar/UnitsSwitch';
import { StationSelector } from './TimeToolbar/StationSelector';
import useStationDrawer from '@/app/hooks/useStationDrawer';
import { TimeBrush } from './TimeToolbar/TimeBrush';

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
  isOpen: boolean;
  onToggle: () => void;
  mapData?: {
    stationData: {
      features: Array<{
        properties: Map_BlockProperties;
      }>;
    };
  };
  selectedStationId: string | null;
  onStationChange: (id: string) => void;
  selectedStationIds: string[];
  onStationSelectionChange: (stationIds: string[]) => void;
  handleMultiStationSelect: (stations: any[]) => void;
  timeRangeData?: any[];
}

const TimeToolbar: React.FC<TimeToolbarProps> = ({
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
  useCustomEndDate,
  isOpen,
  onToggle,
  mapData,
  selectedStationId,
  onStationChange,
  selectedStationIds,
  onStationSelectionChange,
  handleMultiStationSelect,
  timeRangeData,
}) => {
  const [dataAnchorEl, setDataAnchorEl] = useState<null | HTMLElement>(null);
  const [cutOffAnchorEl, setCutOffAnchorEl] = useState<null | HTMLElement>(null);
  const [unitsAnchorEl, setUnitsAnchorEl] = useState<null | HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [brushDimensions, setBrushDimensions] = useState({ width: 0, height: 80 });
  const brushContainerRef = useRef<HTMLDivElement>(null);

  const stationDrawer = useStationDrawer();

  
  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update brush dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (brushContainerRef.current) {
        setBrushDimensions({
          width: brushContainerRef.current.offsetWidth,
          height: 80, // Set height back to 80
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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

  // Handle brush changes with validation
  const handleBrushChange = useCallback((start: Date, end: Date) => {
    // Validate dates before updating
    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      try {
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        
        handleDateChange({ 
          target: { value: startStr } 
        } as React.ChangeEvent<HTMLInputElement>);
        
        handleEndDateChange({ 
          target: { value: endStr } 
        } as React.ChangeEvent<HTMLInputElement>);
      } catch (error) {
        console.error('Error formatting dates:', error);
      }
    }
  }, [handleDateChange, handleEndDateChange]);

  return (
    <div className={`time-toolbar ${isOpen ? 'open' : ''}`}>
      <div 
        className="time-toolbar-handle"
        onClick={onToggle}
      >
        {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
      </div>

      <div className="time-toolbar-content">
        {/* Time brush container */}
        {/* <div ref={brushContainerRef} className="w-full time-brush-container">
          <TimeBrush
            width={brushDimensions.width}
            height={brushDimensions.height}
            selectedDate={selectedDate}
            endDate={endDate}
            onBrushChange={handleBrushChange}
            timeRangeData={timeRangeData}
          />
        </div> */}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 w-full">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
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
          </div>

              {/* <CutoffControls
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
          /> */}
          
        {/* </div>

        <div className="w-full mt-4"> */}


          <div className="w-full sm:flex-grow sm:max-w-[400px]">
            <StationSelector
              stations={stations}
              handleStationSelect={handleMultiStationSelect}
              selectedStationIds={selectedStationIds}
              onStationSelectionChange={onStationSelectionChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeToolbar; 