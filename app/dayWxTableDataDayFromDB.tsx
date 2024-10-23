import moment from 'moment-timezone';
import {
  formatAveragesData,
  UnitConversions,
  UnitConversionType,
} from '../utils/formatAveragesFromDB';

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

  // Group observations by station
  const groupedObservations = observationsData.reduce((acc, obs) => {
    if (!acc[obs.stid]) {
      acc[obs.stid] = [];
    }
    acc[obs.stid].push(obs);
    return acc;
  }, {} as Record<string, Array<Record<string, any>>>);

  // Convert units array to a more usable format
  const unitConversions = units.reduce((acc, unit) => {
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
          .map((obs) => obs[key])
          .filter((val) => val !== null);
        if (values.length > 0) {
          averages[key] = values;
        }
      });

      // Special processing for certain fields
      if (
        averages['wind_speed'] &&
        averages['wind_speed'].every((v) => v === '')
      ) {
        averages['wind_speed'] = [''];
      }

      ['intermittent_snow', 'precipitation'].forEach((key) => {
        averages[key] = [stationObs[0][key] || ''];
      });

      // Process date_time
      averages['date_time'] = stationObs.map((obs) => obs.date_time);

      return averages;
    }
  );

  // Format the averages with unit labels
  const formattedData = processedData.map((averages) => {
    const formatted: { [key: string]: any } = { ...averages };

    // Helper function to safely process numeric fields
    const processNumericField = (
      fieldName: string,
      newFieldName: string,
      unit: string,
      decimalPlaces: number = 2,
      processFunc?: (numbers: number[]) => number
    ) => {
      if (formatted[fieldName] && formatted[fieldName].length > 0) {
        const numbers = formatted[fieldName]
          .map((val) => parseFloat(val))
          .filter((val) => !isNaN(val));
        if (numbers.length > 0) {
          const result = processFunc
            ? processFunc(numbers)
            : numbers[numbers.length - 1];
          formatted[newFieldName] = `${result.toFixed(
            decimalPlaces
          )} ${unit}`;
        } else {
          formatted[newFieldName] = `-`;
        }
      } else {
        formatted[newFieldName] = `-`;
      }
      delete formatted[fieldName];
    };

    // Process air temperature
    processNumericField(
      'air_temp',
      'Air Temp Max',
      '°F',
      1,
      (numbers) => Math.max(...numbers)
    );
    processNumericField(
      'air_temp',
      'Air Temp Min',
      '°F',
      1,
      (numbers) => Math.min(...numbers)
    );
    processNumericField('air_temp', 'Cur Air Temp', '°F', 1);

    // Process wind speed
    if (
      formatted['wind_speed'] &&
      formatted['wind_speed'].length > 0
    ) {
      const windSpeedNumbers = formatted['wind_speed']
        .map((speed) => parseFloat(speed))
        .filter((speed) => !isNaN(speed));
      if (windSpeedNumbers.length > 0) {
        formatted['Wind Speed Avg'] = `${(
          windSpeedNumbers.reduce((a, b) => a + b, 0) /
          windSpeedNumbers.length
        ).toFixed(1)} mph`;
        formatted['Cur Wind Speed'] = `${windSpeedNumbers[
          windSpeedNumbers.length - 1
        ].toFixed(1)} mph`;
      } else {
        formatted['Wind Speed Avg'] = '-';
        formatted['Cur Wind Speed'] = '-';
      }
    } else {
      formatted['Wind Speed Avg'] = '-';
      formatted['Cur Wind Speed'] = '-';
    }

    // Process wind gust
    if (formatted['wind_gust'] && formatted['wind_gust'].length > 0) {
      formatted['Max Wind Gust'] = `${Math.max(
        ...formatted['wind_gust']
      ).toFixed(1)} mph`;
    } else {
      formatted['Max Wind Gust'] = '-';
    }
    delete formatted['wind_gust'];

    // Process wind direction
    if (
      formatted['wind_direction'] &&
      formatted['wind_direction'].length > 0
    ) {
      // You might want to implement a function to convert degrees to compass direction
      formatted['Wind Direction'] =
        formatted['wind_direction'][
          formatted['wind_direction'].length - 1
        ];
    } else {
      formatted['Wind Direction'] = '-';
    }
    delete formatted['wind_direction'];

    // Process precipitation
    if (
      formatted['precip_accum_one_hour'] &&
      formatted['precip_accum_one_hour'].length > 0
    ) {
      const precipNumbers = formatted['precip_accum_one_hour']
        .map((precip) => parseFloat(precip))
        .filter((precip) => !isNaN(precip));
      if (precipNumbers.length > 0) {
        const totalPrecip = precipNumbers.reduce((a, b) => a + b, 0);
        formatted['Precip Accum One Hour'] = `${totalPrecip.toFixed(
          2
        )} in`;
      } else {
        formatted['Precip Accum One Hour'] = '0.00 in';
      }
    } else {
      formatted['Precip Accum One Hour'] = '0.00 in';
    }
    delete formatted['precip_accum_one_hour'];

    // Process snow depth
    if (formatted['snow_depth']) {
      formatted['Snow Depth'] = `${(
        formatted['snow_depth'][formatted['snow_depth'].length - 1] *
        39.3701
      ).toFixed(1)} in`;
      formatted['Snow Depth Max'] = `${(
        Math.max(...formatted['snow_depth']) * 39.3701
      ).toFixed(1)} in`;
    }
    delete formatted['snow_depth'];

    // Process 24h snow depth
    if (
      formatted['snow_depth_24h'] &&
      formatted['snow_depth_24h'].length > 0
    ) {
      const numbers = formatted['snow_depth_24h']
        .map((val) => parseFloat(val))
        .filter((val) => !isNaN(val));
      if (numbers.length > 0) {
        const max = Math.max(...numbers);
        const min = Math.min(...numbers);
        formatted['Snow Depth 24h Total'] = `${(
          (max - min) *
          39.3701
        ).toFixed(1)} in`;
      } else {
        formatted['Snow Depth 24h Total'] = `-`;
      }
    } else {
      formatted['Snow Depth 24h Total'] = `-`;
    }
    delete formatted['snow_depth_24h'];

    // Process relative humidity
    processNumericField(
      'relative_humidity',
      'Relative Humidity',
      '%',
      2
    );

    // Process wind direction
    if (
      formatted['wind_direction'] &&
      formatted['wind_direction'].length > 0
    ) {
      const lastDirection =
        formatted['wind_direction'][
          formatted['wind_direction'].length - 1
        ];
      formatted['Wind Direction'] =
        lastDirection !== null ? lastDirection.toString() : '-';
    } else {
      formatted['Wind Direction'] = '-';
    }
    delete formatted['wind_direction'];

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

  const title =
    formattedData.length > 0
      ? `Station Data: ${formattedData[0]['Start Date Time']} - ${formattedData[0]['End Date Time']}`
      : 'Station Data';

  return { data: formattedData, title };
}

export default wxTableDataDayFromDB;
