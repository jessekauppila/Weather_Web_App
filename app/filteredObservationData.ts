import moment from 'moment-timezone';
import { WxTableOptions } from './types';
import { filterSnowDepthOutliers, calculateSnowDepthAccumulation, SNOW_DEPTH_CONFIG, SNOW_DEPTH_24H_CONFIG } from './snowDepthUtils';



export function filteredObservationData(
  observationsData: Array<Record<string, any>>,
  options: WxTableOptions
) {
  const { startHour, endHour, mode } = options;

  //console.log('OBSERVATIONS DATA in filteredObservationData:', observationsData);

  // Filter all snow depth data first
  const filteredSnowDepth = filterSnowDepthOutliers(
    observationsData.map(obs => ({
      date_time: obs.date_time,
      snow_depth: obs.snow_depth
    })),
    SNOW_DEPTH_CONFIG
  );

  const filteredSnowDepth24h = filterSnowDepthOutliers(
    observationsData.map(obs => ({
      date_time: obs.date_time,
      snow_depth: obs.snow_depth_24h
    })),
    SNOW_DEPTH_24H_CONFIG
  );

  // Create lookup maps for quick access
  const snowDepthMap = new Map(
    filteredSnowDepth.map(item => [item.date_time, item.snow_depth])
  );
  const snowDepth24hMap = new Map(
    filteredSnowDepth24h.map(item => [item.date_time, item.snow_depth])
  );

  // Apply filtered values to original data
  const filteredObservations = observationsData.map(obs => ({
    ...obs,
    snow_depth: snowDepthMap.get(obs.date_time),
    snow_depth_24h: snowDepth24hMap.get(obs.date_time)
  }));

  // Group the filtered data
  const groupedObservations = mode === 'summary'
    ? groupByStation(filteredObservations)
    : groupByDay(filteredObservations, startHour, endHour);

  // Only log the final output once
  //console.log('Snow Accumulation 24h OUTPUT:', filteredSnowDepth24h);
  console.log('GROUPED OBSERVATIONS:', groupedObservations);
  return groupedObservations;
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