'use client';

import { format, addDays, subDays } from 'date-fns';
import moment from 'moment-timezone';
import React, { useState, useEffect, useRef, useMemo } from 'react';

import DayAveragesTable from './dayWxTable';
import processAllWxData from '../app/api/allWxprocessor';
import wxTableDataDay from './dayWxTableData';
//import { ObservationsData } from './types'; // Add this import

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [submittedDate, setSubmittedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [observationsData, setObservationsData] = useState<{
    data: any[];
    title: string;
  } | null>(null);

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
  );

  useEffect(() => {
    const fetchData = async () => {
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

        const result = await processAllWxData(
          start_time_pdt,
          end_time_pdt,
          stationIds,
          auth
        );

        const processedData = wxTableDataDay(
          result.observationsData,
          result.unitConversions
        );

        setObservationsData(processedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [submittedDate, selectedDate, stationIds, auth]);

  return (
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
      ) : observationsData ? (
        <>
          <DayAveragesTable dayAverages={observationsData} />
        </>
      ) : (
        <p>No data available</p>
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
