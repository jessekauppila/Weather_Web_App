import { filterSnowDepthOutliers, calculateSnowDepthAccumulation, SNOW_DEPTH_24H_CONFIG, SNOW_DEPTH_CONFIG } from './snowDepthUtils';
import moment from 'moment-timezone';

// Import the interface from types.ts
import { WxTableOptions } from './types';

function wxTableDataDayFromDB(
  inputObservations: Record<string, Array<Record<string, any>>>,
  _units: Array<Record<string, string>>,
  options: WxTableOptions
): {
  data: Array<{ [key: string]: number | string }>;
  title: string;
} {
  
  console.log('inputObservations:', inputObservations);

  const startHour = options.startHour;
  const endHour = options.endHour;

  console.log('startHour:', startHour);
  console.log('endHour:', endHour);
  
  const groupedObservations = options.mode === 'summary' 
    ? groupByStation(Object.values(inputObservations).flat())
    :groupBy24hrs(Object.values(inputObservations).flat(), startHour, endHour);
    //: groupByDay(Object.values(inputObservations).flat(), startHour, endHour);
    

  console.log('groupedObservations:', groupedObservations);

  // I THINK THIS IS WHAT CAUSED THE data OBSERVATIONS TO BE FILTERED TWICE
  // // After grouping but before processing
  // const filteredGroupedObservations = Object.entries(inputObservations).reduce((acc, [key, observations]) => {
  //   // Filter snow_depth
  //   const filteredSnowDepth = filterSnowDepthOutliers(
  //     observations.map((obs: Record<string, any>) => ({
  //       date_time: obs.date_time,
  //       snow_depth: obs.snow_depth
  //     })),
  //     SNOW_DEPTH_CONFIG
  //   );

  //   const filteredSnowDepth24h = filterSnowDepthOutliers(
  //     observations.map((obs: Record<string, any>) => ({
  //       date_time: obs.date_time,
  //       snow_depth: obs.snow_depth_24h
  //     })),
  //     SNOW_DEPTH_24H_CONFIG 
  //   );

  //   // Merge filtered data back into observations
  //   const filteredObservations = observations.map((obs, index) => ({
  //     ...obs,
  //     snow_depth: filteredSnowDepth[index]?.snow_depth,
  //     snow_depth_24h: filteredSnowDepth24h[index]?.snow_depth
  //   }));

  //   acc[key] = filteredObservations;
  //   return acc;
  // }, {} as typeof groupedObservations);

  //console.log('filteredGroupedObservations from wxTableDataDayFromDB:', filteredGroupedObservations);

  //////////////////////////||||||||||||||\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  const processedData = Object.entries(groupedObservations).map(
    ([stid, stationObs]) => {
      const averages: { [key: string]: number | string | any[] } = {
        Stid: stid,
        Station: stationObs[0].station_name,
        Latitude: Number(stationObs[0].latitude),
        Longitude: Number(stationObs[0].longitude),
        Elevation: `${Number(stationObs[0].elevation)} ft`,
      };

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

  //console.log('processedData from wxTableDataDayFromDB:', processedData);

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
      '°F'
    );

    // Process wind speed
    processNumericField(
      'wind_speed',
      {
        avg: 'Wind Speed Avg',
        cur: 'Cur Wind Speed',
      },
      'mph'
    );

    // Process wind gust
    processNumericField('wind_gust', { max: 'Max Wind Gust' }, 'mph');

    // Process precipitation
    processNumericField(
      'precip_accum_one_hour',
      { sum: 'Precip Accum One Hour' },
      'in',
      1,
      (numbers) => ({ sum: numbers.slice(1).reduce((a, b) => a + b, 0) })
    );

    // Process snow depth for both total and change
    processNumericField(
      'snow_depth',
      {
        total: 'Total Snow Depth',      
        change: 'Total Snow Depth Change'  
      },
      'in',
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
          total: lastValue,
          change: depthChange,
          max: maxDepth
        };
      },
      (value, unit) => `${value} ${unit}`
    );

    // Process 24h snow depth
    processNumericField(
      'snow_depth_24h',
      { total: '24h Snow Accumulation' },
      'in',
      1,
      (numbers) => {
        //console.log('Raw snow_depth-24h data:', numbers);

        const filteredSnowDepths = numbers.filter(d => !isNaN(d));
        //console.log('Filtered snow depths 24h:', filteredSnowDepths);

        const data = (averages.date_time as string[])
          .map((date_time: string, index: number) => ({
            date_time,
            snow_depth: filteredSnowDepths[index],
          }))
          .filter((d) => !isNaN(d.snow_depth));
        //console.log('Processed data points:', data);

        const results = calculateSnowDepthAccumulation(data);
        //console.log('Accumulation results:', results);

        const total = results[results.length - 1]?.snow_total ?? 0;
        //console.log('Final total:', total);

        return { total };
      }
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

    return formatted;
  });

  // console.log(
  //   'formattedDailyData from wxTableDataDayFromDB:',
  //   formattedDailyData
  // );

  // Sort the formattedDailyData array by station name
  formattedDailyData.sort((a, b) => {
    const stationA = String(a.Station).toLowerCase();
    const stationB = String(b.Station).toLowerCase();
    return stationA.localeCompare(stationB);
  });

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
      result[periodKey].push(obs);
    });
  }
  
  return result;
}

export default wxTableDataDayFromDB;
