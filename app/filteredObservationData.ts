import moment from 'moment-timezone';
import { WxTableOptions } from './types';
import { filterSnowDepthOutliers, calculateSnowDepthAccumulation, SNOW_DEPTH_CONFIG, SNOW_DEPTH_24H_CONFIG } from './snowDepthUtils';



export function filteredObservationData(
  observationsData: Array<Record<string, any>>,
  options: WxTableOptions
) {
  const { startHour, endHour, mode } = options;

  console.log('observationsData in filteredObservationData:', observationsData);

  // Group observations
  const groupedObservations = mode === 'summary' 
    ? groupByStation(observationsData)
    : groupByDay(observationsData, startHour, endHour);

  console.log('groupedObservations in filteredObservationData:', groupedObservations);

  // Filter and process observations
  const filteredGroupedObservations = Object.entries(groupedObservations).reduce((acc, [key, observations]) => {
    // Filter snow_depth
    const filteredSnowDepth = filterSnowDepthOutliers(
        observations.map((obs: Record<string, any>) => ({
          date_time: obs.date_time,
          snow_depth: obs.snow_depth
        })),
        SNOW_DEPTH_CONFIG
      );
  
      const filteredSnowDepth24h = filterSnowDepthOutliers(
        observations.map((obs: Record<string, any>) => ({
          date_time: obs.date_time,
          snow_depth: obs.snow_depth_24h
        })),
        SNOW_DEPTH_24H_CONFIG
      );

    const filteredObservations = observations.map((obs, index) => ({
      ...obs,
      snow_depth: filteredSnowDepth[index]?.snow_depth,
      snow_depth_24h: filteredSnowDepth24h[index]?.snow_depth
    }));

    acc[key] = filteredObservations;
    return acc;
  }, {} as typeof groupedObservations);

  // Process the filtered data
  return Object.entries(filteredGroupedObservations).map(([stid, stationObs]) => {
    // Process measurements and create averages object
    const averages: { [key: string]: number | string | any[] } = {
      Stid: stid,
      Station: stationObs[0].station_name,
      Latitude: Number(stationObs[0].latitude),
      Longitude: Number(stationObs[0].longitude),
      Elevation: `${Number(stationObs[0].elevation)} ft`,
      observations: stationObs
    };

    // Process each measurement type
    const measurementKeys = [
      'air_temp',
      'precip_accum_one_hour',
      'relative_humidity',
      'snow_depth',
      'snow_depth_24h',
      'wind_speed',
      'wind_gust',
      'wind_direction',
    ];

    measurementKeys.forEach((key) => {
      const values = stationObs
        .map((obs: Record<string, any>) => obs[key])
        .filter((val: any): val is number | string => val !== null);
      if (values.length > 0) {
        averages[key] = values;
      }
    });

    // Special processing for certain fields
    if (
      Array.isArray(averages['wind_speed']) &&
      averages['wind_speed'].every((v) => v === '')
    ) {
      averages['wind_speed'] = [''];
    }

    ['intermittent_snow', 'precipitation'].forEach((key) => {
      averages[key] = [stationObs[0][key] || ''];
    });

    // Process date_time
    averages['date_time'] = stationObs.map(
      (obs: Record<string, any>) => obs.date_time
    );

    return averages;
  });

  //console.log('filteredGroupedObservations in filteredObservationData:', filteredGroupedObservations);  
  //return filteredGroupedObservations;

}


// Helper functions
// Helper function to group by station (current behavior)
function groupByStation(data: Array<Record<string, any>>) {
    return data.reduce((acc, obs) => {
      if (!acc[obs.stid]) {
        acc[obs.stid] = [];
      }
      acc[obs.stid].push(obs);
      return acc;
    }, {} as Record<string, Array<Record<string, any>>>);
  }
  
  // Helper function to group by day
  function groupByDay(
    data: Array<Record<string, any>>, 
    startHour: number,
    endHour: number
  ) {
    return data.reduce((acc, obs) => {
      const datetime = moment(obs.date_time);
      const dayKey = datetime.format('YYYY-MM-DD');
      
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(obs);
      return acc;
    }, {} as Record<string, Array<Record<string, any>>>);
  }