'use client';

import { format, addDays, subDays } from 'date-fns';
import moment from 'moment-timezone';
import React, { useState, useEffect } from 'react';
import DayAveragesTable from './dayWxTable';
import wxTableDataDayFromDB from './dayWxTableDataDayFromDB';
import HourWxTable from './hourWxTable';
import hourWxTableDataFromDB from './hourWxTableDataFromDB';
//import { ObservationsData } from './types'; // Add this import

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  // const [submittedDate, setSubmittedDate] = useState(new Date());
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

  const handleDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedDate(new Date(event.target.value));
  };

  // const handleSubmit = () => {
  //   setSubmittedDate(selectedDate);
  // };

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
        const mappedStations = data.map((station: any) => ({
          id: station.stid,
          name: station.station_name,
        }));
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

        const end_time_pdt = moment(start_time_pdt).add(1, 'day');

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
  }, [selectedDate, stationIds]);

  //Check to see if it's time to run the uploadDataLastHour API call
  useEffect(() => {
    const checkAndRunUpdate = async () => {
      const now = new Date();
      console.log(`Checking for update at ${now.toLocaleString()}`);

      const minutes = now.getMinutes();

      if (
        minutes === 1 ||
        minutes === 5 ||
        minutes === 20 ||
        minutes === 30
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

  const handleStationChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedStationId = e.target.value;
    setSelectedStation(selectedStationId);

    if (selectedStationId) {
      setStationIds([selectedStationId]);
    } else {
      // If "All Stations" is selected, include all station IDs
      setStationIds(stations.map((station) => station.id));
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <div className="flex flex-col items-center space-y-1">
        <div className="flex space-x-4">
          <button
            onClick={handlePrevDay}
            className="my-button text-xs"
          >
            Previous Day
          </button>
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="my-button"
          />
          <button
            onClick={handleNextDay}
            className="my-button text-xs"
          >
            Next Day
          </button>
        </div>
        <div className="flex space-x-1"></div>

        {/* New dropdown for station selection */}
        <select
          value={selectedStation}
          onChange={handleStationChange}
          className="my-button text-xs mb-4"
        >
          <option value="">All Stations</option>
          {stations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-500 mt-4">Loading...</p>
      ) : (
        <div className="space-y-8">
          {observationsDataDay && (
            <div className="mt-4">
              <DayAveragesTable dayAverages={observationsDataDay} />
            </div>
          )}
          {observationsDataHour && (
            <div className="mt-4">
              <HourWxTable hourAverages={observationsDataHour} />
            </div>
          )}
        </div>
      )}

      {/* Weather Data Update Status Widget, not working now, probably unnecessary */}
      {/* <div className="mt-8 p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">
          Weather Data Update Status
        </h2>
        {lastUpdateTime ? (
          <p>Last update: {lastUpdateTime}</p>
        ) : (
          <p>No updates yet</p>
        )}
      </div> */}
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
