'use client';

import { format, addDays, subDays } from 'date-fns';
import moment from 'moment-timezone';
import React, { useState, useEffect, useRef, useMemo } from 'react';

import DayAveragesTable from './dayWxTable';
import processAllWxData from './weatherData/allWxprocessor';
import wxTableDataDay from './wxTableDataDay';
//import { ObservationsData } from './types'; // Add this import

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [submittedDate, setSubmittedDate] = useState(new Date());

  const handleDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedDate(new Date(event.target.value));
  };

  const handleSubmit = () => {
    setSubmittedDate(selectedDate);
  };

  const handlePrevDay = () => {
    setSelectedDate((prevDate) => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate((prevDate) => addDays(prevDate, 1));
  };

  const auth: string = '50a07f08af2fe5ca0579c21553e1c9029e04';
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
  ); // Empty dependency array means this will only be computed once

  const [observationsData, setObservationsData] = useState<
    Array<Record<string, any>>
  >([]);
  const [unitConversions, setUnitConversions] = useState<
    Record<string, string>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const start_time_pst = moment(selectedDate).tz(
          'America/Los_Angeles'
        );
        const end_time_pst = moment(selectedDate)
          .add(1, 'day')
          .tz('America/Los_Angeles');

        const result = await processAllWxData(
          start_time_pst,
          end_time_pst,
          stationIds,
          auth
        );
        console.log('Data received from processAllWxData:', result);

        const observationsData = result.observationsData; // Extract the array
        const unitConversions = result.unitConversions; // Extract unit conversions
        setUnitConversions(unitConversions); // Set unit conversions in state

        const processedData = wxTableDataDay(
          observationsData,
          unitConversions
        ); // Pass unit conversions
        console.log('Processed data:', processedData);
        setObservationsData(processedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [submittedDate, selectedDate, stationIds, auth]); // Include all dependencies here

  return (
    // Names and Like button implementation...
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <div className="flex flex-col items-center space-y-1">
        <div className="flex space-x-4">
          <button onClick={handlePrevDay} className="my-button">
            Previous Day
          </button>
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="my-button"
          />
          <button onClick={handleNextDay} className="my-button">
            Next Day
          </button>
        </div>
        <div className="flex space-x-1"></div>
        <div className="flex space-x-1">
          <button onClick={handleSubmit} className="my-button">
            Submit Selected Date
          </button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h2 className="text-gray-800">Daily Data</h2>
          <DayAveragesTable dayAverages={observationsData} />
        </>
      )}
    </main>
  );
}

//all stid's for station data....
// '1',
// '14',
// '11',
// '12',
// '13',
// '14',
// '17',
// '18',
// '19',
// '2',
// '20',
// '21',
// '22',
// '23',
// '24',
// '25',
// '26',
// '27',
// '28',
// '29',
// '3',
// '30',
// '31',
// '32',
// '33',
// '34',
// '35',
// '36',
// '37',
// '39',
// '4',
// '40',
// '41',
// '42',
// '43',
// '44',
// '45',
// '46',
// '47',
// '48',
// '49',
// '5',
// '50',
// '51',
// '53',
// '54',
// '56',
// '57',
// '6',
// '7',
// '8',
// '9',
// ];
