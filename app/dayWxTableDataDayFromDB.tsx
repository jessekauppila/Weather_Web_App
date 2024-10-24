import moment from 'moment-timezone';
import { convertObservationUnits } from './utils/unitConversions';

function wxTableDataDayFromDB(
  observationsData: Array<Record<string, any>>,
  units: Array<Record<string, string>>
): {
  data: Array<{ [key: string]: number | string }>;
  title: string;
} {
  console.log(
    'observationsData from wxTableDataDayFromDB:',
    observationsData
  );

  // The data is already converted, so we can use it directly
  const convertedObsData = observationsData;

  console.log('Converted observations:', convertedObsData);

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
        Elevation: Number(stationObs[0].elevation),
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

    // Process snow depth
    processNumericField(
      'snow_depth',
      {
        cur: 'Snow Depth',
        max: 'Snow Depth Max',
      },
      'in',
      1,
      (numbers) => ({
        cur: numbers[numbers.length - 1] * 39.3701,
        max: Math.max(...numbers) * 39.3701,
      })
    );

    // Process 24h snow depth
    processNumericField(
      'snow_depth_24h',
      { total: 'Snow Depth 24h Total' },
      'in',
      1,
      (numbers) => ({
        total:
          (Math.max(...numbers) - Math.min(...numbers)) * 39.3701,
      })
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

  const title =
    formattedData.length > 0
      ? `Station Data: ${formattedData[0]['Start Date Time']} - ${formattedData[0]['End Date Time']}`
      : 'Station Data';

  return { data: formattedData, title };
}

export default wxTableDataDayFromDB;
