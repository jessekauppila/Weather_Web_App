import { parseISO, format } from 'date-fns';

// Add these configurations at the top of the file
export const SNOW_DEPTH_CONFIG = {
  threshold: 10,          // inches threshold
  maxPositiveChange: 4,   // max hourly change
  maxNegativeChange: 10,  // max negative change
  windowSize: 12,         // window size
  useEarlySeasonFilter: true
} as const;

export const SNOW_DEPTH_24H_CONFIG = {
  threshold: 10,
  maxPositiveChange: 3,
  maxNegativeChange: 36,
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
  readonly stdDevMultiplier?: number;
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
  
    // Sort data
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );

    console.log('Initial data:', {
      length: sortedData.length,
      validValues: sortedData.filter(d => !isNaN(d.snow_depth)).length,
      data: sortedData
    });

    // Find reset window data
    const resetWindowStart = "05:00:00";
    const resetWindowEnd = "10:00:00";
    
    const resetWindow = sortedData.filter((entry) => {
      const entryTime = parseISO(entry.date_time);
      const entryHour = format(entryTime, "HH:mm:ss");
      return entryHour >= resetWindowStart && entryHour <= resetWindowEnd;
    });

    console.log('Reset window data:', {
      length: resetWindow.length,
      window: resetWindow
    });

    // Find reset point
    let resetIndex: number | null = null;
    if (resetWindow.length > 0) {
      const minDepth = Math.min(...resetWindow.map((entry) => entry.snow_depth));
      resetIndex = sortedData.findIndex((entry) => entry.snow_depth === minDepth);
      console.log('Reset point found:', {
        index: resetIndex,
        minDepth,
        time: resetIndex !== null ? sortedData[resetIndex].date_time : null
      });
    }

    // Split data at reset point
    const beforeReset = resetIndex !== null ? sortedData.slice(0, resetIndex + 1) : sortedData;
    const afterReset = resetIndex !== null ? sortedData.slice(resetIndex + 1) : [];

    console.log('Split data:', {
      beforeReset: { length: beforeReset.length },
      afterReset: { length: afterReset.length }
    });

    // Apply median filtering to each segment
    const medianFilter = (segment: SnowDataPoint[]): SnowDataPoint[] => {
      const kernelSize = windowSize;
      return segment.map((point, index) => {
        // Get window of values centered on current point
        const halfKernel = Math.floor(kernelSize / 2);
        const start = Math.max(0, index - halfKernel);
        const end = Math.min(segment.length, index + halfKernel + 1);
        const window = segment.slice(start, end)
          .map(p => p.snow_depth)
          .filter(d => !isNaN(d))
          .sort((a, b) => a - b);
        
        const median = window.length % 2 === 0
          ? (window[window.length / 2 - 1] + window[window.length / 2]) / 2
          : window[Math.floor(window.length / 2)];

        // Check conditions
        const previousDepth = index > 0 ? segment[index - 1].snow_depth : point.snow_depth;
        const hourlyChange = point.snow_depth - previousDepth;
        
        const isIncreasingTooQuickly = hourlyChange > maxPositiveChange;
        const isDecreasingTooQuickly = hourlyChange < -maxNegativeChange;
        
        return {
          date_time: point.date_time,
          snow_depth: (isIncreasingTooQuickly || isDecreasingTooQuickly) 
            ? NaN 
            : median,
          rollingAvg: median
        };
      });
    };

    // Apply filtering to both segments
    const beforeResetFiltered = medianFilter(beforeReset);
    const afterResetFiltered = medianFilter(afterReset);

    console.log('After median filtering:', {
      beforeReset: {
        length: beforeResetFiltered.length,
        validValues: beforeResetFiltered.filter(d => !isNaN(d.snow_depth)).length
      },
      afterReset: {
        length: afterResetFiltered.length,
        validValues: afterResetFiltered.filter(d => !isNaN(d.snow_depth)).length
      }
    });

    // Combine filtered segments
    let filteredData = [...beforeResetFiltered, ...afterResetFiltered];

    console.log('Combined filtered data:', {
      length: filteredData.length,
      validValues: filteredData.filter(d => !isNaN(d.snow_depth)).length,
      data: filteredData
    });

    // Apply early season filter if enabled
    if (useEarlySeasonFilter) {
      let validSnowStarted = false;
      filteredData = filteredData.map(point => {
        if (!validSnowStarted && (point.rollingAvg ?? 0) > threshold) {
          validSnowStarted = true;
        }
        return validSnowStarted ? point : { ...point, snow_depth: NaN };
      });

      console.log('After early season filter:', {
        length: filteredData.length,
        validValues: filteredData.filter(d => !isNaN(d.snow_depth)).length,
        validSnowStarted: validSnowStarted
      });
    }

    return filteredData;
}

// Helper function moved outside to keep the main function cleaner
function calculateRollingAverage(index: number, data: SnowDataPoint[], windowSize: number): number {
  const windowStart = Math.max(0, index - windowSize + 1);
  const windowValues = data
    .slice(windowStart, index + 1)
    .map(d => d.snow_depth)
    .filter(d => !isNaN(d));
  
  return windowValues.length > 0
    ? windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length
    : 0;
}

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