'use client';

import { format, addDays, subDays, startOfDay, setHours, setMinutes } from 'date-fns';
import moment from 'moment-timezone';
import React, {
  useState,
  useEffect,
  useCallback,
  useTransition,
} from 'react';
import DayAveragesTable from './dayWxTable';
import wxTableDataDayFromDB from './dayWxTableDataDayFromDB';
import HourWxTable from './hourWxTable';
import hourWxTableDataFromDB from './hourWxTableDataFromDB';
import DayWxSnowGraph from './dayWxSnowGraph';
import { DayRangeType } from './types';
import { filteredObservationData } from './filteredObservationData';

interface Station {
  id: string;
  name: string;
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

  /**
   * Calculates the start and end times based on the selected date and range type
   * @param date - The base date to calculate the range from
   * @param type - The type of range (MIDNIGHT, CURRENT, or FORECAST)
   * @returns Object containing start time, end time, and corresponding hours
   */
  const calculateTimeRange = (date: Date, type: DayRangeType) => {
    const endMoment = moment(date).tz('America/Los_Angeles');
    const currentMoment = moment().tz('America/Los_Angeles');
    
    //console.log('calculateTimeRange input:', {
    //  date,
    //  type,
    // endMoment: endMoment.format('YYYY-MM-DD HH:mm:ss'),
    //  currentMoment: currentMoment.format('YYYY-MM-DD HH:mm:ss')
    //  });

    switch (type) {
      case DayRangeType.MIDNIGHT:
        const midnightResult = {
          start: endMoment.clone().subtract(timeRange, 'days').startOf('day'),
          end: endMoment.clone().endOf('day'),
          startHour: 0,
          endHour: 23
        };

        // console.log('MIDNIGHT type calculation:', {
        //   startTime: midnightResult.start.format('YYYY-MM-DD HH:mm:ss'),
        //   endTime: midnightResult.end.format('YYYY-MM-DD HH:mm:ss'),
        //   startHour: midnightResult.startHour,
        //   endHour: midnightResult.endHour
        // });

        return midnightResult;
        
      case DayRangeType.CURRENT:
        const currentHour = currentMoment.hour();
        const currentMinute = currentMoment.minute();
        
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

        // console.log('CURRENT type calculation:', {
        //   startTime: currentResult.start.format('YYYY-MM-DD HH:mm:ss'),
        //   endTime: currentResult.end.format('YYYY-MM-DD HH:mm:ss'),
        //   startHour: currentResult.startHour,
        //   endHour: currentResult.endHour
        // });

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
          // Fallback to midnight case if type is unknown
          return {
            start: endMoment.clone().subtract(timeRange, 'days').startOf('day'),
            end: endMoment.clone().endOf('day'),
            startHour: 0,
            endHour: 23
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
    const [dayRangeType, setDayRangeType] = useState<DayRangeType>(DayRangeType.MIDNIGHT);
    // console.log('dayRangeType:', dayRangeType);
  

    // Now the time calculation will work
    const { 
      startHour: calculatedStartHour, 
      endHour: calculatedEndHour 
    } = calculateTimeRange(selectedDate, dayRangeType);
  
    // Add effect to update hours when time range changes
    useEffect(() => {
      setStartHour(calculatedStartHour);
      setEndHour(calculatedEndHour);
    }, [calculatedStartHour, calculatedEndHour]);
  
    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedEndDate = new Date(event.target.value);
      setEndDate(selectedEndDate);
      setSelectedDate(subDays(selectedEndDate, timeRange));
    };


  // this is the function that determines what happens in the drop down menu for date range
  const handleTimeRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    //console.log('Time range changed to:', value);
    
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

    console.log('Setting dates:', {
      start: newStartDate,
      end: newEndDate
    });

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

  //Fetch the observations from the DB
  useEffect(() => {
    const fetchDataFromDB = async () => {
      try {
        let { start: start_time_pdt, end: end_time_pdt } = calculateTimeRange(selectedDate, dayRangeType);
        
        // Only override the calculated times for multi-day views
        if (timeRange !== 1) {
          start_time_pdt = moment(selectedDate).tz('America/Los_Angeles').startOf('day');
          end_time_pdt = moment(endDate).tz('America/Los_Angeles').endOf('day');
        }

        const response = await fetch('/api/getObservationsFromDB', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: start_time_pdt.toISOString(),
            endDate: end_time_pdt.toISOString(),
            stationIds: stationIds,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `API error: ${response.status} ${errorData.error} - ${errorData.details}`
          );
        }

        //this is the raw data from the DB
        const result = await response.json();

        //this is the filtered data
        const filteredData = filteredObservationData(result.observations, {
          mode: tableMode,
          startHour: startHour,
          endHour: endHour,
          dayRangeType: dayRangeType,
          start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
          end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
        });

        console.log('filteredData in page.tsx:', filteredData);


        //console.log('Processing data with mode:', tableMode);
        const processedDataDay = wxTableDataDayFromDB(
          result.observations,
          result.units,
          {
            mode: tableMode,
            startHour: startHour,
            endHour: endHour,
            dayRangeType: dayRangeType,
            start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
            end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
          }
        );

        console.log('processedDataDay in page.tsx:', processedDataDay);

        setObservationsDataDay(processedDataDay);

        const processedDataHour = hourWxTableDataFromDB(
          result.observations,
          result.units
        );

        setObservationsDataHour(processedDataHour);

        setIsLoading(false);
      } catch (error) {
        // console.error('Error in fetchDataFromDB:', error);
        setIsLoading(false);
      }
    };

    fetchDataFromDB();
  }, [
    selectedDate, 
    endDate, 
    stationIds, 
    tableMode, 
    dayRangeType, 
    startHour, 
    endHour, 
    timeRange
  ]);



  // Modify the handleStationChange function
  const handleStationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setIsComponentVisible(false);  // Hide components before transition
      setIsTransitioning(true);
      const selectedStationId = e.target.value;
      
      // Short delay before state changes
      setTimeout(() => {
        startTransition(() => {
          if (!selectedStationId) {
            setSelectedStation('');
            setStationIds(stations.map(station => station.id));
            setTableMode('summary');
            setTimeRange(1);
            setIsOneDay(true);
            setSelectedDate(new Date());
            setEndDate(new Date());
            setUseCustomEndDate(false);
          } else {
            setSelectedStation(selectedStationId);
            setStationIds([selectedStationId]);
            setTableMode('daily');
          }
        });

        // Show components after state changes
        setTimeout(() => {
          setIsComponentVisible(true);
          setIsTransitioning(false);
          setIsStationChanging(false);
        }, 100);
      }, 100);
    },
    [stations]
  );

  // In your main Home component, modify this handler
  const handleStationClick = (stationId: string) => {
    //console.log('handleStationClick called with:', stationId);
    
    // Find the station name for the selected ID
    const selectedStationObj = stations.find(station => station.id === stationId);
    //console.log('Selected station object:', selectedStationObj);

    setIsStationChanging(true);
    
    startTransition(() => {
      // Update all related state in one transition
      setSelectedStation(stationId);
      setStationIds([stationId]);
      setTableMode('daily');
      setTimeRange(7);
      setIsOneDay(false);
      
      // Set date range to last 7 days
      const newEndDate = new Date();
      const newStartDate = subDays(newEndDate, 6);
      
      setSelectedDate(newStartDate);
      setEndDate(newEndDate);
      setUseCustomEndDate(true);
    });

    setTimeout(() => {
      setIsStationChanging(false);
    }, 300);
  };

  // Add this effect after your other useEffects
  useEffect(() => {
    //console.log('selectedStation changed to:', selectedStation);
    if (selectedStation) {
      //console.log('🔄 Switching to daily mode - Station selected:', selectedStation);
      setTableMode('daily');
    } else {
      //console.log('🔄 Switching to summary mode - No station selected');
      setTableMode('summary');
    }
  }, [selectedStation]);



  // Update calculateCurrentTimeRange to be more precise
  const calculateCurrentTimeRange = () => {
    if (useCustomEndDate && timeRange !== 1 && timeRange !== 3 && timeRange !== 7 && timeRange !== 14 && timeRange !== 30) {
      return 'custom';
    }
    return timeRange.toString();
  };

  // Simplified handler - only updates the type and hours
  const handleDayRangeTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
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

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-100">
      <div className="w-full max-w-6xl space-y-4">
        <div className="flex flex-col items-center">
          <div className="flex flex-col space-y-4 bg-[cornflowerblue] p-4 rounded-xl shadow-md">
            {/* Top row with date controls */}
            <div className="flex items-center justify-center space-x-4">
              <select
                value={calculateCurrentTimeRange()}
                onChange={handleTimeRangeChange}
                className="neumorphic-button dropdown h-10"
              >
                <option value="1">1 Day</option>
                <option value="3">Past 3 Days</option>
                <option value="7">Past 7 Days</option>
                <option value="14">Past 14 Days</option>
                <option value="30">Past 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>

              
              <div className="flex gap-4 items-center">
                {/* <DayRangeSelect 
                  value={dayRangeType} 
                  onChange={handleDayRangeChange} 
                /> */}
                <div className="flex items-center space-x-2">
                  {isOneDay && (
                    <button onClick={handlePrevDay} className="neumorphic-button nav-button h-10 w-10">
                      &lt;
                    </button>
                  )}
                  
                  <input
                    type="date"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={handleDateChange}
                    className="neumorphic-button date-picker h-10"
                  />
                  
                  {isOneDay && (
                    <button onClick={handleNextDay} className="neumorphic-button nav-button h-10 w-10">
                      &gt;
                    </button>
                  )}

                  {!isOneDay && (
                    <input
                      type="date"
                      value={format(endDate, 'yyyy-MM-dd')}
                      onChange={handleEndDateChange}
                      className="neumorphic-button date-picker h-10"
                      min={format(selectedDate, 'yyyy-MM-dd')}
                    />
                  )}

              <div className="flex items-center space-x-4">
                {/* Main container - now narrower since dropdown expands left */}
                <details className="relative w-[40px]"> {/* Match button width */}
                  {/* Button that shows the caret - same size as before */}
                  <summary className="neumorphic-button h-10 w-10 flex items-center justify-center px-4 cursor-pointer">
                    <span className="transform transition-transform duration-200 details-caret">▼</span>
                  </summary>
                  {/* Expanded dropdown menu - now positioned to expand leftward */}
                  <div className="absolute right-0 top-full mt-2 bg-[cornflowerblue] p-4 rounded-lg shadow-lg space-y-4 w-[300px]">
                    <select
                      value={dayRangeType}
                      onChange={handleDayRangeTypeChange}
                      className="neumorphic-button dropdown h-10 w-full"
                    >
                      <option value={DayRangeType.MIDNIGHT}>Range: Midnight to Midnight</option>
                      <option value={DayRangeType.CURRENT}>Range: Rolling 24 hours</option>
                      <option value={DayRangeType.CUSTOM}>Range: Custom</option>
                    </select>

                    {/* Time picker - only shows when Custom is selected */}
                    {dayRangeType === DayRangeType.CUSTOM && (
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="neumorphic-button time-picker h-10 w-full"
                      />
                    )}
                  </div>
                </details>
              </div>


                </div>
              </div>
            </div>

            {/* Bottom row with station selector */}
            {/* Station selector - show when a station is selected or after clicking from table */}
            {(selectedStation || stationIds.length === 1) && (
              <div className="flex justify-center">
                <select
                  value={selectedStation}
                  onChange={handleStationChange}
                  className="neumorphic-button dropdown h-10"
                >
                  <option value="">All Stations</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div 
          className={`w-full max-w-6xl space-y-4 transition-opacity duration-200 ${
            isComponentVisible && !isLoading && !isPending 
              ? 'opacity-100' 
              : 'opacity-0'
          }`}
        >

        {observationsDataDay && selectedStation && stationIds.length === 1 && (
            <>
              <DayWxSnowGraph 
                dayAverages={observationsDataDay} 
              />
            </>
          )}

          {observationsDataDay && (
            <DayAveragesTable 
              dayAverages={observationsDataDay} 
              onStationClick={handleStationClick}
              mode={tableMode}
            />
          )}

          {observationsDataHour && selectedStation && (
            <HourWxTable 
              hourAverages={observationsDataHour} 
            />
          )}
        </div>

        {/* <StationUpdateStatus /> */}
      </div>
    </main>
  );
}
