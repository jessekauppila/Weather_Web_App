'use client';

import { format, addDays, subDays } from 'date-fns';
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
import HourWxSnowGraph from './hourWxSnowGraph';
//import { ObservationsData } from './types'; // Add this import

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
    if (value === 'custom') {
      setUseCustomEndDate(true);
      setIsOneDay(false);
    } else {
      setUseCustomEndDate(false);
      setTimeRange(Number(value));
      setSelectedDate(subDays(new Date(), Number(value) - 1));
      setEndDate(new Date());
      setIsOneDay(value === '1');
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
        setStationIds(
          mappedStations.map((station: any) => station.id)
        );
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
        const start_time_pdt = moment(selectedDate)
          .tz('America/Los_Angeles')
          .startOf('day')
          .add(5, 'hours');

        const end_time_pdt = useCustomEndDate
          ? moment(endDate).tz('America/Los_Angeles').endOf('day')
          : moment(start_time_pdt).add(timeRange, 'days');

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

        const processedDataDay = wxTableDataDayFromDB(
          result.observations,
          result.units
        );

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
  }, [
    selectedDate,
    timeRange,
    endDate,
    useCustomEndDate,
    stationIds,
  ]);

  //Check to see if it's time to run the uploadDataLastHour API call
  useEffect(() => {
    const checkAndRunUpdate = async () => {
      const now = new Date();
      console.log(`Checking for update at ${now.toLocaleString()}`);

      const minutes = now.getMinutes();

      if (
        minutes === 1 //||
        // minutes === 5 ||
        // minutes === 20 ||
        // minutes === 30
      ) {
        console.log(
          `Running update at ${minutes} minute(s) past the hour`
        );
        try {
          const response = await fetch('/api/uploadDataLastHour', {
            method: 'POST',
          });
          if (response.ok) {
            setLastUpdateTime(now.toLocaleString());
            console.log('Update successful at', now.toLocaleString());
          } else {
            console.error('Update failed:', await response.text());
          }
        } catch (error) {
          console.error('Error running update:', error);
        }
      } else {
        console.log(
          `No update needed at ${minutes} minute(s) past the hour`
        );
      }
    };
    // Run the check immediately on component mount
    checkAndRunUpdate();

    // Then run the check every minute
    const intervalId = setInterval(checkAndRunUpdate, 60000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Modify the handleStationChange function
  const handleStationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setIsStationChanging(true);
      const selectedStationId = e.target.value;

      // Immediate UI update
      setSelectedStation(selectedStationId);

      // Defer the expensive state update
      startTransition(() => {
        if (selectedStationId) {
          setStationIds([selectedStationId]);
        } else {
          setStationIds(stations.map((station) => station.id));
        }
      });

      // Clear loading state after a brief delay
      setTimeout(() => {
        setIsStationChanging(false);
      }, 300);
    },
    [stations]
  );

  // In your main Home component, add this handler
  const handleStationClick = (stationId: string) => {
    console.log('handleStationClick called with:', stationId); // Debug log
    setIsStationChanging(true);
    setSelectedStation(stationId);
    
    startTransition(() => {
      console.log('Setting stationIds to:', [stationId]); // Debug log
      setStationIds([stationId]);
    });

    setTimeout(() => {
      setIsStationChanging(false);
    }, 300);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-100">
      <div className="w-full max-w-6xl space-y-4">
        <div className="flex flex-col items-center">
          <div className="flex flex-col space-y-4 bg-[cornflowerblue] p-4 rounded-xl shadow-md">
            {/* Top row with date controls */}
            <div className="flex items-center justify-center space-x-4">
              <select
                value={useCustomEndDate ? 'custom' : timeRange}
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

            {/* Bottom row with station selector */}
            {selectedStation && (
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

        {!isLoading && !isStationChanging && !isPending && (
          <div className="w-full max-w-6xl space-y-4">

            {observationsDataHour && selectedStation && (
              <HourWxSnowGraph 
                hourAverages={observationsDataHour} 
              />
            )}

            {observationsDataDay && (
              <DayAveragesTable 
                dayAverages={observationsDataDay} 
                onStationClick={handleStationClick}
              />
            )}

            {observationsDataHour && selectedStation && (
              <HourWxTable 
                hourAverages={observationsDataHour} 
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

//this runs the uploadDataLastHour every 30 secs to check to make sure things are working correctly...
// useEffect(() => {
//   const checkAndRunUpdate = async () => {
//     const now = new Date();
//     console.log(`Checking for update at ${now.toLocaleString()}`);

//     try {
//       const response = await fetch('/api/uploadDataLastHour', {
//         method: 'POST',
//       });
//       if (response.ok) {
//         setLastUpdateTime(now.toLocaleString());
//         console.log('Update successful at', now.toLocaleString());
//       } else {
//         console.error('Update failed:', await response.text());
//       }
//     } catch (error) {
//       console.error('Error running update:', error);
//     }
//   };

//   // Run the check immediately on component mount
//   checkAndRunUpdate();

//   // Then run the check every 30 seconds
//   const intervalId = setInterval(checkAndRunUpdate, 30000);

//   // Clean up the interval on component unmount
//   return () => clearInterval(intervalId);
// }, []); // Empty dependency array means this effect runs once on mount and sets up the interval
