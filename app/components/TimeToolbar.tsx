import { useState, useCallback, useEffect, useMemo } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { format } from 'date-fns';
import { DayRangeType } from '../types';
import { Typography } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Map_BlockProperties, WeatherStation } from '../map/map';

import { TimeRangeSelector } from './TimeToolbar/TimeRangeSelector';
import { DateControls } from './TimeToolbar/DateControls';
import { CutoffControls } from './TimeToolbar/CutoffControls';
import { DataInfo } from './TimeToolbar/DataInfo';
import { UnitsSwitch } from './TimeToolbar/UnitsSwitch';
import { StationSelector } from './TimeToolbar/StationSelector';
import useStationDrawer from '@/app/hooks/useStationDrawer';
import { useMapData } from '@/app/data/map/MapDataContext';

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
  selectedStation: WeatherStation | null;
  handleStationChange: (event: SelectChangeEvent<string>) => void;
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
  handleStationChange,
  filteredObservationsDataHour,
  onRefresh,
  isMetric,
  setIsMetric,
  useCustomEndDate,
  isOpen,
  onToggle
}) => {
  const [dataAnchorEl, setDataAnchorEl] = useState<null | HTMLElement>(null);
  const [cutOffAnchorEl, setCutOffAnchorEl] = useState<null | HTMLElement>(null);
  const [unitsAnchorEl, setUnitsAnchorEl] = useState<null | HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

     const { mapData, isLoading } = useMapData();
     console.log('TimeToolbar - mapData from useMapData:', {
       hasMapData: !!mapData,
       hasStationData: !!mapData?.stationData,
       featuresLength: mapData?.stationData?.features?.length,
       features: mapData?.stationData?.features
     });

  const stationDrawer = useStationDrawer({ mapData });

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

  // Add effect to track mapData changes
  useEffect(() => {
    console.log('TimeToolbar - mapData changed:', {
      hasMapData: !!mapData,
      hasStationData: !!mapData?.stationData,
      featuresLength: mapData?.stationData?.features?.length,
      features: mapData?.stationData?.features
    });
  }, [mapData]);

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
    <div className={`time-toolbar ${isOpen ? 'open' : ''}`}>
      <div 
        className="time-toolbar-handle"
        onClick={onToggle}
      >
        {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
      </div>

      <div className="time-toolbar-content">
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
        </div>

        <div className="w-full mt-4">
          <StationSelector
            selectedStation={selectedStation}
            handleStationSelect={(station) => {
              console.log('TimeToolbar - Station selected:', {
                station,
                hasMapData: !!mapData,
                hasStationData: !!mapData?.stationData
              });
              if (station) {
                stationDrawer.handleStationSelect(station);
              } else {
                stationDrawer.closeDrawer();
              }
            }}
            mapData={mapData}
            isLoading={isLoading}
          />

          {/* <UnitsSwitch
            isMetric={isMetric}
            setIsMetric={setIsMetric}
            onRefresh={onRefresh}
            anchorEl={unitsAnchorEl}
            handleClose={handleClose}
            handleUnitsPopupButtonClick={handleUnitsPopupButtonClick}
          />

          <DataInfo
            filteredObservationsDataHour={filteredObservationsDataHour}
            handleRefreshButtonClick={handleRefreshButtonClick}
            anchorEl={dataAnchorEl}
            handleClose={handleClose}
            handleDataPopupButtonClick={handleDataPopupButtonClick}
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
          /> */}
        </div>
      </div>
    </div>
  );
};

export default TimeToolbar; 