'use client';

import { format, addDays, subDays, startOfDay, setHours, setMinutes } from 'date-fns';
import moment from 'moment-timezone';
import React, {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
} from 'react';
import { SelectChangeEvent } from '@mui/material';
import DayAveragesTable from './vis/dayWxTable';
import { DayRangeType } from './types';
import RegionCard from './components/map/RegionCard';
import TimeToolbar from './components/TimeToolbar';
import { regions, stationGroups } from '@/app/config/regions';
import { Analytics } from "@vercel/analytics/react"
import { useTimeRange } from '@/app/hooks/useTimeRange';
import { WeatherDisplay } from '@/app/components/wxTablesGraphsOrchestrator';
import { useWeatherControls } from '@/app/hooks/useWeatherControls';
import { useWeatherData } from '@/app/hooks/useWeatherData';
import { useStations } from '@/app/hooks/useStations';
import { LoadingWrapper } from '@/app/components/LoadingWrapper';
import { useViewState } from '@/app/hooks/useViewState';
import { useDateState } from '@/app/hooks/useDateState';
import RegionTables from '@/app/components/RegionTables';

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

export default function Home() {

  const { tableMode, setTableMode } = useViewState();

  const {
    stations,
    selectedStation,
    stationIds,
    isStationChanging,
    handleStationChange,
    handleStationClick
  } = useStations({ setTableMode });

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
    setCustomTime
  } = useTimeRange();

  const [isPending, startTransition] = useTransition();
  const [isOneDay, setIsOneDay] = useState(true); // Default to true since we start with 1 day view

  const {
    isComponentVisible,
    setIsComponentVisible,
    activeDropdown,
    setActiveDropdown,
    isTransitioning,
    setIsTransitioning
  } = useViewState();

  const { 
    startHour: calculatedStartHour, 
    endHour: calculatedEndHour 
  } = calculateTimeRange(selectedDate, dayRangeType);

  useEffect(() => {
  }, [dayRangeType]);

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
  }, [selectedDate, endDate, dayRangeType, timeRange]); // Minimal dependencies

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

  const calculateCurrentTimeRange = () => {
    if (useCustomEndDate && timeRange !== 1 && timeRange !== 3 && timeRange !== 7 && timeRange !== 14 && timeRange !== 30) {
      return 'custom';
    }
    return timeRange.toString();
  };

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

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-100 w-full">
      <div className="w-full max-w-6xl space-y-4">
        <TimeToolbar
          calculateCurrentTimeRange={calculateCurrentTimeRange}
          handleTimeRangeChange={handleTimeRangeChange}
          isOneDay={isOneDay}
          handlePrevDay={handlePrevDay}
          handleNextDay={handleNextDay}
          selectedDate={selectedDate}
          handleDateChange={handleDateChange}
          endDate={endDate}
          handleEndDateChange={handleEndDateChange}
          dayRangeType={dayRangeType}
          handleDayRangeTypeChange={handleDayRangeTypeChange}
          customTime={customTime}
          setCustomTime={setCustomTime}
          selectedStation={selectedStation}
          stations={stations}
          handleStationChange={handleStationChange}
          stationIds={stationIds}
          filteredObservationsDataHour={filteredObservationsDataHour}
          onRefresh={handleRefresh}
          tableMode ={tableMode}
          startHour={calculatedStartHour}
          endHour={calculatedEndHour}
          setObservationsDataDay={setObservationsDataDay}
          setObservationsDataHour={setObservationsDataHour}
          setFilteredObservationsDataHour={setFilteredObservationsDataHour}
          setIsLoading={setIsLoading}
          isMetric={isMetric}
          setIsMetric={setIsMetric}
        />

        <LoadingWrapper
          isComponentVisible={isComponentVisible}
          isLoading={isLoading}
          isPending={isPending}
        >
          <WeatherDisplay
            observationsDataDay={observationsDataDay}
            observationsDataHour={observationsDataHour}
            filteredObservationsDataHour={filteredObservationsDataHour}
            selectedStation={selectedStation}
            isMetric={isMetric}
            handleStationClick={handleStationClick}
            tableMode={tableMode}
          />

          <RegionTables
            observationsDataDay={observationsDataDay}
            handleStationClick={handleStationClick}
            tableMode={tableMode}
          />

        {observationsDataDay && tableMode === 'summary' && (
          <div className="space-y-4">
            {regions.map(region => {
              // Filter observations for this region
              const regionData = {
                ...observationsDataDay,
                title: `${region.title} - ${observationsDataDay.title}`,
                data: observationsDataDay.data.filter(station => 
                  region.stationIds.includes(station.Stid)
                )
              };
              
              // Only render table if region has data
              return regionData.data.length > 0 ? (
                <div key={region.id} className="bg-white rounded-lg shadow">
                  {/* <h2 className="text-xl font-bold p-4 bg-gray-100 rounded-t-lg">
                    {region.title}
                  </h2> */}
                  <DayAveragesTable 
                    dayAverages={regionData}
                    onStationClick={handleStationClick}
                    mode={tableMode}
                  />
                </div>
              ) : null;
            })}
          </div>
        )}

          {/* This is for when I eventually implement the region cards for the map  */}

          {observationsDataDay && tableMode === 'summary' && (
            <>
              {regions.map(region => (
                <RegionCard
                  key={region.id}
                  title={region.title}
                  stations={observationsDataDay.data}
                  stationIds={region.stationIds}
                  onStationClick={handleStationClick}
                  observationsData={observationsDataDay}
                  activeDropdown={activeDropdown}
                  onDropdownToggle={setActiveDropdown}
                />
              ))}
            </>
          )}
        </LoadingWrapper>
      </div>
    </main>
  );
}