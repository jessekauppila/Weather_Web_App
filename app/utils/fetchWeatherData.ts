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
}: FetchWeatherDataProps) {
  // More detailed logs for time parameters and request data
  console.log('⏰ Time Parameters FULL DETAILS:', { 
    startHour, 
    endHour, 
    dayRangeType,
    timeRangeStart: timeRangeData.start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
    timeRangeEnd: timeRangeData.end_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
    timeRangeStartObj: timeRangeData.start_time_pdt.toDate(),
    timeRangeEndObj: timeRangeData.end_time_pdt.toDate()
  });

  // Existing log
  console.log('⏰ Time Parameters:', { 
    startHour, 
    endHour, 
    dayRangeType,
    timeRangeStart: timeRangeData.start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
    timeRangeEnd: timeRangeData.end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
  });

  //console.log('📡 fetchWeatherData: Sending request with isMetric:', isMetric);

  
  try {
    // First, fetch stations data
    // console.log('🏔️ Fetching stations data...');
    // const stationsResponse = await fetch('/api/getStations');
    
    // if (!stationsResponse.ok) {
    //   throw new Error('Failed to fetch stations');
    // }
    
    // const stations = await stationsResponse.json();
    // console.log('📍 Stations data:', stations);
    
    //////////////////////////////////////////////////////////

    const { start_time_pdt, end_time_pdt } = timeRangeData;
    
    console.log('🔍 About to fetch with dates:', {
      start: start_time_pdt.toISOString(),
      end: end_time_pdt.toISOString(),
      stationIds,
      isMetric
    });
   
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
    console.log('✅ API returned successfully with result keys:', Object.keys(result));
    console.log('📊 Observations count:', Object.keys(result.observations || {}).length);

    //////////////////////////////////////////////////////////
    
    const filteredData = filteredObservationData(result.observations, {
      mode: tableMode,
      startHour,
      endHour,
      dayRangeType,
      start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
    }, isMetric);

    console.log('🔎 Filtered data - days included:', 
      Object.values(filteredData || {})
        .flat()
        .map((item: any) => item.Day)
        .filter((v: any, i: number, a: any[]) => a.indexOf(v) === i)
    );

    // Uncomment log for filtered data
    //console.log('filteredData:', filteredData);

    //////////////////////////////////////////////////////////

  
    // Since wxTableDataDayFromDB is now async, we need to await it
    const dayData = await wxTableDataDayFromDB(filteredData, result.units, {
      mode: tableMode,
      startHour,
      endHour,
      dayRangeType,
      start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
    }, isMetric);
  
    // Uncomment log for day data
    //console.log('dayData', dayData);

    setObservationsDataDay(dayData);

    //////////////////////////////////////////////////////////

    const dayDataSplit = await wxTableDataDaySplit(filteredData, result.units, {
      mode: tableMode,
      startHour,
      endHour,
      dayRangeType,
      start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
    }, isMetric);
    
    // Uncomment log for day data split
    //console.log('dayDataSplit', dayDataSplit);

    //////////////////////////////////////////////////////////

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
  
  } catch (error) {
    setIsLoading(false);
    console.error('Error fetching weather data:', error);
  }
}

