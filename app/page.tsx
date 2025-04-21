'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
} from 'react';

import TimeToolbar from './components/TimeToolbar';
// Comment out imports that cause errors and aren't used
// import { WeatherDisplay } from '@/app/components/wxTablesGraphsOrchestrator';
// import { LoadingWrapper } from '@/app/components/LoadingWrapper';
// import RegionTables from '@/app/components/RegionTables';
// import { RegionsContainer } from '@/app/components/RegionsContainer';
import LayerControls from './components/LayerToolbar';

import moment from 'moment-timezone';

import { useTimeRange } from '@/app/hooks/useTimeRange';
import { useWeatherControls } from '@/app/hooks/useWeatherControls';
import { useWeatherData } from '@/app/hooks/useWeatherData';
import { useStations } from '@/app/hooks/useStations';
import { useViewState } from '@/app/hooks/useViewState';
import { useDateState } from '@/app/hooks/useDateState';
import { useDropdown } from '@/app/hooks/useDropdown';
import { Analytics } from "@vercel/analytics/react"

import MapComponent from './components/MapComponent';


interface Station {
  id: string;
  name: string;
}

interface StationCardProps {
  station: {
    Station: string;
    'Cur Air Temp': string;
    '24h Snow Accumulation': string;
    'Cur Wind Speed': string;
    'Elevation': string;
    'Stid': string;
    'Air Temp Min': string;
    'Air Temp Max': string;
    'Wind Speed Avg': string;
    'Max Wind Gust': string;
    'Wind Direction': string;
    'Total Snow Depth Change': string;
    'Precip Accum One Hour': string;
    'Total Snow Depth': string;
    [key: string]: string;
  };
  onStationClick: (stid: string) => void;
  observationsData: { data: any[]; title: string; } | null;
  isActive: boolean;
  onDropdownToggle: (stid: string | null) => void;
}

export type LayerId =
  | 'forecastZones'
  | 'windArrows'
  | 'snowDepthChange'
  | 'terrain'
  | 'currentTemp';

export default function Home() {
  // View state (UI-related)
  const { tableMode, setTableMode, isComponentVisible, isTransitioning, setIsTransitioning } = useViewState();
  const { activeDropdown, setActiveDropdown } = useDropdown();
  const [isPending, startTransition] = useTransition();
  const [isOneDay, setIsOneDay] = useState(true);

  // Station state
  const {
    stations,
    selectedStation,
    stationIds,
    isStationChanging,
    handleStationChange,
    handleStationClick
  } = useStations({ setTableMode });

  // Date and time state
  const {
    selectedDate,
    setSelectedDate,
    endDate,
    setEndDate,
    useCustomEndDate,
    setUseCustomEndDate,
    handlePrevDay,
    handleNextDay,
    handleDateChange
  } = useDateState();

  const {
    timeRange,
    dayRangeType,
    customTime,
    calculateTimeRange,
    setTimeRange,
    setDayRangeType,
    setCustomTime,
    calculateCurrentTimeRange
  } = useTimeRange();

  const { 
    startHour: calculatedStartHour, 
    endHour: calculatedEndHour 
  } = calculateTimeRange(selectedDate, dayRangeType, timeRange);

  const timeRangeData = useMemo(() => {
    // Always use calculateTimeRange for consistency
    // This ensures we respect the 3 PM start time for multi-day ranges
    const { start, end } = calculateTimeRange(selectedDate, dayRangeType, timeRange);
    
    // Log what's happening for debugging
    console.log('⏰ Calculated time range:', {
      start: start.format('YYYY-MM-DD HH:mm:ss'),
      end: end.format('YYYY-MM-DD HH:mm:ss'),
      type: dayRangeType,
      range: timeRange
    });
    
    return {
      start_time_pdt: start,
      end_time_pdt: end
    };
  }, [selectedDate, endDate, dayRangeType, timeRange, calculateTimeRange]);

  // Weather data state
  const {
    observationsDataDay,
    observationsDataHour,
    filteredObservationsDataHour,
    isLoading,
    isMetric,
    setIsMetric,
    handleRefresh,
    setObservationsDataDay,
    setObservationsDataHour,
    setFilteredObservationsDataHour,
    setIsLoading
  } = useWeatherData(
    timeRangeData,
    stationIds,
    tableMode,
    calculatedStartHour,
    calculatedEndHour,
    dayRangeType
  );

  const {
    handleTimeRangeChange,
    handleDayRangeTypeChange,
    handleEndDateChange
  } = useWeatherControls(
    setSelectedDate,
    setEndDate,
    setUseCustomEndDate,
    setIsOneDay,
    setTimeRange,
    stations,
    handleRefresh,
    timeRange,
    endDate
  );

  // Props grouping for components
  const timeProps = {
    selectedDate,
    endDate,
    dayRangeType,
    customTime,
    timeRange,
    useCustomEndDate,
    handleTimeRangeChange,
    handleDateChange,
    handleEndDateChange,
    handleDayRangeTypeChange,
    handlePrevDay,
    handleNextDay,
    calculateCurrentTimeRange,
    isOneDay,
    setCustomTime
  };

  const stationProps = {
    selectedStation,
    stations,
    handleStationChange,
    stationIds,
  };

  const dataProps = {
    filteredObservationsDataHour,
    onRefresh: handleRefresh,
    tableMode,
    startHour: calculatedStartHour,
    endHour: calculatedEndHour,
    setObservationsDataDay,
    setObservationsDataHour,
    setFilteredObservationsDataHour,
    setIsLoading,
    isMetric,
    setIsMetric,
    calculateCurrentTimeRange,
    isOneDay,
    setCustomTime,
  };

  // Add layer visibility state
  const [layerVisibility, setLayerVisibility] = useState({
    forecastZones: true,
    windArrows: true,
    snowDepthChange: false,
    terrain: false,
    currentTemp: true,
  });
  
  // Handle layer toggle
  const handleToggleLayer = (layerId: LayerId) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  return (
    <main className="flex min-h-screen flex-col items-center relative w-full overflow-hidden">
      {/* Map component as fullscreen background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapComponent 
          observationsDataDay={observationsDataDay}
          observationsDataHour={observationsDataHour}
          filteredObservationsDataHour={filteredObservationsDataHour}
          isMetric={isMetric}
          tableMode={tableMode}
          layerVisibility={layerVisibility}
          onToggleLayer={handleToggleLayer}
          dayRangeType={dayRangeType}
          customTime={customTime}
          calculateCurrentTimeRange={calculateCurrentTimeRange}
        />
      </div>
      
      {/* Container for both controls positioned at the top */}
      <div className="fixed top-4 left-4 right-4 z-10 flex flex-col-reverse md:flex-row gap-4 justify-between items-start" 
        style={{ 
          pointerEvents: 'auto',
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto'
        }}
      >
        {/* Layer controls - left on desktop, below on mobile */}
        <div className="w-full md:w-auto md:sticky md:top-0" 
          style={{ 
            minWidth: '200px', 
            maxWidth: '250px',
            alignSelf: 'flex-start'
          }}
        >
          <LayerControls 
            layersState={layerVisibility}
            toggleLayer={handleToggleLayer}
          />
        </div>
         
        {/* Time toolbar - right on desktop, top on mobile */}
        <div className="w-full md:flex-grow">
          <TimeToolbar
            {...timeProps}
            {...stationProps}
            {...dataProps}
          />
        </div>
      </div>
      
      {/* Additional components are commented out for now */}
      {/* <div className="relative z-10 w-full max-w-6xl mt-4 px-4">
        <RegionsContainer
          observationsData={observationsDataDay}
          handleStationClick={handleStationClick}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          observationsDataDay={observationsDataDay}
          observationsDataHour={observationsDataHour}
          filteredObservationsDataHour={filteredObservationsDataHour}
          isMetric={isMetric}
          tableMode={tableMode}
        />
      </div> */}
    </main>
  );
}