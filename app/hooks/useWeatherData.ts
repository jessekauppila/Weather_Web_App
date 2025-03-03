import { useState, useEffect } from 'react';
import { fetchWeatherData } from '../utils/fetchWeatherData';
import { DayRangeType } from '../types';

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
  tableMode: string,
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
    console.log('📄 Page: isMetric state changed to:', isMetric);
  }, [isMetric]);

  const handleRefresh = async (newIsMetric?: boolean) => {
    console.log('🔄 Fetching weather data with isMetric:', newIsMetric ?? isMetric);
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
  };

  useEffect(() => {
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