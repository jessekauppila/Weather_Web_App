// Add these configurations at the top of the file
export const SNOW_DEPTH_CONFIG = {
  threshold: 10,          // inches threshold
  maxPositiveChange: 4,   // max hourly change
  maxNegativeChange: 10,  // max negative change
  windowSize: 24,         // window size
  useEarlySeasonFilter: true,
  upperIQRMultiplier: 1,
  lowerIQRMultiplier: 2
} as const;

export const SNOW_DEPTH_24H_CONFIG = {
  threshold: 10,
  maxPositiveChange: 4,
  maxNegativeChange: 36,
  windowSize: 12,
  useEarlySeasonFilter: false,
  upperIQRMultiplier: 1,
  lowerIQRMultiplier: 1.5
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
  readonly upperIQRMultiplier?: number;
  readonly lowerIQRMultiplier?: number;
}

// New separate function for IQR filtering
function applyIQRFilter(
    sortedData: SnowDataPoint[],
    windowSize: number,
    upperIQRMultiplier: number,
    lowerIQRMultiplier: number
): SnowDataPoint[] {
    return sortedData.map((point, index) => {
      const halfKernel = Math.floor(windowSize / 2);
      const start = Math.max(0, index - halfKernel);
      const end = Math.min(sortedData.length, index + halfKernel + 1);
      const window = sortedData.slice(start, end)
        .map(p => p.snow_depth)
        .filter(d => !isNaN(d))
        .sort((a, b) => a - b);
      
      if (window.length === 0) {
        return { ...point, snow_depth: NaN, rollingAvg: NaN };
      }

      const q1Index = Math.floor(window.length * 0.25);
      const q3Index = Math.floor(window.length * 0.75);
      const q1 = window[q1Index];
      const q3 = window[q3Index];
      const iqr = q3 - q1;
      const lowerBound = q1 - (lowerIQRMultiplier * iqr);
      const upperBound = q3 + (upperIQRMultiplier * iqr);

      const isOutlier = point.snow_depth < lowerBound || point.snow_depth > upperBound;
      const median = window[Math.floor(window.length / 2)];
      
      return {
        date_time: point.date_time,
        snow_depth: isOutlier ? NaN : point.snow_depth,
        rollingAvg: median
      };
    });
}

// New separate function for hourly change limits
function applyHourlyChangeLimits(
    data: SnowDataPoint[],
    maxPositiveChange: number,
    maxNegativeChange: number
): SnowDataPoint[] {
    return data.map((point, index) => {
      const previousDepth = index > 0 ? data[index - 1].snow_depth : point.snow_depth;
      const hourlyChange = point.snow_depth - previousDepth;
      const isInvalidChange = hourlyChange > maxPositiveChange || hourlyChange < -maxNegativeChange;
      
      return {
        ...point,
        snow_depth: isInvalidChange ? NaN : point.snow_depth
      };
    });
}

// Main function with separated steps
export function filterSnowDepthOutliers(
    data: SnowDataPoint[],
    config: SnowDepthConfig
): SnowDataPoint[] {
    const {
      threshold,
      maxPositiveChange,
      maxNegativeChange,
      windowSize,
      useEarlySeasonFilter,
      upperIQRMultiplier = 2,
      lowerIQRMultiplier = 1.5
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

    // Apply IQR filtering
    const iqrFiltered = applyIQRFilter(sortedData, windowSize, upperIQRMultiplier, lowerIQRMultiplier);

    console.log('After IQR filtering:', {
      length: iqrFiltered.length,
      validValues: iqrFiltered.filter(d => !isNaN(d.snow_depth)).length,
      data: iqrFiltered
    });

    // Apply hourly change limits
    const hourlyFiltered = applyHourlyChangeLimits(iqrFiltered, maxPositiveChange, maxNegativeChange);

    console.log('After hourly change limits:', {
      length: hourlyFiltered.length,
      validValues: hourlyFiltered.filter(d => !isNaN(d.snow_depth)).length,
      data: hourlyFiltered
    });

    // Apply early season filter if enabled
    if (useEarlySeasonFilter) {
      let validSnowStarted = false;
      const finalData = hourlyFiltered.map(point => {
        if (!validSnowStarted && (point.rollingAvg ?? 0) > threshold) {
          validSnowStarted = true;
        }
        return validSnowStarted ? point : { ...point, snow_depth: NaN };
      });

      console.log('After early season filter:', {
        length: finalData.length,
        validValues: finalData.filter(d => !isNaN(d.snow_depth)).length,
        validSnowStarted: validSnowStarted
      });

      return finalData;
    }

    return hourlyFiltered;
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