import { filteredObservationData } from '../data/filteredObservationData';
import wxTableDataDayFromDB from '../data/dayWxTableDataDayFromDB';
import hourWxTableDataFromDB  from '../data/hourWxTableDataFromDB';
import hourWxTableDataFiltered  from '../data/hourWxTableDataFiltered';
import wxTableDataDaySplit from '../data/daySplitWxTableDataDayFromDB';
import { DayRangeType } from '../types';

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
  setObservationsDataDay: (data: any) => void;
  setObservationsDataHour: (data: any) => void;
  setFilteredObservationsDataHour: (data: any) => void;
  setIsLoading: (loading: boolean) => void;
  isMetric: boolean;
  onDataLoaded?: () => void;
}

export async function fetchWeatherData({
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
  isMetric,
  onDataLoaded,
}: FetchWeatherDataProps) {
  try {
    const { start_time_pdt, end_time_pdt } = timeRangeData;
    
    const response = await fetch('/api/getObservationsFromDB', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        startDate: start_time_pdt.toISOString(),
        endDate: end_time_pdt.toISOString(),
        stationIds: stationIds,
        refresh: true,
        isMetric,
      }),
    });
  
    if (!response.ok) {
      throw new Error('API error');
    }
  
    const result = await response.json();
    
    const filteredData = filteredObservationData(result.observations, {
      mode: tableMode,
      startHour,
      endHour,
      dayRangeType,
      start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
    }, isMetric);

    const dayData = await wxTableDataDayFromDB(filteredData, result.units, {
      mode: tableMode,
      startHour,
      endHour,
      dayRangeType,
      start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
    }, isMetric);

    setObservationsDataDay(dayData);

    // const dayDataSplit = await wxTableDataDaySplit(filteredData, result.units, {
    //   mode: tableMode,
    //   startHour,
    //   endHour,
    //   dayRangeType,
    //   start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
    //   end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
    // }, isMetric);

    setObservationsDataHour(hourWxTableDataFromDB(
      Object.values(result.observations) as any[][] as any[],
      result.units,
      isMetric
    ));
  
    setFilteredObservationsDataHour(hourWxTableDataFiltered(
      Object.values(filteredData).flat(),
      isMetric
    ));
    setIsLoading(false);
    
    // Finally, call the onDataLoaded callback if provided
    if (onDataLoaded) {
      onDataLoaded();
    }
  } catch (error) {
    setIsLoading(false);
    console.error('Error fetching weather data:', error);
  }
}

