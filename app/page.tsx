'use client';

import { format, addDays, subDays } from 'date-fns';
import moment from 'moment-timezone';
import React, { useState, useEffect, useRef, useMemo } from 'react';

import DayAveragesTable from './dayWxTable';
// import processAllWxData from '../app/api/allWxprocessor';
// import wxTableDataDay from '../unused/dayWxTableData';
import wxTableDataDayFromDB from './dayWxTableDataDayFromDB';
//import { ObservationsData } from './types'; // Add this import

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  // const [submittedDate, setSubmittedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [observationsData, setObservationsData] = useState<{
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

  //const auth: string = 'xxxxxxxxxxxx';
  const stationIds = useMemo(
    () => [
      '1',
      '14',
      '11',
      '12',
      '13',
      '14',
      '17',
      '18',
      '19',
      '2',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '3',
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '39',
      '4',
      '40',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
      '5',
      '50',
      '51',
      '53',
      '54',
      '56',
      '57',
      '6',
      '7',
      '8',
      '9',
    ],
    []
  );

  //New useEffect for fetching data from the DB
  useEffect(() => {
    const fetchDataFromDB = async () => {
      try {
        console.log('Selected Date:', selectedDate);

        const start_time_pdt = moment(selectedDate)
          .tz('America/Los_Angeles')
          .startOf('day')
          .add(5, 'hours');

        const end_time_pdt = moment(start_time_pdt).add(1, 'day');

        console.log(
          'Start time (PDT):',
          start_time_pdt.format('YYYY-MM-DD HH:mm:ss z')
        );

        console.log(
          'End time (PDT):',
          end_time_pdt.format('YYYY-MM-DD HH:mm:ss z')
        );

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
        console.log('API response:', result);

        // Extract unique stations from the observations
        const uniqueStations = Array.from(
          new Set(
            result.observations.map((obs: any) => obs.station_id)
          )
        ).map((id) => ({
          id: id as string,
          name: result.observations.find(
            (obs: any) => obs.station_id === id
          ).station_name,
        }));
        setStations(uniqueStations);

        const processedData = wxTableDataDayFromDB(
          result.observations,
          result.units
        );

        setObservationsData(processedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchDataFromDB:', error);
        setIsLoading(false);
      }
    };

    fetchDataFromDB();
  }, [selectedDate, stationIds]);

  useEffect(() => {
    const checkAndRunUpdate = async () => {
      const now = new Date();
      console.log(`Checking for update at ${now.toLocaleString()}`);

      const minutes = now.getMinutes();

      if (minutes === 1 || minutes === 5 || minutes === 20) {
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
        {/* <div className="flex space-x-1">
          <button onClick={handleSubmit} className="my-button">
            Submit Selected Date
          </button>
        </div> */}

        {/* New dropdown for station selection */}
        <select
          value={selectedStation}
          onChange={(e) => setSelectedStation(e.target.value)}
          className="my-button text-xs"
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
        <p>Loading...</p>
      ) : observationsData ? (
        <>
          <DayAveragesTable
            dayAverages={
              selectedStation
                ? {
                    ...observationsData,
                    data: observationsData.data.filter(
                      (row) => row.station_id === selectedStation
                    ),
                  }
                : observationsData
            }
          />
        </>
      ) : (
        <p>No data available</p>
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
