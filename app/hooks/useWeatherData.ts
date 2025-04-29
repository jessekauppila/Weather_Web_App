import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchWeatherData } from '../utils/fetchWeatherData';
import { DayRangeType } from '../types';
import moment from 'moment-timezone';
import { debounce } from 'lodash';
import { stat } from 'fs';

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
  const [dataReady, setDataReady] = useState(false);

  const debouncedFetchData = useMemo(() => 
    debounce((fetchProps) => {
      fetchWeatherData(fetchProps);
    }, 300), // 300ms debounce time
    []
  );

  const handleDataLoaded = useCallback(() => {
    setIsLoading(false);
    setDataReady(true);
  }, []);

  const handleRefresh = async (newIsMetric?: boolean) => {
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
      isMetric: newIsMetric ?? isMetric,
      onDataLoaded: handleDataLoaded
    });
  };

  const startTimeISO = timeRangeData.start_time_pdt.toISOString();
  const endTimeISO = timeRangeData.end_time_pdt.toISOString();

  // Track dependencies for data refreshes
  useEffect(() => {
    // Prevent fetching if stationIds is empty or not yet loaded
    if (!stationIds.length) {
      return;
    }

    // Reset data ready state when fetching new data
    setDataReady(false);
    
    debouncedFetchData({
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
      onDataLoaded: handleDataLoaded
    });
    
    // Clean up
    return () => {
      debouncedFetchData.cancel();
    };
  }, [
    // Only include direct dependencies that should trigger a data refresh
    startTimeISO,
    endTimeISO,
    stationIds.length, // Only care about length changes, not reference changes
    dayRangeType,
    tableMode,
    isMetric,
    handleDataLoaded,
    debouncedFetchData,
    endHour,
    startHour,
    stationIds,
    timeRangeData
  ]);

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
    setIsLoading,
    dataReady
  };
}