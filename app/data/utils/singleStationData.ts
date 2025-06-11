// app/data/utils/singleStationData.ts
import type { WeatherStation } from '../..//map/map';

export interface SingleStationDataOptions {
  station: WeatherStation | null;
  observationsDataDay: any;
}

export interface SingleStationDataResult {
  data: WeatherStation[];
  title: string;
}

/**
 * Processes single station data by merging station properties with observation data
 */
export function processSingleStationData({ 
  station, 
  observationsDataDay 
}: SingleStationDataOptions): SingleStationDataResult {
  console.log('🟢 SINGLE STATION DATA PROCESSOR - Entry:', {
    station: station,
    stationFields: station ? Object.keys(station) : [],
    stationStation: station?.Station,
    stationName: station?.name,
    hasObservationsData: !!observationsDataDay?.data?.length
  });

  if (!station) return { data: [], title: '' };
  
  // Step 1: Look for this station's data in observationsDataDay
  if (observationsDataDay?.data?.length) {
    // Try both possible field names for station identification
    const stationIdentifier = station.Station || station.name || station.id;
    
    console.log('🟢 LOOKING FOR STATION:', {
      stationIdentifier: stationIdentifier,
      searchField: station.Station ? 'Station' : (station.name ? 'name' : 'id'),
      availableObservationStations: observationsDataDay.data.map((obs: any) => obs.Station)
    });

    const stationDayObservation = observationsDataDay.data.find(
      (obs: any) => obs.Station === stationIdentifier
    );
    
    if (stationDayObservation) {
      console.log('🟢 FOUND OBSERVATION DATA for:', stationIdentifier, {
        observationData: stationDayObservation
      });

      // Step 2: Merge station props with observation data
      const enhancedStation = {
        ...station, // Base station properties
        // Override with fresh observation data
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
      
      console.log('🟢 ENHANCED STATION:', {
        enhancedStation: enhancedStation
      });

      // Step 3: Return single-item array with title
      return {
        data: [enhancedStation],
        title: `${stationIdentifier} - ${observationsDataDay.title}`
      };
    } else {
      console.log('🟢 NO OBSERVATION DATA found for:', stationIdentifier);
    }
  }
  
  // Fallback: just use raw station data
  console.log('🟢 USING RAW STATION DATA:', station);
  return {
    data: [station],
    title: station.Station || station.name || station.id || ''
  };
}