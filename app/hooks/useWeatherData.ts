import { useState, useEffect } from 'react';
import { fetchWeatherData } from '../utils/fetchWeatherData';
import { DayRangeType } from '../types';
import moment from 'moment-timezone';

/**
 * Custom hook for managing weather observation data
 * Handles:
 * - Daily observations data state
 * - Hourly observations data state
 * - Filtered hourly observations data state
 * - Loading states and metric/imperial toggle
 * - Auto-refreshes data when time range or stations change
 */
export function useWeatherData(
  timeRangeData: any,
  stationIds: string[],
  tableMode: 'summary' | 'daily',
  startHour: number,
  endHour: number,
  dayRangeType: DayRangeType
) {
  const [observationsDataDay, setObservationsDataDay] = useState<{
    data: any[];
    title: string;
  } | null>(null);

  const [observationsDataHour, setObservationsDataHour] = useState<{
    data: any[];
    title: string;
  } | null>(null);

  const [filteredObservationsDataHour, setFilteredObservationsDataHour] = useState<{
    data: any[];
    title: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isMetric, setIsMetric] = useState(false);

  useEffect(() => {
  }, [isMetric]);

  const handleRefresh = async (newIsMetric?: boolean) => {
    console.log('📊 WEATHER DATA: Refreshing data', {
      start: timeRangeData.start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      end: timeRangeData.end_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      stations: stationIds.length,
      tableMode,
      isMetric: newIsMetric ?? isMetric
    });
    
    setIsLoading(true);
    
    await fetchWeatherData({
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
      isMetric: newIsMetric ?? isMetric
    });
    
    console.log('📊 WEATHER DATA: Data refresh complete');
  };

  // Track dependencies for data refreshes
  useEffect(() => {
    console.log('📊 WEATHER DATA: Dependencies changed, refreshing data', {
      timeRangeStart: timeRangeData.start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      timeRangeEnd: timeRangeData.end_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      stationIds: stationIds.length, 
      dayRangeType
    });
    
    handleRefresh();
  }, [timeRangeData, stationIds]);

  return {
    observationsDataDay,
    observationsDataHour,
    filteredObservationsDataHour,
    isLoading,
    isMetric,
    setIsMetric,
    handleRefresh,
    setObservationsDataDay,
    setObservationsDataHour,
    setFilteredObservationsDataHour,
    setIsLoading
  };
}