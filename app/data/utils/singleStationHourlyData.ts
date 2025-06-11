// app/data/utils/singleStationHourlyData.ts
import type { WeatherStation } from '../../map/map';

export interface SingleStationHourlyDataOptions {
  station: WeatherStation | null;
  filteredObservationsDataHour: any;
}

export interface SingleStationHourlyDataResult {
  data: any[];
  title: string;
}

/**
 * Processes single station hourly data by filtering observations for the specific station
 */
export function processSingleStationHourlyData({ 
  station, 
  filteredObservationsDataHour 
}: SingleStationHourlyDataOptions): SingleStationHourlyDataResult {
  console.log('🔵 SINGLE STATION HOURLY DATA PROCESSOR - Entry:', {
    station: station,
    stationFields: station ? Object.keys(station) : [],
    stationStation: station?.Station,
    stationName: station?.name,
    stationId: station?.id,
    filteredObservationsDataHour: filteredObservationsDataHour,
    hasFilteredObservationsData: !!filteredObservationsDataHour?.data,
    filteredDataLength: filteredObservationsDataHour?.data?.length || 0,
    firstFewObservations: filteredObservationsDataHour?.data?.slice(0, 3) || []
  });

  if (!station || !filteredObservationsDataHour?.data) {
    console.log('🔵 SINGLE STATION HOURLY DATA PROCESSOR - Early return (no station or data):', {
      hasStation: !!station,
      hasFilteredData: !!filteredObservationsDataHour?.data
    });
    return {
      data: [],
      title: station ? `Filtered Hourly Data - ${station.Station}` : ''
    };
  }

  // Log sample of available stations in the data
  const availableStations = [...new Set(
    filteredObservationsDataHour.data.map((obs: { Station: string }) => obs.Station)
  )].slice(0, 10);
  
  console.log('🔵 SINGLE STATION HOURLY DATA PROCESSOR - Available stations in data:', {
    availableStations: availableStations,
    totalUniqueStations: new Set(filteredObservationsDataHour.data.map((obs: { Station: string }) => obs.Station)).size,
    lookingForStation: station.Station,
    isStationInData: availableStations.includes(station.Station)
  });

  const stationData = filteredObservationsDataHour.data.filter(
    (obs: { Station: string }) => obs.Station === station.Station
  );

  console.log('🔵 SINGLE STATION HOURLY DATA PROCESSOR - Filter result:', {
    originalDataLength: filteredObservationsDataHour.data.length,
    filteredDataLength: stationData.length,
    title: `Filtered Hourly Data - ${station.Station}`,
    sampleFilteredData: stationData.slice(0, 3),
    firstFilteredItem: stationData[0],
    lastFilteredItem: stationData[stationData.length - 1]
  });

  return {
    data: stationData,
    title: `Filtered Hourly Data - ${station.Station}`
  };
}