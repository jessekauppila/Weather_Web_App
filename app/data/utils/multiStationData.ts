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
  console.log('🟠 MULTI-STATION DATA PROCESSOR - Entry:', {
    stationsInput: stations,
    stationsCount: stations?.length || 0,
    stationNames: stations?.map(s => s.Station || s.name || s.id) || [],
    stationStructures: stations?.map(s => ({ 
      fields: Object.keys(s), 
      Station: s.Station, 
      name: s.name, 
      id: s.id 
    })) || [],
    observationsDataDay: observationsDataDay,
    hasObservationsData: !!observationsDataDay?.data?.length,
    observationsDataLength: observationsDataDay?.data?.length || 0
  });

  if (!stations || !stations.length) {
    console.log('🟠 MULTI-STATION DATA PROCESSOR - No stations, returning empty');
    return { data: [], title: '' };
  }
  
  console.log('🟠 CONSTRUCTING MULTI-STATION DATA:', {
    stationsCount: stations.length,
    stationNames: stations.map(s => s.Station || s.name || s.id),
    hasObservationsData: !!observationsDataDay?.data?.length
  });

  // LOG: Sample observation data structure
  if (observationsDataDay?.data?.length > 0) {
    console.log('🟠 SAMPLE OBSERVATION DATA:', {
      firstObservation: observationsDataDay.data[0],
      observationStations: observationsDataDay.data.map((obs: any) => obs.Station),
      observationFields: Object.keys(observationsDataDay.data[0] || {})
    });
  }
  
  // Process each station in the array
  const enhancedStations = stations.map((station, index) => {
    // Handle different possible field names for station identification
    const stationIdentifier = station.Station || station.name || station.id;
    
    console.log(`🟠 PROCESSING STATION ${index + 1}/${stations.length}:`, {
      stationName: stationIdentifier,
      stationId: station.Stid || station.id,
      originalStationData: station,
      stationFields: Object.keys(station),
      usingField: station.Station ? 'Station' : (station.name ? 'name' : 'id')
    });

    // Step 1: Look for this station's data in observationsDataDay
    if (observationsDataDay?.data?.length) {
      const stationDayObservation = observationsDataDay.data.find(
        (obs: any) => obs.Station === stationIdentifier
      );
      
      if (stationDayObservation) {
        console.log('🟠 FOUND OBSERVATION DATA for:', stationIdentifier, {
          observationData: stationDayObservation,
          observationFields: Object.keys(stationDayObservation)
        });
        
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

        console.log('🟠 ENHANCED STATION:', {
          stationName: stationIdentifier,
          enhancedStation: enhancedStation,
          enhancedFields: Object.keys(enhancedStation),
          weatherDataSample: {
            'Cur Air Temp': enhancedStation['Cur Air Temp'],
            'Total Snow Depth': enhancedStation['Total Snow Depth'],
            'Wind Speed Avg': enhancedStation['Wind Speed Avg']
          }
        });

        return enhancedStation;
      } else {
        console.log('🟠 NO OBSERVATION DATA for:', stationIdentifier, '- using raw station data', {
          stationData: station,
          searchedFor: stationIdentifier,
          availableObservationStations: observationsDataDay.data.map((obs: any) => obs.Station)
        });
      }
    } else {
      console.log('🟠 NO OBSERVATIONS DATA AVAILABLE - using raw station data for:', stationIdentifier);
    }
    
    // Fallback: use raw station data, but ensure Station field exists
    const fallbackStation = {
      ...station,
      Station: stationIdentifier  // Ensure Station field exists for consistency
    };
    
    console.log('🟠 USING RAW STATION DATA for:', stationIdentifier, fallbackStation);
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

  console.log('🟠 MULTI-STATION DATA RESULT:', {
    dataLength: enhancedStations.length,
    title: title,
    finalData: result,
    enhancedStationsDetails: enhancedStations.map(station => ({
      name: station.Station,  // Use Station field since we ensure it exists
      fields: Object.keys(station),
      sampleFields: {
        'Cur Air Temp': station['Cur Air Temp'],
        'Total Snow Depth': station['Total Snow Depth'],
        'Wind Speed Avg': station['Wind Speed Avg']
      }
    }))
  });
  
  return result;
}