// Add these configurations at the top of the file
export const SNOW_DEPTH_CONFIG = {
  threshold: 0,          // inches threshold
  maxPositiveChange: 4,   // max hourly change
  maxNegativeChange: 10,  // max negative change
  windowSize: 24,         // window size
  upperIQRMultiplier: 1,
  lowerIQRMultiplier: 2,
  applyIdenticalCheck: true    // Enable for total snow depth
} as const;

export const SNOW_DEPTH_24H_CONFIG = {
  threshold: -1,
  maxPositiveChange: 4,
  maxNegativeChange: 30,
  windowSize: 24,
  upperIQRMultiplier: 2,
  lowerIQRMultiplier: 1,
  applyIdenticalCheck: false   // Disable for 24h snow
} as const;

// This interface defines the structure of each snow measurement data point
interface SnowDataPoint {
  date_time: string;
  snow_depth: number | null;
  stid?: string;
}

// Update the type for the config parameter
interface SnowDepthConfig {
  readonly threshold: number;
  readonly maxPositiveChange: number;
  readonly maxNegativeChange: number;
  readonly windowSize: number;
  readonly upperIQRMultiplier?: number;
  readonly lowerIQRMultiplier?: number;
  readonly applyIdenticalCheck?: boolean;  // New flag
}

// New separate function for IQR filtering
function applyIQRFilter(
    sortedData: SnowDataPoint[],
    windowSize: number,
    upperIQRMultiplier: number,
    lowerIQRMultiplier: number
): SnowDataPoint[] {
    const cacheKey = createIQRCacheKey(sortedData, windowSize, upperIQRMultiplier, lowerIQRMultiplier);
    const cached = iqrCache.get(cacheKey);
    if (cached) return cached;

    const result = sortedData.map((point, index) => {
      const halfKernel = Math.floor(windowSize / 2);
      const start = Math.max(0, index - halfKernel);
      const end = Math.min(sortedData.length, index + halfKernel + 1);
      const window = sortedData.slice(start, end)
        .map(p => p.snow_depth)
        .filter(d => d !== null && !isNaN(d))
        .sort((a, b) => (a ?? 0) - (b ?? 0));
      
      if (window.length === 0) {
        return {
          date_time: point.date_time,
          snow_depth: null
        };
      }

      const q1Index = Math.floor(window.length * 0.25);
      const q3Index = Math.floor(window.length * 0.75);
      const q3 = window[q3Index] ?? 0;
      const q1 = window[q1Index] ?? 0;
      const iqr = q3 - q1;
      const lowerBound = q1 - (lowerIQRMultiplier * iqr);
      const upperBound = q3 + (upperIQRMultiplier * iqr);

      const isOutlier = point.snow_depth === null || point.snow_depth < lowerBound || point.snow_depth > upperBound;
      //const median = window[Math.floor(window.length / 2)];
      
      // console.log(`IQR Filter - Point ${index}:`, {
      //   date_time: point.date_time,
      //   snow_depth: point.snow_depth,
      //   isOutlier
      // });

      // console.log(`IQR Filter - Point ${index}:`, {
      //   //date_time: point.date_time,
      //   //snow_depth: point.snow_depth,
      //   //isOutlier,
        // upperBound: upperBound.toFixed(2),
        // lowerBound: lowerBound.toFixed(2),
        // upperMultiplier: upperIQRMultiplier,
        // lowerMultiplier: lowerIQRMultiplier,
        // q1,
        // q3,
      //   iqr: iqr.toFixed(2)
      // });

      return {
        date_time: point.date_time,
        snow_depth: isOutlier ? null : point.snow_depth
      };
    });

    iqrCache.set(cacheKey, result);
    return result;
}

// New separate function for hourly change limits
function applyHourlyChangeLimits(
    data: SnowDataPoint[],
    maxPositiveChange: number,
    maxNegativeChange: number
): SnowDataPoint[] {
    return data.map((point, index) => {
      // If current point is null or NaN, return as is
      if (point.snow_depth === null || isNaN(point.snow_depth)) {
        return point;
      }

      // For first point, look ahead instead of back
      if (index === 0) {
        let nextValidDepth: number | null = null;
        let j = 1;
        while (j < data.length) {
          const currentDepth = data[j].snow_depth;
          if (currentDepth !== null && !isNaN(currentDepth)) {
            nextValidDepth = currentDepth;
            break;
          }
          j++;
        }

        if (nextValidDepth !== null && point.snow_depth !== null) {
          const change = point.snow_depth - nextValidDepth;
          const hoursForward = j;
          const scaledMaxChange = maxPositiveChange * hoursForward;
          
          if (Math.abs(change) > scaledMaxChange) {
            return {
              ...point,
              snow_depth: null
            };
          }
        }
      }

      // Original logic for non-first points
      let previousDepth = null;
      let i = index - 1;
      let hoursBack = 0;
      
      while (i >= 0) {
        const currentDepth = data[i].snow_depth;
        if (currentDepth !== null && !isNaN(currentDepth)) {
          previousDepth = currentDepth;
          hoursBack = index - i;
          break;
        }
        i--;
      }
      
      if (previousDepth !== null && point.snow_depth !== null) {
        const hourlyChange = point.snow_depth - previousDepth;
        const scaledMaxPositiveChange = maxPositiveChange * hoursBack;
        const scaledMaxNegativeChange = maxNegativeChange * hoursBack;
        
        const isInvalidChange = 
          hourlyChange > scaledMaxPositiveChange || 
          hourlyChange < -scaledMaxNegativeChange;

        return {
          ...point,
          snow_depth: isInvalidChange ? null : point.snow_depth
        };
      }
      
      return point;
    });
}

// Update the cache key creation to be more reliable
const filterCache = new Map<string, SnowDataPoint[]>();
const iqrCache = new Map<string, SnowDataPoint[]>();

function createCacheKey(data: SnowDataPoint[], config: SnowDepthConfig): string {
    // Create a simpler key using essential data
    const dataKey = data.map(d => `${d.date_time}:${d.snow_depth}`).join('|');
    const configKey = Object.values(config).join(':');
    return `${dataKey}-${configKey}`;
}

function createIQRCacheKey(
    data: SnowDataPoint[], 
    windowSize: number, 
    upperMultiplier: number, 
    lowerMultiplier: number
): string {
    const dataKey = data.map(d => `${d.date_time}:${d.snow_depth}`).join('|');
    return `${dataKey}-${windowSize}-${upperMultiplier}-${lowerMultiplier}`;
}

// Helper function to create a cache key
function createFilterCacheKey(
    data: SnowDataPoint[],
    config: SnowDepthConfig,
    isSnow24h: boolean
): string {
    // Create a unique key based on the input parameters and data
    const dataHash = data.map(point => 
        `${point.date_time}:${point.snow_depth}`
    ).join('|');
    const configHash = `${config.maxPositiveChange}-${config.maxNegativeChange}-${config.windowSize}`;
    return `${dataHash}-${configHash}-${isSnow24h}`;
}

// Main function with separated steps
export function filterSnowDepthOutliers(
    data: SnowDataPoint[],
    config: SnowDepthConfig,
    isMetric: boolean = false
): SnowDataPoint[] {
    // Convert all snow_depth values to numbers at the start
    const numericData = data.map(point => ({
        ...point,
        snow_depth: point.snow_depth === null ? null : Number(point.snow_depth)
    }));

    //console.log('1. Initial data (converted to numbers):', numericData);

    // // Log original config
    // console.log('Original config:', {
    //     threshold: config.threshold,
    //     maxPositiveChange: config.maxPositiveChange,
    //     maxNegativeChange: config.maxNegativeChange,
    //     isMetric
    // });

    // Convert config values to metric if needed
    const workingConfig = isMetric ? {
        ...config,
        threshold: config.threshold * 2.54,
        maxPositiveChange: config.maxPositiveChange * 2.54,
        maxNegativeChange: config.maxNegativeChange * 2.54,
    } : config;

    // // Log converted config
    // console.log('Working config:', {
    //     threshold: workingConfig.threshold,
    //     maxPositiveChange: workingConfig.maxPositiveChange,
    //     maxNegativeChange: workingConfig.maxNegativeChange,
    //     isMetric
    // });

    //console.log('1. Initial data:', data);

    const isSnow24h = workingConfig.applyIdenticalCheck === false;
    const logPrefix = isSnow24h ? '[24h Snow]' : '[Total Snow]';

    // Generate cache key and check cache first
    const cacheKey = createFilterCacheKey(data, workingConfig, isSnow24h);
    const cached = filterCache.get(cacheKey);
    
    if (cached) {
          // console.log(`${logPrefix} ⚡ Using cached result:`, {
          //     dataPoints: cached.length
          // });
        return cached;
    }

    const {
      maxPositiveChange,
      maxNegativeChange,
      windowSize,
      upperIQRMultiplier = 1.5,
      lowerIQRMultiplier = 1.5
    } = workingConfig;
    
    if (data.length === 0) return [];
  
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );

    // console.log(`${logPrefix} Sorted Data:`, sortedData);

   //Apply the identical check here
    const processedData = workingConfig.applyIdenticalCheck 
      ? applyIdenticalCheck(sortedData)
      : sortedData;
    //console.log('2. After identical check:', processedData);
    
    //console.log(`${logPrefix} 🔄 Applying IQR filter...`);
    const iqrFiltered = applyIQRFilter(processedData, windowSize, upperIQRMultiplier, lowerIQRMultiplier);
    //console.log('3. After IQR filter:', iqrFiltered);

    const nanCountIQR = iqrFiltered.filter(p => p.snow_depth === null || isNaN(p.snow_depth)).length;
    // console.log(`${logPrefix} 📊 After IQR filtering:`, {
    //     totalPoints: iqrFiltered.length,
    //     validPoints: iqrFiltered.length - nanCountIQR,
    //     invalidPoints: nanCountIQR
    // });
    // console.log(`${logPrefix} Data with IQR limits:`, iqrFiltered);


    // console.log(`${logPrefix} 🔄 Applying hourly limits...`);
    const hourlyChangeLimits = applyHourlyChangeLimits(iqrFiltered, maxPositiveChange, maxNegativeChange);
    //console.log('4. Final result:', hourlyChangeLimits);

    
    const nanCountFinal = hourlyChangeLimits.filter(p => p.snow_depth === null || isNaN(p.snow_depth)).length;
    // console.log(`${logPrefix} 🏁 Final results:`, {
    //     totalPoints: hourlyChangeLimits.length,
    //     validPoints: hourlyChangeLimits.length - nanCountFinal,
    //     invalidPoints: nanCountFinal,
    //     firstValidPoint: hourlyChangeLimits.find(p => p.snow_depth !== null && !isNaN(p.snow_depth)),
    //     lastValidPoint: [...hourlyChangeLimits].reverse().find(p => p.snow_depth !== null && !isNaN(p.snow_depth))
    // });


    // Store result in cache before returning
    filterCache.set(cacheKey, hourlyChangeLimits);
    
    // Optional: Implement cache size limit
    if (filterCache.size > 1000) { // Adjust size limit as needed
        const firstKey = filterCache.keys().next().value;
        if (typeof firstKey === 'string') {
        filterCache.delete(firstKey);
        }
    }

    return hourlyChangeLimits;
}

// Export cache management functions
export const clearFilterCache = () => filterCache.clear();

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

  // Add this new function
export function calculatePrecipitationAccumulation(data: any[]) {
  const results = [];
  let precipTotal = 0;
  const recentHours = [];

  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    const currentPrecip = parseFloat(current['Precip Accum'] || "0");
    
    // Skip invalid values
    if (isNaN(currentPrecip)) continue;
    
    precipTotal += currentPrecip;
    recentHours.push(currentPrecip);

    results.push({
      date_time: current.date_time,
      precip: currentPrecip,
      precip_total: Number(precipTotal.toFixed(2))
    });
  }

  return results;
}

// Function to check for identical elements to the third decimal place against all other elements
function applyIdenticalCheck(data: SnowDataPoint[]): SnowDataPoint[] {
  return data.map((currentPoint) => {
    // Skip if point is invalid
    if (!currentPoint || currentPoint.snow_depth === null || currentPoint.snow_depth === undefined) {
      return currentPoint;
    }

    try {
      const currentDepth = typeof currentPoint.snow_depth === 'string' 
        ? Number(currentPoint.snow_depth)
        : currentPoint.snow_depth;

      const hasIdenticalValue = data.some((comparePoint) => {
        if (!comparePoint || comparePoint.snow_depth === null || comparePoint.snow_depth === undefined) {
          return false;
        }

        const compareDepth = typeof comparePoint.snow_depth === 'string'
          ? Number(comparePoint.snow_depth)
          : comparePoint.snow_depth;

        return currentDepth === compareDepth && currentPoint !== comparePoint;
      });

      return hasIdenticalValue ? {
        ...currentPoint,
        snow_depth: null
      } : currentPoint;
    } catch (error) {
      console.error('Error processing snow depth:', error);
      return currentPoint;
    }
  });
}

const snowDepthUtils = {
  SNOW_DEPTH_CONFIG,
  SNOW_DEPTH_24H_CONFIG,
  filterSnowDepthOutliers,
  calculateSnowDepthAccumulation,
  clearFilterCache
};

export default snowDepthUtils;