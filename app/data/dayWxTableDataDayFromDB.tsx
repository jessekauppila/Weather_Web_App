import { filterSnowDepthOutliers, calculateSnowDepthAccumulation, SNOW_DEPTH_24H_CONFIG, SNOW_DEPTH_CONFIG } from '../utils/snowDepthUtils';
import moment from 'moment-timezone';
import { UnitType } from "@/app/utils/units";
import { formatValueWithUnit } from "@/app/utils/formatValueWithUnit";
import { fetchStations } from '@/app/utils/fetchStaticStationData';
// Import the interface from types.ts
import { WxTableOptions } from '../types';

export default async function wxTableDataDayFromDB(
  inputObservations: Record<string, Array<Record<string, any>>>,
  _units: Array<Record<string, string>>,
  options: WxTableOptions,
  isMetric: boolean,
  onDataReady?: (data: any[]) => void
): Promise<{
  data: Array<{ [key: string]: number | string }>;
  title: string;
}> {

  const startHour = options.startHour;
  const endHour = options.endHour;

  const groupedObservations = options.mode === 'summary' 
    ? groupByStation(Object.values(inputObservations).flat())
    :groupBy24hrs(Object.values(inputObservations).flat(), startHour, endHour);
    //: groupByDay(Object.values(inputObservations).flat(), startHour, endHour);

  // Fetch stations data synchronously to ensure we have coordinates
  let stationsData: any[] = [];
  try {
    console.log('Fetching stations data...');
    stationsData = await fetchStations();
    console.log('📍 Fetched stations data:', stationsData.length);
  } catch (error) {
    console.error('Error fetching stations data:', error);
  }

  //////////////////////////||||||||||||||\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  // Debugging function to inspect station data
  function debugStation(stid: string, stationObs: any[]) {
    console.log('🔍 STATION DATA DEBUG:');
    console.log(`Station ${stid} (${stationObs[0].station_name}):`);
    
    // Log the original observations data
    console.log('Original station observation:', {
      latitude: stationObs[0].latitude,
      longitude: stationObs[0].longitude,
      latType: typeof stationObs[0].latitude,
      lonType: typeof stationObs[0].longitude
    });
    
    // Check if there's station data available from the pre-fetch
    const stationInfo = stationsData.find((s: any) => s.stid === stid);
    if (stationInfo) {
      console.log('Station data from pre-fetch:', {
        latitude: stationInfo.latitude,
        longitude: stationInfo.longitude
      });
    } else {
      console.log('Station not found in pre-fetched data');
    }
  }

  const processedData = Object.entries(groupedObservations).map(
    ([stid, stationObs]) => {
      // For the first station, log detailed debug info
      if (stid === '1' || stid === '2' || stid === '3') {
        debugStation(stid, stationObs);
      }
    
      // Check for coordinates from stations data first
      const stationInfo = stationsData.find((s: any) => s.stid === stid);
      
      // Create a function to get the best available coordinate data
      const getBestCoordinate = (coordType: 'latitude' | 'longitude'): string => {
        // Priority 1: Use station info if available
        if (stationInfo && stationInfo[coordType] !== undefined && stationInfo[coordType] !== null) {
          return String(stationInfo[coordType]);
        }
        
        // Priority 2: Use observation data if available
        if (stationObs[0][coordType] !== undefined && stationObs[0][coordType] !== null) {
          return String(stationObs[0][coordType]);
        }
        
        // Priority 3: Use hardcoded defaults for known stations
        const defaultCoords: Record<string, {lat: string, lon: string}> = {
          '1': {lat: '47.4276', lon: '-121.4288'}, // Alpental Base
          '2': {lat: '47.4392', lon: '-121.4379'}, // Alpental Mid-Mountain
          '3': {lat: '47.4527', lon: '-121.4346'}, // Alpental Summit
        };
        
        if (defaultCoords[stid]) {
          return coordType === 'latitude' ? defaultCoords[stid].lat : defaultCoords[stid].lon;
        }
        
        // Last resort: return empty string
        return '';
      };
      
      const averages: { [key: string]: number | string | any[] } = {
        Stid: stid,
        Station: stationObs[0].station_name,
        Latitude: getBestCoordinate('latitude'),
        Longitude: getBestCoordinate('longitude'),
        Elevation: formatValueWithUnit(Number(stationObs[0].elevation), UnitType.ELEVATION, isMetric),
      };
      
      // Additional debug for coordinates specifically
      if (stationObs[0].latitude === undefined || stationObs[0].longitude === undefined) {
        console.log(`⚠️ Station ${stid} (${stationObs[0].station_name}) has undefined coordinates:`);
        console.log('  - First observation:', stationObs[0]);
      }

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
        'solar_radiation',
        'api_fetch_time'
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
    }
  );

  // Format the averages with unit labels
  const formattedDailyData = processedData.map((averages) => {
    const formatted: { [key: string]: any } = { ...averages };

    // Helper function to safely process numeric fields
    const processNumericField = (
      fieldName: string,
      outputFields: { [key: string]: string },
      unit: string,
      decimalPlaces: number = 0,
      customProcessing?: (numbers: number[]) => {
        [key: string]: number;
      },
      customFormatter?: (value: string, unit: string) => string
    ) => {
      if (formatted[fieldName] && formatted[fieldName].length > 0) {
        const numbers = formatted[fieldName]
          .map((val: string | number) => parseFloat(val.toString()))
          .filter((val: number) => !isNaN(val));
        if (numbers.length > 0) {
          let results: { [key: string]: number };
          if (customProcessing) {
            results = customProcessing(numbers);
          } else {
            results = {
              max: Math.max(...numbers),
              min: Math.min(...numbers),
              avg:
                numbers.reduce((a: number, b: number) => a + b, 0) /
                numbers.length,
              cur: numbers[numbers.length - 1],
            };
          }

          Object.entries(outputFields).forEach(([key, outputKey]) => {
            if (results[key] !== undefined) {
              const formattedValue =
                results[key].toFixed(decimalPlaces);
              formatted[outputKey] = customFormatter
                ? customFormatter(formattedValue, unit)
                : `${formattedValue} ${unit}`.trim();
            } else {
              formatted[outputKey] = '-';
            }
          });
        } else {
          Object.values(outputFields).forEach((outputKey) => {
            formatted[outputKey] = '-';
          });
        }
      } else {
        Object.values(outputFields).forEach((outputKey) => {
          formatted[outputKey] = '-';
        });
      }
      delete formatted[fieldName];
    };

    // Process air temperature
    processNumericField(
      'air_temp',
      {
        max: 'Air Temp Max',
        min: 'Air Temp Min',
        cur: 'Cur Air Temp',
      },
      UnitType.TEMPERATURE,
      0,
      undefined,
      (value, unit) => formatValueWithUnit(Number(value), UnitType.TEMPERATURE, isMetric)
    );

    // Process wind speed
    processNumericField(
      'wind_speed',
      {
        avg: 'Wind Speed Avg',
        cur: 'Cur Wind Speed',
      },
      UnitType.WIND_SPEED,
      0,
      undefined,
      (value, unit) => formatValueWithUnit(Number(value), UnitType.WIND_SPEED, isMetric)
    );

        // Process wind speed
        processNumericField(
          'solar_radiation',
          {
            avg: 'Solar Radiation Avg',
            //cur: 'Cur Solar Radiation',
          },
          UnitType.SOLAR,
          0,
          undefined,
          (value, unit) => formatValueWithUnit(Number(value), UnitType.SOLAR, isMetric)
        );

    // Process wind gust
    processNumericField('wind_gust', { max: 'Max Wind Gust' }, 'mph');

    // Process precipitation
    processNumericField(
      'precip_accum_one_hour',
      { sum: 'Precip Accum One Hour' },
      UnitType.PRECIPITATION,
      2,
      (numbers) => ({ 
        sum: Number(numbers.slice(1).reduce((a, b) => a + b, 0).toFixed(2)) 
      }),
      (value, unit) => formatValueWithUnit(Number(value), UnitType.PRECIPITATION, isMetric)
    );

    // Process snow depth for both total and change
    processNumericField(
      'snow_depth',
      {
        total: 'Total Snow Depth',      
        change: 'Total Snow Depth Change'  
      },
      UnitType.PRECIPITATION,
      1,
      (numbers) => {
        // Step 1: Create timestamped data points
        const dataPoints = (averages.date_time as string[])
          .map((date_time: string, index: number) => ({
            date_time,
            snow_depth: numbers[index]
          }))
          .filter(d => !isNaN(d.snow_depth));

        // Step 2: Extract valid snow depths
        const validDepths = dataPoints.map(d => d.snow_depth);

        // Step 3: Calculate statistics
        const firstValue = validDepths[0] || 0;
        const lastValue = validDepths[validDepths.length - 1] || 0;
        const maxDepth = Math.max(...validDepths);
        const depthChange = lastValue - firstValue;

        return {
          total: Number(lastValue.toFixed(1)),
          change: depthChange,
          max: Number(maxDepth.toFixed(1))
        };
      },
      (value, unit) => formatValueWithUnit(Number(value), UnitType.PRECIPITATION, isMetric)
    );

    // Process 24h snow depth
    processNumericField(
      'snow_depth_24h',
      { total: '24h Snow Accumulation' },
      UnitType.PRECIPITATION,
      1,
      (numbers) => {
        const dataPoints = (averages.date_time as string[])
          .map((date_time: string, index: number) => ({
            date_time,
            snow_depth: numbers[index]
          }))
          .filter(d => !isNaN(d.snow_depth));

        const results = calculateSnowDepthAccumulation(dataPoints);
        const total = Number((results[results.length - 1]?.snow_total ?? 0).toFixed(1));

        return { total };
      },
      (value, unit) => formatValueWithUnit(Number(value), UnitType.PRECIPITATION, isMetric)
    );

    // Process relative humidity
    processNumericField(
      'relative_humidity',
      { avg: 'Relative Humidity' },
      '%',
      0,
      undefined,
      (value, unit) => `${value}${unit}` // Custom formatter for Relative Humidity
    );

    function degreeToCompass(degree: number): string {
      // A utility function to convert degrees to compass directions
      const directions = [
        'N',
        'NNE',
        'NE',
        'ENE',
        'E',
        'ESE',
        'SE',
        'SSE',
        'S',
        'SSW',
        'SW',
        'WSW',
        'W',
        'WNW',
        'NW',
        'NNW',
      ];
      const index = Math.round(degree / 22.5) % 16;
      return directions[index];
    }

    // Process wind direction
    processNumericField(
      'wind_direction',
      { avg: 'Wind Direction' },
      '',
      0,
      (numbers) => {
        const sum = numbers.reduce((a, b) => a + b, 0);
        const avg = (sum / numbers.length) % 360; // Ensure the result is between 0 and 359
        return { avg: avg };
      }
    );

    // Convert average wind direction to compass direction
    if (
      formatted['Wind Direction'] &&
      formatted['Wind Direction'] !== '-'
    ) {
      const avgDirection = parseFloat(formatted['Wind Direction']);
      formatted['Wind Direction'] = degreeToCompass(avgDirection);
    }

    // Process date/time
    if (formatted['date_time'] && formatted['date_time'].length > 0) {
      const startTime = moment(formatted['date_time'][0]);
      const endTime = moment(
        formatted['date_time'][formatted['date_time'].length - 1]
      );
      formatted['Start Date Time'] = startTime.format(
        'MMM D, YYYY, h:mm a'
      );
      formatted['End Date Time'] = endTime.format(
        'MMM D, YYYY, h:mm a'
      );
      formatted['Date Time'] = `${startTime.format(
        'h:mm a'
      )} - ${endTime.format('h:mm a, MMM D, YYYY')}`;
    } else {
      formatted['Start Date Time'] = '-';
      formatted['End Date Time'] = '-';
      formatted['Date Time'] = '-';
    }
    delete formatted['date_time'];

    if (options.mode === 'daily') {
      const dateTime = moment(Array.isArray(averages.date_time) ? averages.date_time[0] : averages.date_time);
      formatted['Date'] = dateTime.format('MMM D');
    }

    // Process api_fetch_time
    if (averages['api_fetch_time'] && Array.isArray(averages['api_fetch_time'])) {
      const timestamps = averages['api_fetch_time']
        .map(ts => new Date(ts).getTime())
        .sort((a, b) => a - b);
      
      formatted['Api Fetch Time'] = moment(timestamps[timestamps.length - 1])
        .format('MMM D, h:mm A');
    }


    return formatted;
  });

  // Sort the formattedDailyData array by station name
  formattedDailyData.sort((a, b) => {
    const stationA = String(a.Station).toLowerCase();
    const stationB = String(b.Station).toLowerCase();
    return stationA.localeCompare(stationB);
  });

  // Debug formattedDailyData before returning
  if (formattedDailyData.length > 0) {
    const sampleStation = formattedDailyData[0];
    console.log('📊 FINAL DATA INSPECTION:');
    console.log('Sample station from formattedDailyData:', {
      station: sampleStation.Station,
      coordinates: {
        latitude: {
          value: sampleStation.Latitude,
          type: typeof sampleStation.Latitude
        },
        longitude: {
          value: sampleStation.Longitude,
          type: typeof sampleStation.Longitude
        }
      }
    });
    
    // Check for undefined values converted to strings
    const undefinedCoords = formattedDailyData.filter(
      station => station.Latitude === 'undefined' || station.Longitude === 'undefined'
    );
    
    if (undefinedCoords.length > 0) {
      console.log(`⚠️ Found ${undefinedCoords.length} stations with 'undefined' coordinate strings`);
      console.log('First problematic station:', undefinedCoords[0]);
    }
  }

  const title = formattedDailyData.length > 0
    ? (() => {
        // Get the actual end time from the data
        const lastDataPoint = formattedDailyData[0]['End Date Time'];
        const endTimeDisplay = moment(options.end).format('MMM D, h A');

        const stationInfo = options.mode === 'daily' 
          ? `${formattedDailyData[0].Station} - ${formattedDailyData[0].Elevation}\n` 
          : '';

        if (options.mode === 'daily') {
          return `${stationInfo}${moment(options.start).format('MMM D, h A')} - ${endTimeDisplay}`;
        } else {
          return `Summary - ${moment(options.start).format('MMM D, h A')} to ${endTimeDisplay}`;
        }
      })()
    : options.mode === 'daily' ? 'Daily -' : 'Summary -';
  //console.log('🚀 formattedDailyData:', formattedDailyData);

  // If there's a callback, call it directly now
  if (onDataReady && formattedDailyData.length > 0) {
    onDataReady(formattedDailyData);
  }

  // Return the data immediately (it now already includes the station data)
  return { data: formattedDailyData, title };
}

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

// Helper function to group by day with specific 24-hour periods
function groupByDay(
  data: Array<Record<string, any>>, 
  startHour: number,
  endHour: number
) {
  return data.reduce((acc, obs) => {
    const datetime = moment(obs.date_time);
    const obsHour = datetime.hour();
    
    // Only include observations that fall within the specified hour range
    if (obsHour >= startHour && obsHour < endHour) {
      const periodKey = datetime.format('YYYY-MM-DD');
      if (!acc[periodKey]) {
        acc[periodKey] = [];
      }
      acc[periodKey].push(obs);
    }
    
    return acc;
  }, {} as Record<string, Array<Record<string, any>>>);
}

function groupBy24hrs(
  data: Array<Record<string, any>>,
  startHour: number,
  endHour: number
) {
  console.log('🚀 groupBy24hrs called with:', { 
    dataLength: data.length,
    startHour,
    endHour 
  });
  
  // Sort data by date_time first
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );

  const result: Record<string, Array<Record<string, any>>> = {};
  
  if (sortedData.length > 0) {
    // Start from the first observation's time
    let currentPeriodStart = moment(sortedData[0].date_time);
    // End exactly 24 hours later
    let currentPeriodEnd = moment(currentPeriodStart).add(23, 'hours').add(59, 'minutes').add(59, 'seconds');
    
    let periodKey = `${currentPeriodStart.format('MM-DD hh:mm A')} - ${currentPeriodEnd.format('MM-DD hh:mm A')}`;
    
    sortedData.forEach(obs => {
      const obsTime = moment(obs.date_time);
      
      while (obsTime.isAfter(currentPeriodEnd)) {
        currentPeriodStart = moment(currentPeriodEnd).add(1, 'second');
        currentPeriodEnd = moment(currentPeriodStart).add(23, 'hours').add(59, 'minutes').add(59, 'seconds');
        periodKey = `${currentPeriodStart.format('MM-DD hh:mm A')} - ${currentPeriodEnd.format('MM-DD hh:mm A')}`;
      }
      
      if (!result[periodKey]) {
        result[periodKey] = [];
      }

      console.log('📊 RESULT', result);
      result[periodKey].push(obs);
    });
  }
  
  console.log('📊 RESULT from groupBy24hrs:', result);
  return result;
}
