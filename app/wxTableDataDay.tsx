import { mean } from 'd3';

import wxTableDataConversion from './wxTableDataConversion';
import {
  formatAveragesData,
  UnitConversions,
  UnitConversionType,
} from '../utils/formatAverages';

function wxTableDataDay(
  observationsData: Array<any>,
  unitConversions: Record<string, string>
): Array<{ [key: string]: number | string }> {
  console.log('wxTableDataDay input:', observationsData);
  console.log(
    'Type of wxTableDataDay input:',
    Array.isArray(observationsData)
      ? 'Array'
      : typeof observationsData
  );

  function isNoData(observationValues: any[]): boolean {
    return (
      observationValues.length === 0 ||
      observationValues.every(
        (value) => value === '' || Number(value) === 0
      )
    );
  }

  ///////////\\\\\\\\\\\\\\\//////////////\\\\\\\\\\\\////////////\\\\\\\\\\\////////\\\\\\\\
  //// Unit Conversions: Initial conversion from Meters to centimeters...\\\\
  ///////////\\\\\\\\\\\\\\\//////////////\\\\\\\\\\\\////////////\\\\\\\\\\\/////////////////

  ///////////\\\\\\\\\\\\\\\//////////////\\\\\\\\\\\\////////////\\\\\\\\\\\////////\\\\\\\\
  //// functions for calculating snow depth using a threshold to do some error correction \\\\
  ///////////\\\\\\\\\\\\\\\//////////////\\\\\\\\\\\\////////////\\\\\\\\\\\/////////////////
  function calculateMean(snowDepths: number[]): number {
    const sum = snowDepths.reduce(
      (acc: number, value: number) => acc + value,
      0
    );
    return sum / snowDepths.length;
  }

  function calculateStandardDeviation(
    snowDepths: number[],
    mean: number
  ): number {
    const variance =
      snowDepths.reduce(
        (acc: number, value: number) =>
          acc + Math.pow(value - mean, 2),
        0
      ) / snowDepths.length;
    return Math.sqrt(variance);
  }

  function filterOutliers(
    snowDepths: number[],
    threshold = 1
  ): number[] {
    // Specify type for snowDepths
    const mean = calculateMean(snowDepths);
    const stdDev = calculateStandardDeviation(snowDepths, mean);

    return snowDepths.filter(
      (value: number) => Math.abs(value - mean) <= threshold * stdDev // Specify type for value
    );
  }
  ///////////\\\\\\\\\\\\\\\//////////////\\\\\\\\\\\\////////////\\\\\\\\\\\/////////////////

  ///////////\\\\\\\\\\\\\\\//////////////\\\\\\\\\\\\////////////\\\\\\\\\\\////////\\\\\\\\
  //// calculating wind direction \\\\
  ///////////\\\\\\\\\\\\\\\//////////////\\\\\\\\\\\\////////////\\\\\\\\\\\/////////////////

  function meanWindDirection(directions) {
    // Convert degrees to radians and calculate x, y components
    let xSum = 0;
    let ySum = 0;

    directions.forEach((deg) => {
      const rad = deg * (Math.PI / 180); // Convert degrees to radians
      xSum += Math.cos(rad);
      ySum += Math.sin(rad);
    });

    // Compute the mean of the x and y components
    const meanX = xSum / directions.length;
    const meanY = ySum / directions.length;

    // Calculate the mean angle in radians
    const meanAngleRad = Math.atan2(meanY, meanX);

    // Convert the mean angle back to degrees
    let meanAngleDeg = meanAngleRad * (180 / Math.PI);

    // Ensure the result is in the range 0-360 degrees
    if (meanAngleDeg < 0) {
      meanAngleDeg += 360;
    }

    return meanAngleDeg;
  }

  function degreeToCompass(degree) {
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

  ///////////\\\\\\\\\\\\\\\//////////////\\\\\\\\\\\\////////////\\\\\\\\\\\/////////////////

  const convertedData = wxTableDataConversion(
    observationsData,
    unitConversions
  );

  return convertedData.map((observations) => {
    const averages: { [key: string]: number | string } = {};

    for (const observationKey in observations) {
      const observationValues = observations[observationKey];

      if (Array.isArray(observationValues)) {
        /// Precip_accum_one_hour \\\
        if (['precip_accum_one_hour'].includes(observationKey)) {
          const sum = observationValues.reduce(
            (a, b) => a + Number(b),
            0
          );
          averages[observationKey] = Number(
            (sum / observationValues.length).toFixed(1)
          );
        }

        /// Snow Depth  \\\
        else if (observationKey === 'snow_depth') {
          if (isNoData(observationValues)) {
            // Set max wind gust to "No Data"
            averages['snow_depth'] = '-';
            averages['snow_depth_max'] = '-';
          } else {
            const snowDepths = observationValues.map(Number);
            const maxSnowDepth = Math.max(...snowDepths); // Keep as number

            const sum = observationValues.reduce(
              (a, b) => a + Number(b),
              0
            );

            // Add new keys for max wind gust
            averages[observationKey] = Number(
              (sum / snowDepths.length).toFixed(1)
            );
            averages['snow_depth_max'] = Number(
              maxSnowDepth.toFixed(1)
            ); // Convert back to number
          }
        }

        /// Snow Depth 24h \\\
        else if (observationKey === 'snow_depth_24h') {
          if (isNoData(observationValues)) {
            // Set snow depth to "No Data"
            //averages['snow_depth_24h'] = '-';
            //averages['snow_depth_24h_no_outliers'] = '-';
            //averages['snow_depth_24h_mean'] = '-';
            //averages['snow_depth_24h_threshold'] = '-';
            //averages['snow_depth_24h_stdDev'] = '-';
            averages['snow_depth_24h_total'] = '-';
          } else {
            const snowDepths = observationValues.map(Number);
            //this hourly threshould is multiplied by the standard deviation to figure out if a value should be removed..
            const hourly_snow_threshold = 1;

            const filteredSnowData = filterOutliers(
              snowDepths,
              hourly_snow_threshold
            );

            const mean = calculateMean(snowDepths);

            const standardDeviation = calculateStandardDeviation(
              snowDepths,
              mean
            );

            const maxSnow = Math.max(...filteredSnowData);
            const minSnow = Math.min(...filteredSnowData);
            const totalSnow = Number((maxSnow - minSnow).toFixed(1)); // Convert to number

            // Add new keys for max snow depth
            //averages[observationKey] = snowDepths;
            //averages['snow_depth_24h_no_outliers'] = filteredSnowData;
            //averages['snow_depth_24h_mean'] = mean.toFixed(2);
            //averages['snow_depth_24h_threshold'] =
            //  hourly_snow_threshold;
            //averages['snow_depth_24h_stdDev'] =
            //  standardDeviation.toFixed(2);
            averages['snow_depth_24h_total'] = totalSnow;
          }
        }

        /// AIR TEMPERATURE \\\
        else if (observationKey === 'air_temp') {
          if (isNoData(observationValues)) {
            // Set all temperature values to "No Data"
            averages[observationKey] = '-';
            averages['air_temp_max'] = '-';
            averages['air_temp_min'] = '-';
            averages['cur_air_temp'] = '-';
          } else {
            const temperatures = observationValues.map(Number);
            const maxTemp = Math.max(...temperatures);
            const minTemp = Math.min(...temperatures);

            // Calculate average temperature
            const sum = temperatures.reduce((a, b) => a + b, 0);
            const avgTemp = Number(
              (sum / temperatures.length).toFixed(1)
            );

            // Get the last temperature entry
            const curTemp = temperatures[temperatures.length - 1];

            // Add new keys for average, max, min, and current temperatures
            averages[observationKey] = avgTemp;
            averages['air_temp_max'] = Number(maxTemp.toFixed(1));
            averages['air_temp_min'] = Number(minTemp.toFixed(1));
            averages['cur_air_temp'] = Number(curTemp.toFixed(1));
          }
        }

        /// Wind_speed \\\
        else if (observationKey === 'wind_speed') {
          if (isNoData(observationValues)) {
            // Set all wind speed values to "No Data"
            averages['wind_speed_avg'] = '-';
            averages['cur_wind_speed'] = '-';
          } else {
            const windSpeeds = observationValues.map(Number);

            // Calculate average wind speed
            const sum = windSpeeds.reduce((a, b) => a + b, 0);
            const avgWindSpeed = Number(
              (sum / windSpeeds.length).toFixed(1)
            );

            // Get the last wind speed entry
            const curWindSpeed = windSpeeds[windSpeeds.length - 1];

            // Add new keys for max, min, average, and current wind speeds

            averages['wind_speed_avg'] = avgWindSpeed;
            averages['cur_wind_speed'] = Number(
              curWindSpeed.toFixed(1)
            );
          }
        }

        /// Wind Gust  \\\
        else if (observationKey === 'wind_gust') {
          if (isNoData(observationValues)) {
            // Set max wind gust to "No Data"
            averages['max_wind_gust'] = '-';
          } else {
            const windGust = observationValues.map(Number);
            const maxWindGust = Math.max(...windGust);

            // Add new keys for max wind gust
            averages['max_wind_gust'] = Number(
              maxWindGust.toFixed(1)
            );
          }
        }

        /// Wind Direction  \\\
        else if (observationKey === 'wind_direction') {
          if (isNoData(observationValues)) {
            // Set max wind gust to "No Data"
            averages['wind_direction'] = '-';
          } else {
            const windDirection = observationValues.map(Number);

            const windDirectionDegrees =
              meanWindDirection(windDirection);

            const windDirectionCompass = degreeToCompass(
              windDirectionDegrees
            );

            // Add new keys for max wind gust
            averages['wind_direction'] = windDirectionCompass;
          }
        }

        /// Date/Time Adjustments \\\
        else if (observationKey === 'date_time') {
          const date = new Date(observationValues[0]); // Assuming the first value is the date
          averages[observationKey] = date.toLocaleDateString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }
          );
        } else {
          const lastValue =
            observationValues[observationValues.length - 1];
          const processedValue =
            typeof lastValue === 'number'
              ? lastValue.toFixed(2)
              : lastValue;
          averages[observationKey] = processedValue;
        }
      } else {
        // Handle non-array values
        averages[observationKey] = observationValues;
      }
    }
    console.log('averages :', averages);

    if (Array.isArray(averages)) {
      console.log('averages is an Array');
    } else if (
      typeof observationsData === 'object' &&
      observationsData !== null
    ) {
      console.log('averages is an Object');
    } else {
      console.log('averages is of type:', typeof observationsData);
    }

    ///////////\\\\\\\\\\\\
    //// Add units to  \\\\
    ///////////\\\\\\\\\\\\

    // Define unit conversions for formatting
    const unitConversions: UnitConversions = {
      air_temp: UnitConversionType.CelsiusToFahrenheit,
      air_temp_max: UnitConversionType.CelsiusToFahrenheit,
      air_temp_min: UnitConversionType.CelsiusToFahrenheit,
      cur_air_temp: UnitConversionType.CelsiusToFahrenheit,
      cur_wind_speed: UnitConversionType.MetersPerSecondToMph,
      max_wind_gust: UnitConversionType.MetersPerSecondToMph,
      wind_speed_avg: UnitConversionType.MetersPerSecondToMph,
      precip_accum_one_hour: UnitConversionType.MetersToInches,
      snow_depth: UnitConversionType.MetersToInches,
      snow_depth_max: UnitConversionType.MetersToInches,
      snow_depth_24h_total: UnitConversionType.MetersToInches,
      // Add other field conversions as needed
    };

    // Format the averages with unit labels
    const formattedAverages = formatAveragesData(
      averages,
      unitConversions
    );

    ///////////\\\\\\\\\\\\ ///////////\\\\\\\\\\\\
    // Take out what I don't want in the chart  \\\
    ///////////\\\\\\\\\\\\ ///////////\\\\\\\\\\\\

    // Remove the original air_temp key
    delete formattedAverages['air_temp'];
    //delete averages['wind_speed'];

    ///////////\\\\\\\\\\\\ ///////////\\\\\\\\\\
    // Edit the headers to make more useable! \\\
    ///////////\\\\\\\\\\\\ ///////////\\\\\\\\\\

    // Process tableDataDay to transform keys
    const formattedAveragesWithHeader: { [key: string]: any } = {};
    Object.entries(formattedAverages).forEach(([key, value]) => {
      const modifiedKey =
        key === 'Station Name'
          ? 'Station'
          : key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());
      formattedAveragesWithHeader[modifiedKey] = value;
    });

    console.log(
      'formattedAveragesWithHeader :',
      formattedAveragesWithHeader
    );

    console.log('formattedAverages :', formattedAveragesWithHeader);
    return formattedAveragesWithHeader;
  });
}

export default wxTableDataDay;
