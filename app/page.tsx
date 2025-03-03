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
import DayWxSnowGraph from './vis/dayWxSnowGraph';
import AccordionWrapper from './components/map/AccordionWrapper';

//import hourWxTableDataFromDB from './hourWxTableDataFromDB';
import HourWxTable from './vis/hourWxTable';
import WxSnowGraph from './vis/wxSnowGraph';

import { DayRangeType } from './types';

import RegionCard from './components/map/RegionCard';

import TimeToolbar from './components/TimeToolbar';
import { fetchWeatherData } from './utils/fetchWeatherData';

import { regions, stationGroups } from '@/app/config/regions';

import { Analytics } from "@vercel/analytics/react"

import { useTimeRange } from '@/app/hooks/useTimeRange';
import { WeatherDisplay } from '@/app/components/wxTablesGraphsOrchestrator';
import { useWeatherControls } from '@/app/hooks/useWeatherControls';

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

  const [isLoading, setIsLoading] = useState(true);

  const [observationsDataDay, setObservationsDataDay] = useState<{
    data: any[];
    title: string;
  } | null>(null);

  const [observationsDataHour, setObservationsDataHour] = useState<{
    data: any[];
    title: string;
  } | null>(null);

  // console.log('observationsDataHour', observationsDataHour);

  const [filteredObservationsDataHour, setFilteredObservationsDataHour] = useState<{
    data: any[];
    title: string;
  } | null>(null);

  const [stations, setStations] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [stationIds, setStationIds] = useState<string[]>([]);

  // Add loading state for station change
  const [isStationChanging, setIsStationChanging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isOneDay, setIsOneDay] = useState(true); // Default to true since we start with 1 day view

  // Add state for table mode
  const [tableMode, setTableMode] = useState<'summary' | 'daily'>('summary');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Add a new state for component visibility
  const [isComponentVisible, setIsComponentVisible] = useState(true);

  // Add this state at the top level where RegionCard is used
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Add state
  const [isMetric, setIsMetric] = useState<boolean>(false);

  useEffect(() => {
    console.log('📄 Page: isMetric state changed to:', isMetric);
  }, [isMetric]);

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

  //Fetch the stations from the DB and then use the station ids to fetch the observations from the DB
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch('/api/getStations');
        if (!response.ok) {
          throw new Error('Failed to fetch stations');
        }
        const data = await response.json();
        const mappedStations = data
          .map((station: any) => ({
            id: station.stid,
            name: station.station_name,
          }))
          .sort((a: Station, b: Station) =>
            a.name.localeCompare(b.name)
          );

        setStations(mappedStations);
        // Set stationIds to include all station IDs initially
        const allStationIds = mappedStations.map((station: any) => station.id);
        setStationIds(allStationIds);
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
    };

    fetchStations();
  }, []);

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

  // Create a refresh function
  const handleRefresh = async (newIsMetric?: boolean) => {
    console.log('🔄 Page: Fetching weather data with isMetric:', newIsMetric ?? isMetric);
    await fetchWeatherData({
      timeRangeData,
      stationIds,
      tableMode,
      startHour,
      endHour,
      dayRangeType,
      setObservationsDataDay,
      setObservationsDataHour,
      setFilteredObservationsDataHour,
      setIsLoading,
      isMetric: newIsMetric ?? isMetric  // Use new value if provided, otherwise use current state
    });
  };

  // Use the same function in useEffect
  useEffect(() => {
    handleRefresh();
  }, [timeRangeData, stationIds]);

  // Modify the handleStationChange function
  const handleStationChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const selectedStationId = event.target.value;
      
      startTransition(() => {
        if (!selectedStationId) {
          setSelectedStation('');
          setStationIds(stations.map(station => station.id));
          setTableMode('summary');
        } else {
          setSelectedStation(selectedStationId);
          setStationIds([selectedStationId]);
          setTableMode('daily');
        }
      });
    },
    [stations]
  );

  const handleStationClick = (stationId: string) => {
    setIsStationChanging(true);
    
    startTransition(() => {
      setSelectedStation(stationId);
      setStationIds([stationId]);
      setTableMode('daily');
    });

    setTimeout(() => {
      setIsStationChanging(false);
    }, 300);
  };

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
            filteredObservationsDataHour={filteredObservationsDataHour}
            selectedStation={selectedStation}
            isMetric={isMetric}
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