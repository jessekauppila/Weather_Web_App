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

import DayAveragesTable from './dayWxTable';
import DayWxSnowGraph from './dayWxSnowGraph';
import AccordionWrapper from './components/AccordionWrapper';

//import hourWxTableDataFromDB from './hourWxTableDataFromDB';
import HourWxTable from './hourWxTable';
import WxSnowGraph from './wxSnowGraph';

import { DayRangeType } from './types';

import RegionCard from './components/RegionCard';

import TimeToolbar from './components/TimeToolbar';
import { fetchWeatherData } from './utils/fetchWeatherData';

import { regions, stationGroups } from './config/regions';

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
  const currentMoment = moment().tz('America/Los_Angeles');
  const [customTime, setCustomTime] = useState(currentMoment.format('HH:mm'));

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

  // Move this up, before calculateTimeRange
  const [timeRange, setTimeRange] = useState(1);

  // Add this state at the top level where RegionCard is used
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  /**
   * Calculates the start and end times based on the selected date and range type
   * @param date - The base date to calculate the range from
   * @param type - The type of range (MIDNIGHT, CURRENT, or FORECAST)
   * @returns Object containing start time, end time, and corresponding hours
   */
  const calculateTimeRange = (date: Date, type: DayRangeType) => {
    const endMoment = moment(date).tz('America/Los_Angeles');
    const currentMoment = moment().tz('America/Los_Angeles');
    const currentHour = currentMoment.hour();
    const currentMinute = currentMoment.minute();

    switch (type) {
      case DayRangeType.MIDNIGHT:
        const midnightResult = {
          start: endMoment.clone().startOf('day'),
          end: endMoment.clone().startOf('day').add(24 * timeRange, 'hours'),
          startHour: 0,
          endHour: 24
        };
        return midnightResult;
        
      case DayRangeType.CURRENT:
        const currentResult = {
          start: endMoment.clone()
            .subtract(timeRange, 'days')
            .hour(currentHour)
            .minute(currentMinute)
            .second(0),
          end: endMoment.clone()
            .hour(currentHour)
            .minute(currentMinute)
            .second(0),
          startHour: currentHour,
          endHour: currentHour
        };

        return currentResult;

        case DayRangeType.CUSTOM:
          const [hours, minutes] = customTime.split(':').map(Number);
          return {
            start: endMoment.clone()
              .subtract(timeRange, 'days')
              .hour(hours)
              .minute(minutes)
              .second(0),
            end: endMoment.clone()
              .hour(hours)
              .minute(minutes)
              .second(0),
            startHour: hours,
            endHour: hours
          };
    
        default:
          // Fallback to CURRENT case if type is unknown
          // const currentHour = currentMoment.hour();
          // const currentMinute = currentMoment.minute();
          
          return {
            start: endMoment.clone()
              .subtract(timeRange, 'days')
              .hour(currentHour)
              .minute(currentMinute)
              .second(0),
            end: endMoment.clone()
              .hour(currentHour)
              .minute(currentMinute)
              .second(0),
            startHour: currentHour,
            endHour: currentHour
          };
    }
  };

  // Initialize with the current date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

    // Remove unused state variables
    const [useCustomEndDate, setUseCustomEndDate] = useState(false);
    const [startHour, setStartHour] = useState<number>(0);
    const [endHour, setEndHour] = useState<number>(0);
  
    // Add state for day range type
    const [dayRangeType, setDayRangeType] = useState<DayRangeType>(DayRangeType.CURRENT);
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
  

        //This is what is making the date change when you change the date in the date picker, it used to go back two days before what you picked!
        const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          const newDate = moment(event.target.value)
            .tz('America/Los_Angeles')
            .startOf('day')
            .toDate();
          
          setSelectedDate(newDate);
          setEndDate(newDate);
        };
    

  // this is the function that determines what happens in the drop down menu for date range
  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    console.log('Time range changed:', value);
    
    if (value === 'custom') {
      setUseCustomEndDate(true);
      setIsOneDay(false);
      return;
    }
    
    setUseCustomEndDate(false);
    setTimeRange(Number(value));
    
    const newEndDate = new Date();
    let newStartDate: Date;
    
    switch (value) {
      case '1':
        newStartDate = subDays(newEndDate, 1);
        setIsOneDay(true);
        break;
      case '3':
        newStartDate = subDays(newEndDate, 3);
        setIsOneDay(false);
        break;
      case '7':
        newStartDate = subDays(newEndDate, 7);
        setIsOneDay(false);
        break;
      case '14':
        newStartDate = subDays(newEndDate, 14);
        setIsOneDay(false);
        break;
      case '30':
        newStartDate = subDays(newEndDate, 30);
        setIsOneDay(false);
        break;
      default:
        newStartDate = subDays(newEndDate, 1);
        setIsOneDay(true);
    }

    // console.log('Setting dates:', {
    //   start: newStartDate,
    //   end: newEndDate
    // });

    setSelectedDate(newStartDate);
    setEndDate(newEndDate);
    setUseCustomEndDate(true);
  };

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
  const handleRefresh = async () => {
    setIsLoading(true);
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
      setIsLoading
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
        />

        {/* Should show if stuff is loading, but not showing anything now  */}
        <div 
          className={`w-full max-w-6xl space-y-4 transition-opacity duration-200 ${
            isComponentVisible && !isLoading && !isPending 
              ? 'opacity-100' 
              : 'opacity-0'
          }`}
        >


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

<div className="flex flex-col gap-4">
          {filteredObservationsDataHour && observationsDataDay && selectedStation && stationIds.length === 1 && (
            <>
                <AccordionWrapper
                  title="Hourly Snow and Temperature Graph"
                  subtitle={observationsDataDay.title}
                  defaultExpanded={false}
                >
              <WxSnowGraph 
                dayAverages={filteredObservationsDataHour} 
                isHourly={true}
              />
               </AccordionWrapper>
            </>
          )}

{     /* USED TO BE THIS timeRange > 3 &&  */}
        {observationsDataDay && selectedStation && stationIds.length === 1 && ( 
            <>
              <AccordionWrapper
                title="Daily Snow and Temperature Graph"
                subtitle={observationsDataDay.title}
                defaultExpanded={false}
              >
                <DayWxSnowGraph dayAverages={observationsDataDay} />
              </AccordionWrapper>
            </>
          )}
</div>

           {/* Tables   */}


   {/* This is when I want the daily table to show up only on daily page   */}
          {/* {observationsDataDay && tableMode === 'daily' && (
            <DayAveragesTable 
              dayAverages={observationsDataDay} 
              onStationClick={handleStationClick}
              mode={tableMode}
            />
          )} */}

        {filteredObservationsDataHour && selectedStation && (
                    <HourWxTable 
                      hourAverages={filteredObservationsDataHour} 
                    />
                  )}


          {observationsDataHour && selectedStation && (
            <HourWxTable 
              hourAverages={observationsDataHour} 
            />
          )}
        </div>

      </div>
    </main>
  );
}