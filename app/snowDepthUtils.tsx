// Add these configurations at the top of the file
export const SNOW_DEPTH_CONFIG = {
  threshold: 10,          // inches threshold
  maxPositiveChange: 3,   // max hourly change
  maxNegativeChange: 10,  // max negative change
  windowSize: 12,         // window size
  useEarlySeasonFilter: true
} as const;

export const SNOW_DEPTH_24H_CONFIG = {
  threshold: 10,
  maxPositiveChange: 3,
  maxNegativeChange: 10,
  windowSize: 12,
  useEarlySeasonFilter: false
} as const;

// This interface defines the structure of each snow measurement data point
interface SnowDataPoint {
  date_time: string;
  snow_depth: number;
  rollingAvg?: number;  // Optional since it's added during processing
}

// Update the type for the config parameter
interface SnowDepthConfig {
  readonly threshold: number;
  readonly maxPositiveChange: number;
  readonly maxNegativeChange: number;
  readonly windowSize: number;
  readonly useEarlySeasonFilter: boolean;
}

// This function filters out unreliable snow depth measurements based on several criteria
export function filterSnowDepthOutliers(
    data: SnowDataPoint[],
    config: SnowDepthConfig
): SnowDataPoint[] {
    const {
      threshold,
      maxPositiveChange,
      maxNegativeChange,
      windowSize,
      useEarlySeasonFilter
    } = config;
    
    if (data.length === 0) return [];
  
    // Ensure data is in chronological order for proper analysis
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );
  
    // Helper function that calculates the average snow depth over a sliding window
    // This helps smooth out temporary fluctuations in measurements
    const calculateRollingAverage = (index: number): number => {
      const windowStart = Math.max(0, index - windowSize + 1);
      const windowValues = sortedData
        .slice(windowStart, index + 1)
        .map(d => d.snow_depth)
        .filter(d => !isNaN(d));
      
      return windowValues.length > 0
        ? windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length
        : 0;
    };
  
    // Calculate rolling averages for all data points
    const filteredData = sortedData.map((point, index) => ({
      ...point,
      rollingAvg: calculateRollingAverage(index)
    }));
  
    // Track whether we've reached valid snow season and previous valid measurement
    let validSnowStarted = false;
    const result: SnowDataPoint[] = [];
    let previousValidDepth: number | null = null;
  
    // Process each data point to determine if it's valid
    for (let i = 0; i < filteredData.length; i++) {
      const current = filteredData[i];
      
      // Early season filter: Marks all measurements as invalid until
      // rolling average exceeds threshold (indicating consistent snow cover)
      if (useEarlySeasonFilter) {
        if (!validSnowStarted && current.rollingAvg > threshold) {
          validSnowStarted = true;
        }
  
        if (!validSnowStarted) {
          result.push({
            date_time: current.date_time,
            snow_depth: NaN  // NaN indicates invalid measurement
          });
          continue;
        }
      }
  
      // Calculate how much snow depth changed since last valid measurement
      // Used to detect unrealistic changes that are likely measurement errors
      const hourlyChange = previousValidDepth !== null 
        ? current.snow_depth - previousValidDepth
        : 0;
  
      // Mark as invalid if change exceeds reasonable limits
      if (hourlyChange > maxPositiveChange || hourlyChange < -maxNegativeChange) {
        result.push({
          date_time: current.date_time,
          snow_depth: NaN
        });
      } else {
        // Measurement passes all validity checks
        result.push({
          date_time: current.date_time,
          snow_depth: current.snow_depth
        });
        previousValidDepth = current.snow_depth;
      }
    }
  
    // Return only the valid measurements (those not marked as NaN)
    const validPoints = result.filter(d => !isNaN(d.snow_depth));
    
    return result;
  }

 
 //////////////////////////////////////////////////////////////////////// 
  export function calculateSnowDepthAccumulation(data: any[]) {
    const results = [];
    let snowTotal = 0;
    const recentHours = [];
  
    for (let i = 0; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1] || {
        snow_depth: current.snow_depth,
      };
  
      const new_snow = Math.max(
        0,
        current.snow_depth - previous.snow_depth
      );
  
      snowTotal += new_snow;
      recentHours.push(new_snow);
  
      results.push({
        date_time: current.date_time,
        snow_depth: current.snow_depth,
        new_snow,
        snow_total: snowTotal,
      });
    }
  
    return results;
  }

export default {
  SNOW_DEPTH_CONFIG,
  SNOW_DEPTH_24H_CONFIG,
  filterSnowDepthOutliers,
  calculateSnowDepthAccumulation
};