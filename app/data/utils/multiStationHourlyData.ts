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
  console.log('🟣 MULTI-STATION HOURLY DATA PROCESSOR - Entry:', {
    stations: stations,
    stationsLength: stations.length,
    isMultiStationMode: isMultiStationMode,
    filteredObservationsDataHour: filteredObservationsDataHour,
    hasFilteredObservationsData: !!filteredObservationsDataHour?.data,
    filteredDataLength: filteredObservationsDataHour?.data?.length || 0
  });

  if (!stations.length || !filteredObservationsDataHour?.data) {
    console.log('🟣 MULTI-STATION HOURLY DATA PROCESSOR - Early return:', {
      hasStations: stations.length > 0,
      hasFilteredData: !!filteredObservationsDataHour?.data
    });
    return {
      data: [],
      stationData: {},
      title: 'Multi-Station Hourly Data'
    };
  }

  // Get available stations in the hourly data
  const availableStations = [...new Set(
    filteredObservationsDataHour.data.map((obs: { Station: string }) => obs.Station)
  )];

  console.log('🟣 MULTI-STATION HOURLY DATA PROCESSOR - Station matching:', {
    stationNames: stations.map(s => s.Station || s.name || s.id),
    availableStations: availableStations.slice(0, 10),
    totalAvailableStations: availableStations.length
  });

  // Create data structure: { stationName: hourlyDataArray }
  const stationDataMap: { [stationName: string]: any[] } = {};
  const allFilteredData: any[] = [];

  stations.forEach(station => {
    const stationIdentifier = station.Station || station.name || station.id;
    
    const stationHourlyData = filteredObservationsDataHour.data.filter(
      (obs: { Station: string }) => obs.Station === stationIdentifier
    );

    console.log(`🟣 MULTI-STATION HOURLY DATA PROCESSOR - Station ${stationIdentifier}:`, {
      stationIdentifier: stationIdentifier,
      matchedRecords: stationHourlyData.length,
      sampleData: stationHourlyData.slice(0, 2)
    });

    stationDataMap[stationIdentifier] = stationHourlyData;
    allFilteredData.push(...stationHourlyData);
  });

  const result = {
    data: allFilteredData, // Combined data for compatibility
    stationData: stationDataMap, // Separated by station
    title: `Multi-Station Hourly Data (${stations.length} stations)`
  };

  console.log('🟣 MULTI-STATION HOURLY DATA PROCESSOR - Final result:', {
    totalCombinedRecords: result.data.length,
    stationDataKeys: Object.keys(result.stationData),
    stationRecordCounts: Object.entries(result.stationData).map(([station, data]) => ({
      station,
      recordCount: data.length
    })),
    title: result.title
  });

  return result;
}