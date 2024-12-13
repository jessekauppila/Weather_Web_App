import { filteredObservationData } from '../filteredObservationData';
import wxTableDataDayFromDB from '../dayWxTableDataDayFromDB';
import hourWxTableDataFromDB  from '../hourWxTableDataFromDB';
import hourWxTableDataFiltered  from '../hourWxTableDataFiltered';


interface FetchWeatherDataProps {
  timeRangeData: {
    start_time_pdt: moment.Moment;
    end_time_pdt: moment.Moment;
  };
  stationIds: string[];
  tableMode: 'summary' | 'daily';
  startHour: number;
  endHour: number;
  dayRangeType: string;
  setObservationsDataDay: (data: any) => void;
  setObservationsDataHour: (data: any) => void;
  setFilteredObservationsDataHour: (data: any) => void;
  setIsLoading: (loading: boolean) => void;
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
  setIsLoading
}: FetchWeatherDataProps) {
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
        stationIds: stationIds,
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
    setIsLoading(false);
  
  } catch (error) {
    setIsLoading(false);
    console.error('Error fetching weather data:', error);
  }
}