import moment from 'moment-timezone';
import { WxTableOptions } from './types';
import { filterSnowDepthOutliers, calculateSnowDepthAccumulation, SNOW_DEPTH_CONFIG, SNOW_DEPTH_24H_CONFIG } from './snowDepthUtils';



export function filteredObservationData(
  observationsData: Array<Record<string, any>>,
  options: WxTableOptions
) {
  //console.log('Filtering observations:', { observationsData, options });

  const { startHour, endHour, mode } = options;

  //console.log('OBSERVATIONS DATA in filteredObservationData:', observationsData);

  // Group the filtered data first
  const groupedObservations = mode === 'summary'
    ? groupByStation(observationsData)
    : groupByDay(observationsData, startHour, endHour);

  // Process each station group separately
  const processedGroups = Object.entries(groupedObservations).reduce((acc, [stid, stationData]) => {
    // Filter snow depth for this stationß
    const filteredSnowDepth = filterSnowDepthOutliers(
      stationData.map((obs: Record<string, any>) => ({
        date_time: obs.date_time,
        snow_depth: obs.snow_depth,
        stid
      })),
      SNOW_DEPTH_CONFIG
    );

    const filteredSnowDepth24h = filterSnowDepthOutliers(
      stationData.map((obs: Record<string, any>) => ({
        date_time: obs.date_time,
        snow_depth: obs.snow_depth_24h,
        stid
      })),
      SNOW_DEPTH_24H_CONFIG
    );

    // Create lookup maps for this station
    const snowDepthMap = new Map(
      filteredSnowDepth.map(item => [item.date_time, item.snow_depth])
    );
    const snowDepth24hMap = new Map(
      filteredSnowDepth24h.map(item => [item.date_time, item.snow_depth])
    );

    // Apply filtered values to station data
    acc[stid] = stationData.map((obs: Record<string, any>) => ({
      ...obs,
      snow_depth: snowDepthMap.get(obs.date_time),
      snow_depth_24h: snowDepth24hMap.get(obs.date_time)
    }));

    return acc;
  }, {} as Record<string, Array<Record<string, any>>>);

  return processedGroups;
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