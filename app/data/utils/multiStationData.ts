// app/data/utils/multiStationData.ts
import type { WeatherStation } from '../../map/map';

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
  if (!stations || !stations.length) {
    return { data: [], title: '' };
  }
  
  // Process each station in the array
  const enhancedStations = stations.map((station, index) => {
    // Handle different possible field names for station identification
    const stationIdentifier = station.Station || station.name || station.id;

    // Step 1: Look for this station's data in observationsDataDay
    if (observationsDataDay?.data?.length) {
      const stationDayObservation = observationsDataDay.data.find(
        (obs: any) => obs.Station === stationIdentifier
      );
      
      if (stationDayObservation) {
        // Step 2: Merge station props with observation data (same logic as single station)
        const enhancedStation = {
          ...station, // Keep all existing station properties
          // Ensure Station field is available for consistency
          Station: stationIdentifier,
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
          'ObservationDate': stationDayObservation['Start Date Time'] || stationDayObservation['Date'] || new Date().toISOString(),
          'Elevation': stationDayObservation['Elevation'] || station['Elevation'] || '-',
          'Latitude': stationDayObservation['Latitude'] || station['Latitude'] || '-',
          'Longitude': stationDayObservation['Longitude'] || station['Longitude'] || '-',
          'Relative Humidity': stationDayObservation['Relative Humidity'] || station['Relative Humidity'] || '-',
          'Solar Radiation': stationDayObservation['Solar Radiation'] || station['Solar Radiation'] || '-',
        };

        return enhancedStation;
      }
    }
    
    // Fallback: use raw station data, but ensure Station field exists
    const fallbackStation = {
      ...station,
      Station: stationIdentifier  // Ensure Station field exists for consistency
    };
    
    return fallbackStation;
  });
  
  // Step 3: Create title for multiple stations
  const stationNames = stations.map(s => s.Station || s.name || s.id);
  const title = stations.length === 1 
    ? `${stationNames[0]} - Summary`
    : `${stationNames.join(', ')}`;
  
  const result = {
    data: enhancedStations, // ← Array of all enhanced stations
    title: title
  };
  
  return result;
}