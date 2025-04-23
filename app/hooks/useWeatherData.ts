import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchWeatherData } from '../utils/fetchWeatherData';
import { DayRangeType } from '../types';
import moment from 'moment-timezone';
import { debounce } from 'lodash';

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

  console.log('🔴 WEATHER DATA: Received timeRangeData', {
    start: timeRangeData.start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
    end: timeRangeData.end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
  });

  useEffect(() => {
    console.log('🔴 WEATHER DATA: Effect triggered with timeRangeData', {
      start: timeRangeData.start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      end: timeRangeData.end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
    });
  }, [timeRangeData]);

  useEffect(() => {
  }, [isMetric]);

  const debouncedFetchData = useMemo(() => 
    debounce((fetchProps) => {
      console.log('📊 WEATHER DATA: Refreshing data (debounced)', {
        start: fetchProps.timeRangeData.start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
        end: fetchProps.timeRangeData.end_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
        stations: fetchProps.stationIds.length,
        tableMode: fetchProps.tableMode,
        isMetric: fetchProps.isMetric
      });
      
      fetchWeatherData(fetchProps);
    }, 300), // 300ms debounce time
    []
  );

  const handleDataLoaded = useCallback(() => {
    setIsLoading(false);
    setDataReady(true);
    console.log('📊 WEATHER DATA: Data refresh complete and ready');
  }, []);

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
      isMetric: newIsMetric ?? isMetric,
      onDataLoaded: handleDataLoaded
    });
    
    console.log('📊 WEATHER DATA: Data refresh complete');
  };

  // Track dependencies for data refreshes
  useEffect(() => {
    // Prevent fetching if stationIds is empty or not yet loaded
    if (!stationIds.length) {
      return;
    }

    console.log('📊 WEATHER DATA: Dependencies changed, refreshing data', {
      timeRangeStart: timeRangeData.start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      timeRangeEnd: timeRangeData.end_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
      stationIds: stationIds.length,
      dayRangeType
    });

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
    timeRangeData.start_time_pdt.toISOString(), // Convert to string for stable comparisons
    timeRangeData.end_time_pdt.toISOString(),   // Convert to string for stable comparisons
    stationIds.length, // Only care about length changes, not reference changes
    dayRangeType,
    tableMode,
    isMetric,
    handleDataLoaded
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