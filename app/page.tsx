'use client';

import { format, addDays, subDays, startOfDay, setHours } from 'date-fns';
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
import StationUpdateStatus from './components/StationUpdateStatus';//import { ObservationsData } from './types'; // Add this import
import { DayRangeType } from './types';
import { DayRangeSelect } from './components/DayRangeSelect';

interface Station {
  id: string;
  name: string;
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState(1); // Default to 1 day
  const [useCustomEndDate, setUseCustomEndDate] = useState(false);
  const [endDate, setEndDate] = useState(addDays(new Date(), 1));
  const [isLoading, setIsLoading] = useState(true);
  const [observationsDataDay, setObservationsDataDay] = useState<{
    data: any[];
    title: string;
  } | null>(null);
  const [observationsDataHour, setObservationsDataHour] = useState<{
    data: any[];
    title: string;
  } | null>(null);

  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(
    null
  );
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

  const [dayRangeType, setDayRangeType] = useState<DayRangeType>(DayRangeType.FORECAST);

  // Add state for hours
  const [startHour, setStartHour] = useState(5); // Default to forecast mode
  const [endHour, setEndHour] = useState(4);

  // this for a drop down time range menu!
  const calculateTimeRange = (date: Date, type: DayRangeType) => {
    const baseMoment = moment(date).tz('America/Los_Angeles');
    
    switch (type) {
      case DayRangeType.MIDNIGHT:
        return {
          startHour: 0,  // Midnight
          endHour: 0     // Midnight next day
        };
        
      case DayRangeType.CURRENT:
        const currentHour = moment().tz('America/Los_Angeles').hour();
        return {
          startHour: currentHour,
          endHour: currentHour
        };
        
      case DayRangeType.FORECAST:
        return {
          startHour: 5,  // 13Z
          endHour: 4     // 12Z next day
        };
    }
  };

  // Update time calculation
  const { start: start_time_pdt, end: end_time_pdt } = calculateTimeRange(selectedDate, dayRangeType);

  const predefinedRanges = [
    {
      label: '1 Day',
      value: () => {
        setIsOneDay(true);
        const end = new Date();
        const start = new Date();
        return [start, end];
      }
    },
    {
      label: '3 Days',
      value: () => {
        setIsOneDay(false);
        const end = new Date();
        const start = subDays(new Date(), 2);
        return [start, end];
      }
    },
    {
      label: '7 Days',
      value: () => {
        setIsOneDay(false);
        const end = new Date();
        const start = subDays(new Date(), 6);
        return [start, end];
      }
    },
    {
      label: '14 Days',
      value: () => {
        setIsOneDay(false);
        const end = new Date();
        const start = subDays(new Date(), 13);
        return [start, end];
      }
    },
    {
      label: 'Custom Range',
      value: () => {
        setIsOneDay(false);
        return [selectedDate, endDate];
      }
    }
  ];

  const handleDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedDate(new Date(event.target.value));
  };

  const handleTimeRangeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    console.log('Time range changed to:', value);
    
    if (value === 'custom') {
      setUseCustomEndDate(true);
      setIsOneDay(false);
    } else {
      setUseCustomEndDate(false);
      setTimeRange(Number(value));
      
      const newEndDate = new Date();
      let newStartDate: Date;
      
      switch (value) {
        case '1':
          newStartDate = new Date();
          setIsOneDay(true);
          break;
        case '3':
          newStartDate = subDays(newEndDate, 2);
          setIsOneDay(false);
          break;
        case '7':
          newStartDate = subDays(newEndDate, 6);
          setIsOneDay(false);
          break;
        case '14':
          newStartDate = subDays(newEndDate, 13);
          setIsOneDay(false);
          break;
        case '30':
          newStartDate = subDays(newEndDate, 29);
          setIsOneDay(false);
          break;
        default:
          newStartDate = new Date();
          setIsOneDay(true);
      }

      console.log('Setting dates:', {
        start: newStartDate,
        end: newEndDate
      });

      setSelectedDate(newStartDate);
      setEndDate(newEndDate);
      setUseCustomEndDate(true); // Make sure we're using the custom end date
    }
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
        // Adjust fetch time range based on dayRangeType
        let start_time_pdt, end_time_pdt;
        
        switch (dayRangeType) {
          case DayRangeType.MIDNIGHT:
            start_time_pdt = moment(selectedDate)
              .tz('America/Los_Angeles')
              .startOf('day');
            end_time_pdt = moment(endDate)
              .tz('America/Los_Angeles')
              .endOf('day');
            break;
            
          case DayRangeType.CURRENT:
            start_time_pdt = moment()
              .tz('America/Los_Angeles')
              .subtract(24, 'hours');
            end_time_pdt = moment()
              .tz('America/Los_Angeles');
            break;
            
          case DayRangeType.FORECAST:
            start_time_pdt = moment(selectedDate)
              .tz('America/Los_Angeles')
              .hour(5).minute(0).second(0);
            end_time_pdt = moment(endDate)
              .tz('America/Los_Angeles')
              .add(1, 'day')
              .hour(4).minute(59).second(59);
            break;
        }

        console.log('Fetching data with range:', {
          start: start_time_pdt.format(),
          end: end_time_pdt.format()
        });

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

        const result = await response.json();

        console.log('Processing data with mode:', tableMode);
        const processedDataDay = wxTableDataDayFromDB(
          result.observations,
          result.units,
          {
            mode: tableMode,
            startHour: startHour,
            endHour: endHour
          }
        );
        console.log('Processed data result:', processedDataDay);

        setObservationsDataDay(processedDataDay);

        const processedDataHour = hourWxTableDataFromDB(
          result.observations,
          result.units
        );

        setObservationsDataHour(processedDataHour);

        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchDataFromDB:', error);
        setIsLoading(false);
      }
    };

    fetchDataFromDB();
  }, [selectedDate, endDate, stationIds, tableMode, dayRangeType, startHour, endHour]);



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
    console.log('handleStationClick called with:', stationId);
    
    // Find the station name for the selected ID
    const selectedStationObj = stations.find(station => station.id === stationId);
    console.log('Selected station object:', selectedStationObj);

    setIsStationChanging(true);
    
    startTransition(() => {
      // Update all related state in one transition
      setSelectedStation(stationId);
      setStationIds([stationId]);
      setTableMode('daily');
      setTimeRange(7);
      setIsOneDay(false);
      setDayRangeType(DayRangeType.FORECAST);
      
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
    console.log('selectedStation changed to:', selectedStation);
    if (selectedStation) {
      console.log('🔄 Switching to daily mode - Station selected:', selectedStation);
      setTableMode('daily');
    } else {
      console.log('🔄 Switching to summary mode - No station selected');
      setTableMode('summary');
    }
  }, [selectedStation]);

  // Separate handler for day time range type (Midnight/Current/Forecast)
  const handleDayRangeChange = (newRange: DayRangeType) => {
    setDayRangeType(newRange);
    // Only update the time of day, not the date range
    const currentDate = selectedDate; // Use existing selected date
    
    switch (newRange) {
      case DayRangeType.MIDNIGHT:
        // Keep current date, just reset to midnight
        setSelectedDate(startOfDay(currentDate));
        break;
        
      case DayRangeType.CURRENT:
        // Keep current date, set to current time
        setSelectedDate(currentDate);
        break;
        
      case DayRangeType.FORECAST:
        // Keep current date, set to 5am
        setSelectedDate(setHours(startOfDay(currentDate), 5));
        break;
    }
  };

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
    setDayRangeType(newType);
    
    // Update hours based on the selected type
    const { startHour, endHour } = calculateTimeRange(selectedDate, newType);
    setStartHour(startHour);
    setEndHour(endHour);
  };

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

              <div className="flex items-center space-x-4">
                <select
                  value={dayRangeType}
                  onChange={handleDayRangeTypeChange}
                  className="neumorphic-button dropdown h-10"
                >
                  <option value={DayRangeType.MIDNIGHT}>Daily: Midnight to Midnight (default)</option>
                  <option value={DayRangeType.CURRENT}>Daily: Current Time to Current Time - 24h</option>
                  <option value={DayRangeType.FORECAST}>Daily: 13Z - 12Z (forecasters)</option>
                </select>
              </div>

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
