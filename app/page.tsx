'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
} from 'react';

import TimeToolbar from './components/TimeToolbar/TimeToolbarWidget';
import { WeatherDisplay } from '@/app/components/wxTablesGraphsOrchestrator';
import { LoadingWrapper } from '@/app/components/LoadingWrapper';
import RegionTables from '@/app/components/RegionTables';
import { RegionsContainer } from '@/app/components/RegionsContainer';

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
  } = calculateTimeRange(selectedDate, dayRangeType);

  const timeRangeData = useMemo(() => {
    let { start: start_time_pdt, end: end_time_pdt } = calculateTimeRange(selectedDate, dayRangeType);
    
    if (timeRange !== 1) {
      start_time_pdt = moment(selectedDate).tz('America/Los_Angeles').startOf('day');
      end_time_pdt = moment(endDate).tz('America/Los_Angeles').endOf('day');
    }

    return {
      start_time_pdt,
      end_time_pdt
    };
  }, [selectedDate, endDate, dayRangeType, timeRange]);

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
    handleRefresh
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
        />
      </div>
      
      {/* Time toolbar with higher z-index to overlap the map */}
      {/* <div className="relative z-10 w-full max-w-6xl pt-4 px-4">
        <TimeToolbar
          {...timeProps}
          {...stationProps}
          {...dataProps}
        />
      </div> */}
      
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