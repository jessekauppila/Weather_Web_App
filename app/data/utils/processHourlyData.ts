import type { WeatherStation } from '../../map/map';

export interface UnfilteredHourlyDataOptions {
  stations: WeatherStation[];
  observationsDataHour: any;
  isMultiStationMode: boolean;
}

export interface UnfilteredHourlyDataResult {
  data: any[];
  stationData: { [stationName: string]: any[] };
  title: string;
}

/**
 * Processes unfiltered hourly data for single or multiple stations, with detailed logging.
 */
export function processHourlyData({
  stations,
  observationsDataHour,
  isMultiStationMode,
}: UnfilteredHourlyDataOptions): UnfilteredHourlyDataResult {
  console.log('[processUnfilteredHourlyData] called with', {
    stationCount: stations.length,
    isMultiStationMode,
    hasData: !!observationsDataHour?.data,
  });

  if (!observationsDataHour?.data || stations.length === 0) {
    console.log('[processUnfilteredHourlyData] No data or stations provided.');
    return {
      data: [],
      stationData: {},
      title: 'No Raw Hourly Data Available',
    };
  }

  if (isMultiStationMode) {
    const stationDataMap: { [stationName: string]: any[] } = {};
    const allData: any[] = [];

    stations.forEach((station) => {
      const stationIdentifier = station.Station || station.name || station.id;
      const stationData = observationsDataHour.data.filter(
        (obs: { Station: string }) => obs.Station === stationIdentifier
      );
      const enhancedData = stationData.map((hourData: { [key: string]: any }) => ({
        ...hourData,
        Stid: station.Stid,
        Elevation: station.Elevation,
        ObservationId: `${hourData.Day || ''}-${hourData.Hour || ''}-${hourData.Station || ''}`,
      }));
      stationDataMap[stationIdentifier] = enhancedData;
      allData.push(...enhancedData);

      console.log(
        `[processUnfilteredHourlyData] Multi: Station ${stationIdentifier} - ${enhancedData.length} records`
      );
    });

    return {
      data: allData,
      stationData: stationDataMap,
      title: `Raw Hourly Data - ${stations.length} Stations`,
    };
  }

  // Single station mode
  const station = stations[0];
  const filteredData = observationsDataHour.data.filter(
    (obs: { Station: string }) => obs.Station === station.Station
  );
  const enhancedData = filteredData.map((hourData: { [key: string]: any }) => ({
    ...hourData,
    Stid: station.Stid,
    Elevation: station.Elevation,
    ObservationId: `${hourData.Day || ''}-${hourData.Hour || ''}-${hourData.Station || ''}`,
  }));

  console.log(
    `[processUnfilteredHourlyData] Single: Station ${station.Station} - ${enhancedData.length} records`
  );

  return {
    data: enhancedData,
    stationData: { [station.Station]: enhancedData },
    title: `Raw Hourly Data - ${station.Station}`,
  };
} 