// Add this type definition at the top of the file
interface SnowDataPoint {
  date_time: string;
  snow_depth: number;
  rollingAvg?: number;  // Optional since it's added during processing
}
export function filterSnowDepthOutliers(
    data: SnowDataPoint[],
    threshold = 10,          // Minimum reliable snow depth (inches)
    maxPositiveChange = 3,   // Maximum allowed positive hourly change (inches)
    maxNegativeChange = 10,  // Maximum allowed negative hourly change (inches)
    windowSize = 12,         // Hours for rolling average
    useEarlySeasonFilter = true  // New parameter to control early season filtering
  ): SnowDataPoint[] {
    if (data.length === 0) return [];
  
    // Sort data by date_time
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );
  
    // console.log('Input data points:', sortedData.map(d => ({
    //   time: d.date_time,
    //   depth: d.snow_depth
    // })));
  
    // Step 1: Calculate rolling average
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
  
    // Apply early season filtering
    const filteredData = sortedData.map((point, index) => ({
      ...point,
      rollingAvg: calculateRollingAverage(index)
    }));
  
    let validSnowStarted = false;
    const result: SnowDataPoint[] = [];
    let previousValidDepth: number | null = null;
  
    for (let i = 0; i < filteredData.length; i++) {
      const current = filteredData[i];
      
      // Only apply early season filtering if enabled
      if (useEarlySeasonFilter) {
        if (!validSnowStarted && current.rollingAvg > threshold) {
          validSnowStarted = true;
        }
  
        if (!validSnowStarted) {
          result.push({
            date_time: current.date_time,
            snow_depth: NaN
          });
          continue;
        }
      }
  
      // Check for unrealistic hourly changes
      const hourlyChange = previousValidDepth !== null 
        ? current.snow_depth - previousValidDepth
        : 0;
  
      if (hourlyChange > maxPositiveChange || hourlyChange < -maxNegativeChange) {
        //console.log(`Removing outlier at ${current.date_time}: ${current.snow_depth} inches (change: ${hourlyChange.toFixed(2)} inches)`);
        result.push({
          date_time: current.date_time,
          snow_depth: NaN
        });
      } else {
        result.push({
          date_time: current.date_time,
          snow_depth: current.snow_depth
        });
        previousValidDepth = current.snow_depth;
      }
    }
  
    const validPoints = result.filter(d => !isNaN(d.snow_depth));
    const filteredOutPoints = result.filter(d => isNaN(d.snow_depth));
    
  
    return result;
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