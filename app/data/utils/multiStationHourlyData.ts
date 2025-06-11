// app/data/utils/multiStationHourlyData.ts
import type { WeatherStation } from '../../map/map';

export interface MultiStationHourlyDataOptions {
  stations: WeatherStation[];
  filteredObservationsDataHour: any;
  isMultiStationMode: boolean;
}

export interface MultiStationHourlyDataResult {
  data: any[]; // Combined data for compatibility
  stationData: { [stationName: string]: any[] }; // Separated by station
  title: string;
}

/**
 * Processes multiple stations hourly data by filtering and organizing data for each station
 */
export function processMultiStationHourlyData({ 
  stations, 
  filteredObservationsDataHour,
  isMultiStationMode
}: MultiStationHourlyDataOptions): MultiStationHourlyDataResult {
  if (!stations.length || !filteredObservationsDataHour?.data) {
    return {
      data: [],
      stationData: {},
      title: 'Multi-Station Hourly Data'
    };
  }

  // Create data structure: { stationName: hourlyDataArray }
  const stationDataMap: { [stationName: string]: any[] } = {};
  const allFilteredData: any[] = [];

  stations.forEach(station => {
    const stationIdentifier = station.Station || station.name || station.id;
    
    const stationHourlyData = filteredObservationsDataHour.data.filter(
      (obs: { Station: string }) => obs.Station === stationIdentifier
    );

    stationDataMap[stationIdentifier] = stationHourlyData;
    allFilteredData.push(...stationHourlyData);
  });

  const result = {
    data: allFilteredData, // Combined data for compatibility
    stationData: stationDataMap, // Separated by station
    title: `Multi-Station Hourly Data (${stations.length} stations)`
  };

  return result;
}