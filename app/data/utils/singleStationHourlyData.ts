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
  if (!station || !filteredObservationsDataHour?.data) {
    return {
      data: [],
      title: station ? `Filtered Hourly Data - ${station.Station}` : ''
    };
  }

  const stationData = filteredObservationsDataHour.data.filter(
    (obs: { Station: string }) => obs.Station === station.Station
  );

  return {
    data: stationData,
    title: `Filtered Hourly Data - ${station.Station}`
  };
}