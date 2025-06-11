// app/data/utils/multiStationData.ts
import type { WeatherStation } from '../../components/map/map';

export interface MultiStationDataOptions {
  stations: WeatherStation[];
  observationsDataDay: any;
}

export interface MultiStationDataResult {
  data: WeatherStation[];
  title: string;
}

/**
 * Processes multiple stations data by enhancing each station with observation data
 */
export function processMultiStationData({ 
  stations, 
  observationsDataDay 
}: MultiStationDataOptions): MultiStationDataResult {
  if (!stations.length) return { data: [], title: '' };
  
  console.log('🟠 CONSTRUCTING MULTI-STATION DATA:', {
    stationsCount: stations.length,
    stationNames: stations.map(s => s.Station),
    hasObservationsData: !!observationsDataDay?.data?.length
  });
  
  // Process each station in the array
  const enhancedStations = stations.map((station) => {
    // Step 1: Look for this station's data in observationsDataDay
    if (observationsDataDay?.data?.length) {
      const stationDayObservation = observationsDataDay.data.find(
        (obs: any) => obs.Station === station.Station
      );
      
      if (stationDayObservation) {
        console.log('🟠 FOUND OBSERVATION DATA for:', station.Station);
        
        // Step 2: Merge station props with observation data (same logic as single station)
        return {
          ...station, // Keep all existing station properties
          // Update with fresh observation data
          'Cur Air Temp': stationDayObservation['Cur Air Temp'] || station['Cur Air Temp'] || '-',
          'Air Temp Min': stationDayObservation['Air Temp Min'] || station['Air Temp Min'] || '-',
          'Air Temp Max': stationDayObservation['Air Temp Max'] || station['Air Temp Max'] || '-',
          'Total Snow Depth': stationDayObservation['Total Snow Depth'] || station['Total Snow Depth'] || '-',
          'Total Snow Depth Change': stationDayObservation['Total Snow Depth Change'] || station['Total Snow Depth Change'] || '-',
          '24h Snow Accumulation': stationDayObservation['24h Snow Accumulation'] || station['24h Snow Accumulation'] || '-',
          'Wind Speed Avg': stationDayObservation['Wind Speed Avg'] || station['Wind Speed Avg'] || '-',
          'Max Wind Gust': stationDayObservation['Max Wind Gust'] || station['Max Wind Gust'] || '-',
          'Wind Direction': stationDayObservation['Wind Direction'] || station['Wind Direction'] || '-',
          'Precip Accum One Hour': stationDayObservation['Precip Accum One Hour'] || station['Precip Accum One Hour'] || '-',
          'Date': stationDayObservation['Date'] || stationDayObservation['Day'] || new Date().toLocaleDateString(),
          'ObservationDate': stationDayObservation['Start Date Time'] || stationDayObservation['Date'] || new Date().toISOString()
        };
      } else {
        console.log('🟠 NO OBSERVATION DATA for:', station.Station, '- using raw station data');
      }
    }
    
    // Fallback: use raw station data
    return station;
  });
  
  // Step 3: Create title for multiple stations
  const stationNames = stations.map(s => s.Station);
  const title = stations.length === 1 
    ? `${stationNames[0]} - Summary`
    : `Station Comparison (${stations.length} stations): ${stationNames.join(', ')}`;
  
  console.log('🟠 MULTI-STATION DATA RESULT:', {
    dataLength: enhancedStations.length,
    title: title
  });
  
  return {
    data: enhancedStations, // ← Array of all enhanced stations
    title: title
  };
}