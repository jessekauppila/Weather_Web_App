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
  maxNegativeChange: 4,
  windowSize: 24,
  upperIQRMultiplier: 1,
  lowerIQRMultiplier: 2,
  applyIdenticalCheck: false   // Disable for 24h snow
} as const;

// This interface defines the structure of each snow measurement data point
interface SnowDataPoint {
  date_time: string;
  snow_depth: number;
  stid?: string;  // Add station ID as optional parameter
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
        .filter(d => !isNaN(d))
        .sort((a, b) => a - b);
      
      if (window.length === 0) {
        return {
          date_time: point.date_time,
          snow_depth: NaN
        };
      }

      const q1Index = Math.floor(window.length * 0.25);
      const q3Index = Math.floor(window.length * 0.75);
      const q1 = window[q1Index];
      const q3 = window[q3Index];
      const iqr = q3 - q1;
      const lowerBound = q1 - (lowerIQRMultiplier * iqr);
      const upperBound = q3 + (upperIQRMultiplier * iqr);

      const isOutlier = point.snow_depth < lowerBound || point.snow_depth > upperBound;
      //const median = window[Math.floor(window.length / 2)];
      
      // console.log(`IQR Filter - Point ${index}:`, {
      //   date_time: point.date_time,
      //   snow_depth: point.snow_depth,
      //   isOutlier
      // });

      console.log(`IQR Filter - Point ${index}:`, {
      //   //date_time: point.date_time,
      //   //snow_depth: point.snow_depth,
      //   //isOutlier,
        upperBound: upperBound.toFixed(2),
        lowerBound: lowerBound.toFixed(2),
        upperMultiplier: upperIQRMultiplier,
        lowerMultiplier: lowerIQRMultiplier,
        q1,
        q3,
      //   iqr: iqr.toFixed(2)
      });

      return {
        date_time: point.date_time,
        snow_depth: isOutlier ? NaN : point.snow_depth
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

      // For first point, look ahead instead of back if it's significantly different from next valid points
      if (index === 0) {
        let nextValidDepth = null;
        let j = 1;
        while (j < data.length) {
          if (data[j].snow_depth !== null && !isNaN(data[j].snow_depth)) {
            nextValidDepth = data[j].snow_depth;
            break;
          }
          j++;
        }

        if (nextValidDepth !== null) {
          const change = point.snow_depth - nextValidDepth;
          const hoursForward = j;
          const scaledMaxChange = maxPositiveChange * hoursForward;
          
          if (Math.abs(change) > scaledMaxChange) {
            return {
              ...point,
              snow_depth: NaN
            };
          }
        }
      }

      // Original logic for non-first points
      let previousDepth = null;
      let i = index - 1;
      let hoursBack = 0;
      
      while (i >= 0) {
        if (data[i].snow_depth !== null && !isNaN(data[i].snow_depth)) {
          previousDepth = data[i].snow_depth;
          hoursBack = index - i;
          break;
        }
        i--;
      }
      
      if (previousDepth !== null) {
        const hourlyChange = point.snow_depth - previousDepth;
        const scaledMaxPositiveChange = maxPositiveChange * hoursBack;
        const scaledMaxNegativeChange = maxNegativeChange * hoursBack;
        
        const isInvalidChange = 
          hourlyChange > scaledMaxPositiveChange || 
          hourlyChange < -scaledMaxNegativeChange;

        return {
          ...point,
          snow_depth: isInvalidChange ? NaN : point.snow_depth
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
    config: SnowDepthConfig
): SnowDataPoint[] {
    const isSnow24h = config === SNOW_DEPTH_24H_CONFIG;
    const logPrefix = isSnow24h ? '[24h Snow]' : '[Total Snow]';

    // Generate cache key and check cache first
    const cacheKey = createFilterCacheKey(data, config, isSnow24h);
    const cached = filterCache.get(cacheKey);
    
    if (cached) {
        console.log(`${logPrefix} ⚡ Using cached result:`, {
            dataPoints: cached.length
        });
        return cached;
    }

    console.log(`${logPrefix} Starting filter with:`, {
        dataPoints: data.length,
        config,
        firstPoint: data[0],
        lastPoint: data[data.length - 1]
    });

    const {
      maxPositiveChange,
      maxNegativeChange,
      windowSize,
      upperIQRMultiplier = 1.5,
      lowerIQRMultiplier = 1.5
    } = config;
    
    if (data.length === 0) return [];
  
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );

    console.log(`${logPrefix} Sorted Data:`, sortedData);

   //Apply the identical check here
    const processedData = config.applyIdenticalCheck 
      ? applyIdenticalCheck(sortedData)
      : sortedData;
    console.log(`${logPrefix} Identical Check:`, processedData);
    
    console.log(`${logPrefix} 🔄 Applying IQR filter...`);
    const iqrFiltered = applyIQRFilter(processedData, windowSize, upperIQRMultiplier, lowerIQRMultiplier);
    
    const nanCountIQR = iqrFiltered.filter(p => isNaN(p.snow_depth)).length;
    console.log(`${logPrefix} 📊 After IQR filtering:`, {
        totalPoints: iqrFiltered.length,
        validPoints: iqrFiltered.length - nanCountIQR,
        invalidPoints: nanCountIQR
    });
    console.log(`${logPrefix} Data with IQR limits:`, iqrFiltered);


    console.log(`${logPrefix} 🔄 Applying hourly limits...`);
    const hourlyChangeLimits = applyHourlyChangeLimits(iqrFiltered, maxPositiveChange, maxNegativeChange);
    console.log(`${logPrefix} Data with hourly limits:`, hourlyChangeLimits);

    
    const nanCountFinal = hourlyChangeLimits.filter(p => isNaN(p.snow_depth)).length;
    console.log(`${logPrefix} 🏁 Final results:`, {
        totalPoints: hourlyChangeLimits.length,
        validPoints: hourlyChangeLimits.length - nanCountFinal,
        invalidPoints: nanCountFinal,
        firstValidPoint: hourlyChangeLimits.find(p => !isNaN(p.snow_depth)),
        lastValidPoint: [...hourlyChangeLimits].reverse().find(p => !isNaN(p.snow_depth))
    });


    // Store result in cache before returning
    filterCache.set(cacheKey, hourlyChangeLimits);
    
    // Optional: Implement cache size limit
    if (filterCache.size > 1000) { // Adjust size limit as needed
        const firstKey = filterCache.keys().next().value;
        filterCache.delete(firstKey);
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

// Function to check for identical elements to the third decimal place against all other elements
function applyIdenticalCheck(data: SnowDataPoint[]): SnowDataPoint[] {
  console.log('Starting applyIdenticalCheck with data:', data);
  
  return data.map((currentPoint, currentIndex, array) => {
    // Skip if current point is already NaN or undefined
    if (!currentPoint || !currentPoint.snow_depth || isNaN(currentPoint.snow_depth)) {
      console.log('Skipping point due to NaN or undefined:', currentPoint);
      return currentPoint;
    }

    const currentDepth = parseFloat(currentPoint.snow_depth.toFixed(3));
    console.log('Checking currentDepth:', currentDepth, 'at index:', currentIndex);
    
    // Check if this depth appears anywhere else in the array
    const hasIdenticalValue = array.some((comparePoint, compareIndex) => {
      if (!comparePoint || !comparePoint.snow_depth || 
          currentIndex === compareIndex || 
          isNaN(comparePoint.snow_depth)) {
        return false;
      }
      const compareDepth = parseFloat(comparePoint.snow_depth.toFixed(3));
      const isIdentical = currentDepth === compareDepth;
      
      if (isIdentical) {
        console.log('Found identical value:', {
          currentDepth,
          compareDepth,
          currentIndex,
          compareIndex
        });
      }
      
      return isIdentical;
    });

    // If we found an identical value, return NaN
    if (hasIdenticalValue) {
      console.log('Setting NaN for point:', currentPoint);
      return {
        ...currentPoint,
        snow_depth: NaN
      };
    }

    return currentPoint;
  });
}

export default {
  SNOW_DEPTH_CONFIG,
  SNOW_DEPTH_24H_CONFIG,
  filterSnowDepthOutliers,
  calculateSnowDepthAccumulation,
  clearFilterCache
};