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
  const {
    stations,
    selectedStation,
    stationIds,
    isStationChanging,
    handleStationChange,
    handleStationClick
  } = useStations();

  // Get current time in PDT
  const {
    selectedDate,
    timeRange,
    dayRangeType,
    customTime,
    calculateTimeRange,
    setSelectedDate,
    setTimeRange,
    setDayRangeType,
    setCustomTime
  } = useTimeRange();

  // Add loading state for station change
  const [isPending, startTransition] = useTransition();
  const [isOneDay, setIsOneDay] = useState(true); // Default to true since we start with 1 day view

  // Add state for table mode
  const [tableMode, setTableMode] = useState<'summary' | 'daily'>('summary');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Add a new state for component visibility
  const [isComponentVisible, setIsComponentVisible] = useState(true);

  // Add this state at the top level where RegionCard is used
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  /**
   * Calculates the start and end times based on the selected date and range type
   * @param date - The base date to calculate the range from
   * @param type - The type of range (MIDNIGHT, CURRENT, or FORECAST)
   * @returns Object containing start time, end time, and corresponding hours
   */


  // Initialize with the current date
  //const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

    // Remove unused state variables
    const [useCustomEndDate, setUseCustomEndDate] = useState(false);
    const [startHour, setStartHour] = useState<number>(0);
    const [endHour, setEndHour] = useState<number>(0);
  
    // Add state for day range type
   // const [dayRangeType, setDayRangeType] = useState<DayRangeType>(DayRangeType.CURRENT);
    // console.log('dayRangeType:', dayRangeType);
  
    const { 
      startHour: calculatedStartHour, 
      endHour: calculatedEndHour 
    } = calculateTimeRange(selectedDate, dayRangeType);
  
    // Add effect to update hours when time range changes
    useEffect(() => {
      setStartHour(calculatedStartHour);
      setEndHour(calculatedEndHour);
    }, [calculatedStartHour, calculatedEndHour]);
  
    

  const handleEndDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEndDate(new Date(event.target.value));
  };

  const handlePrevDay = () => {
    setSelectedDate((prevDate) => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate((prevDate) => addDays(prevDate, 1));
  };

  // First, memoize the time range calculation
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

  // Add the hook
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
    startHour,
    endHour,
    dayRangeType
  );

  useEffect(() => {
    //console.log('selectedStation changed to:', selectedStation);
    if (selectedStation) {
      //console.log(' Switching to daily mode - Station selected:', selectedStation);
      setTableMode('daily');
    } else {
      //console.log('🔄 Switching to summary mode - No station selected');
      setTableMode('summary');
    }
  }, [selectedStation]);



  // Updated calculateCurrentTimeRange to be more precise
  const calculateCurrentTimeRange = () => {
    if (useCustomEndDate && timeRange !== 1 && timeRange !== 3 && timeRange !== 7 && timeRange !== 14 && timeRange !== 30) {
      return 'custom';
    }
    return timeRange.toString();
  };

  // Simplified handler - only updates the type and hours
  const handleDayRangeTypeChange = (event: SelectChangeEvent<DayRangeType>) => {
    const newType = event.target.value as DayRangeType;
    //console.log('DayRangeType changed:', {
    //  newType,
    //  selectedDate,
    //  timeRange,
    //  isCustom: newType === DayRangeType.CUSTOM
    //});
    
    setDayRangeType(newType);
    
    // Update hours based on the selected type
    const { startHour, endHour } = calculateTimeRange(selectedDate, newType);
    setStartHour(startHour);
    setEndHour(endHour);
  };

  // Add this effect or merge with existing dayRangeType-related effect
  useEffect(() => {
    //console.log('Current dayRangeType:', dayRangeType);
    //console.log('Is CUSTOM?', dayRangeType === DayRangeType.CUSTOM);
  }, [dayRangeType]);

  //console.log('observationsDataDay', observationsDataDay);


  // Add click outside handler at the top level
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('details')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

  // Add the hook
  const {
    handleTimeRangeChange,
    handleDateChange,
  } = useWeatherControls(
    setSelectedDate,
    setEndDate,
    setUseCustomEndDate,
    setIsOneDay,
    setTimeRange,
    stations,
    handleRefresh
  );

  // Usage in your render
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
          startHour={startHour}
          endHour={endHour}
          setObservationsDataDay={setObservationsDataDay}
          setObservationsDataHour={setObservationsDataHour}
          setFilteredObservationsDataHour={setFilteredObservationsDataHour}
          setIsLoading={setIsLoading}
          isMetric={isMetric}
          setIsMetric={setIsMetric}
        />

        {/* Should show if stuff is loading, but not showing anything now  */}
        <div 
          className={`w-full max-w-6xl space-y-4 transition-opacity duration-200 ${
            isComponentVisible && !isLoading && !isPending 
              ? 'opacity-100' 
              : 'opacity-0'
          }`}
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

        {/*  Regions the BIG table */}

          {observationsDataDay && selectedStation && (
            <DayAveragesTable 
              dayAverages={observationsDataDay} 
              onStationClick={handleStationClick}
              mode={tableMode}
            />
          )}

          {/*  Regions  */}

          {/* region cards for each table  */}

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

          {/* Individual STATION Components  */}

          {/* Graphs   */}

          {/* Tables   */}


        </div>
      </div>
    </main>
  );
}