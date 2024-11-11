//maybe I should do the unit conversions in the DB query...

import moment from 'moment-timezone';

function calculateMean(snowDepths: number[]): number {
  return (
    snowDepths.reduce((acc, value) => acc + value, 0) /
    snowDepths.length
  );
}

function calculateStandardDeviation(
  snowDepths: number[],
  mean: number
): number {
  const variance =
    snowDepths.reduce(
      (acc, value) => acc + Math.pow(value - mean, 2),
      0
    ) / snowDepths.length;
  return Math.sqrt(variance);
}

function filterOutliers(
  snowDepths: number[],
  threshold = 2
): number[] {
  if (snowDepths.length === 0) return [];

  // First filter out invalid negative values
  snowDepths = snowDepths.filter((value) => value > -1);

  const mean = calculateMean(snowDepths);
  const stdDev = calculateStandardDeviation(snowDepths, mean);

  console.log('Outlier detection:', {
    mean,
    stdDev,
    threshold,
    thresholdValue: threshold * stdDev,
  });

  return snowDepths.filter((value) => {
    const deviation = Math.abs(value - mean);
    const isValid = deviation <= threshold * stdDev;
    if (!isValid) {
      console.log(
        `Removing outlier: ${value} (deviation: ${deviation})`
      );
    }
    return isValid;
  });
}

function calculateSnowDepthAccumulation(data: any[]) {
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

function wxTableDataDayFromDB(
  observationsData: Array<Record<string, any>>,
  units: Array<Record<string, string>>
): {
  data: Array<{ [key: string]: number | string }>;
  title: string;
} {
  console.log(
    'observationsData from wxTableDataDay:',
    observationsData
  );

  // The data is already converted, so we can use it directly
  const convertedObsData = observationsData;

  // Group observations by station
  const groupedObservations = convertedObsData.reduce((acc, obs) => {
    if (!acc[obs.stid]) {
      acc[obs.stid] = [];
    }
    acc[obs.stid].push(obs);
    return acc;
  }, {} as Record<string, Array<Record<string, any>>>);

  // Convert units array to a more usable format
  const unitConversionsMap = units.reduce((acc, unit) => {
    acc[unit.measurement] = unit.unit;
    return acc;
  }, {} as Record<string, string>);

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

  // Format the averages with unit labels
  const formattedData = processedData.map((averages) => {
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
      (numbers) => ({ sum: numbers.reduce((a, b) => a + b, 0) })
    );

    // Process precipitation
    processNumericField(
      'precipitation',
      { sum: 'Precipitation' },
      'in',
      1,
      (numbers) => ({ sum: numbers.reduce((a, b) => a + b, 0) })
    );

    // Process snow depth
    processNumericField(
      'snow_depth',
      {
        avg: 'Total Snow Depth Change',
        //max: 'Snow Depth Max',
      },
      'in',
      1,
      (numbers) => {
        console.log('Raw snow_depth data:', numbers);

        const filteredSnowDepths = filterOutliers(
          numbers.filter((n) => !isNaN(n)),
          2
        );
        console.log('Filtered snow depth h:', filteredSnowDepths);

        const firstValue = filteredSnowDepths[0];
        const lastValue =
          filteredSnowDepths[filteredSnowDepths.length - 1];
        const change = lastValue - firstValue;
        return {
          avg: change,
          max: Math.max(...filteredSnowDepths),
        };
      },
      (value, unit) => {
        const num = parseFloat(value);
        return num > 0 ? `+${value} ${unit}` : `${value} ${unit}`;
      }
    );

    // Process 24h snow depth
    processNumericField(
      'snow_depth_24h',
      { total: '24h Snow Accumulation' },
      'in',
      1,
      (numbers) => {
        console.log('Raw snow_depth-24h data:', numbers);

        const filteredSnowDepths = filterOutliers(
          numbers.filter((n) => !isNaN(n)),
          2
        );
        console.log('Filtered snow depths 24 h:', filteredSnowDepths);

        const data = (averages.date_time as string[])
          .map((date_time: string, index: number) => ({
            date_time,
            snow_depth: filteredSnowDepths[index],
          }))
          .filter((d) => d.snow_depth !== undefined);
        console.log('Processed data points:', data);

        const results = calculateSnowDepthAccumulation(data);
        console.log('Accumulation results:', results);

        const total = results[results.length - 1]?.snow_total ?? 0;
        console.log('Final total:', total);

        return { total };
      }
    );

    // Process relative humidity
    processNumericField(
      'relative_humidity',
      { cur: 'Relative Humidity' },
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

    return formatted;
  });

  console.log(
    'formattedData from wxTableDataDayFromDB:',
    formattedData
  );

  // Sort the formattedData array by station name
  formattedData.sort((a, b) => {
    const stationA = String(a.Station).toLowerCase();
    const stationB = String(b.Station).toLowerCase();
    return stationA.localeCompare(stationB);
  });

  const title =
    formattedData.length > 0
      ? (() => {
          const startMoment = moment(
            formattedData[0]['Start Date Time'],
            'MMM D, YYYY, h:mm a'
          );
          const endMoment = moment(
            formattedData[0]['End Date Time'],
            'MMM D, YYYY, h:mm a'
          );

          const startDate = startMoment.format('MMM D');
          const endDate = endMoment.format('MMM D');
          const startTime = startMoment.format('h:mm A');
          const endTime = endMoment.format('h:mm A');

          const timeRange =
            startDate === endDate
              ? `${startDate}, ${startTime} - ${endTime}`
              : `${startDate}, ${startTime} - ${endDate}, ${endTime}`;

          return `Summary - ${timeRange}`;
        })()
      : 'Summary -';

  return { data: formattedData, title };
}

export default wxTableDataDayFromDB;
