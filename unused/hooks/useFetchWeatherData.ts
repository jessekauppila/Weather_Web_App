//MAYBE CAN DELETE?????

import { useState } from 'react';
import { filteredObservationData } from '../filteredObservationData';
import wxTableDataDayFromDB from '../dayWxTableDataDayFromDB';
import hourWxTableDataFromDB from '../hourWxTableDataFromDB';
import hourWxTableDataFiltered from '../hourWxTableDataFiltered';
import moment from 'moment';

export enum DayRangeType {
  MIDNIGHT = 'MIDNIGHT',
  CURRENT = 'CURRENT',
  CUSTOM = 'CUSTOM'
}

interface FetchWeatherDataProps {
  timeRangeData: {
    start_time_pdt: moment.Moment;
    end_time_pdt: moment.Moment;
  };
  stationIds: string[];
  tableMode: 'summary' | 'daily';
  startHour: number;
  endHour: number;
  dayRangeType: DayRangeType;
}

export function useFetchWeatherData() {
  const [isLoading, setIsLoading] = useState(false);
  const [observationsDataDay, setObservationsDataDay] = useState<{ 
    data: { [key: string]: string | number }[]; 
    title: string; 
  } | null>(null);
  const [observationsDataHour, setObservationsDataHour] = useState<{
    data: { [key: string]: string | number }[];
    title: string;
  } | null>(null);
  const [filteredObservationsDataHour, setFilteredObservationsDataHour] = useState<{
    data: any[];
    title: string;
  } | null>(null);

  const fetchData = async ({
    timeRangeData,
    stationIds,
    tableMode,
    startHour,
    endHour,
    dayRangeType
  }: FetchWeatherDataProps) => {
    setIsLoading(true);
    try {
      const { start_time_pdt, end_time_pdt } = timeRangeData;
      
      const response = await fetch('/api/getObservationsFromDB', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: start_time_pdt.toISOString(),
          endDate: end_time_pdt.toISOString(),
          stationIds,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const result = await response.json();
      
      const filteredData = filteredObservationData(result.observations, {
        mode: tableMode,
        startHour,
        endHour,
        dayRangeType,
        start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
        end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
      });

      setObservationsDataDay(wxTableDataDayFromDB(filteredData, result.units, {
        mode: tableMode,
        startHour,
        endHour,
        dayRangeType,
        start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
        end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
      }));
      
      setObservationsDataHour(hourWxTableDataFromDB(
        Object.values(result.observations) as any[][] as any[],
        result.units
      ));

      setFilteredObservationsDataHour(hourWxTableDataFiltered(Object.values(filteredData).flat()));
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchData,
    isLoading,
    observationsDataDay,
    observationsDataHour,
    filteredObservationsDataHour
  };
}
