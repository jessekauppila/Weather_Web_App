import moment from 'moment-timezone';
import { WxTableOptions } from './types';
import { filterSnowDepthOutliers, calculateSnowDepthAccumulation, SNOW_DEPTH_CONFIG, SNOW_DEPTH_24H_CONFIG } from './snowDepthUtils';



export function filteredObservationData(
  observationsData: Array<Record<string, any>>,
  options: WxTableOptions
) {
  const { startHour, endHour, mode } = options;

  //console.log('observationsData in filteredObservationData:', observationsData);

  // Group observations
  const groupedObservations = mode === 'summary' 
    ? groupByStation(observationsData)
    : groupByDay(observationsData, startHour, endHour);

  //console.log('groupedObservations in filteredObservationData:', groupedObservations);

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

    const filteredObservations = observations.map((obs: Record<string, any>, index: number) => ({
      ...obs,
      snow_depth: filteredSnowDepth[index]?.snow_depth,
      snow_depth_24h: filteredSnowDepth24h[index]?.snow_depth
    }));

    acc[key] = filteredObservations;
    return acc;
  }, {} as typeof groupedObservations);

  //console.log('filteredGroupedObservations in filteredObservationData:', filteredGroupedObservations);
  return filteredGroupedObservations;
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