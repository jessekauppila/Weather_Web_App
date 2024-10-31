// run by going to this URL when running the app locally:
// http://localhost:3000/api/updateWeeklyData

//this is is used to update weekly or daily data to the database, its much slower than the batched version, but good for short periods of time

//!!!!!!!!!!! Note I modified this to use the stationsTest and observationsTest tables for testing !!!!!!!!!!!!

//Also used for checking precip accumulation values so lots of console logs for that....

// try {
//   const insertResult = await client.sql`
//     WITH station_id AS (
//       SELECT id FROM stationsTest WHERE stid = ${observation.stid}
//     )
//     INSERT INTO observationsTest (

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@vercel/postgres';
import moment from 'moment-timezone';
import processAllWxData from '../allWxprocessor';

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  let client;

  try {
    client = await db.connect();

    // Set time range for the last week
    const end_time_pst = moment().tz('America/Los_Angeles');
    const start_time_pst = moment(end_time_pst).subtract(36, 'hours');

    // Define station IDs
    const stids = [
      '1',
      '14',
      '11',
      '12',
      '13',
      '14',
      '17',
      '18',
      '19',
      '2',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '3',
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '39',
      '4',
      '40',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
      '5',
      '50',
      '51',
      '53',
      '54',
      '56',
      '57',
      '6',
      '7',
      '8',
      '9',
    ];

    const auth: string = '50a07f08af2fe5ca0579c21553e1c9029e04';

    // Fetch weather data
    let observationsData;
    try {
      const result = await retryOperation(() =>
        processAllWxData(start_time_pst, end_time_pst, stids, auth)
      );
      observationsData = result.observationsData;
      // console.log(
      //   'Fetched observations data:',
      //   JSON.stringify(observationsData, null, 2)
      // );
    } catch (error) {
      console.error(
        'Error fetching weather data after retries:',
        error
      );
      return NextResponse.json(
        {
          error:
            'Failed to fetch weather data after multiple attempts: ' +
            (error instanceof Error ? error.message : String(error)),
        },
        { status: 500 }
      );
    }

    if (!observationsData || observationsData.length === 0) {
      console.log('No weather data available');
      return NextResponse.json(
        { error: 'No weather data available' },
        { status: 404 }
      );
    }

    console.log(
      'Available keys in first observation:',
      Object.keys(observationsData[0])
    );

    // Also log a sample of the precipitation data
    const sampleObservation = observationsData[0];
    console.log('Precipitation data sample:', {
      keys: Object.keys(sampleObservation),
      precip: sampleObservation.precip_accum_one_hour,
      precipitation: sampleObservation.precipitation, // Check if this key exists
      precip_accum: sampleObservation.precip_accum, // Check if this key exists
      // Log any other potential precipitation-related keys
    });

    for (const observation of observationsData) {
      //////////// THIS LOG SHOULD PROBABLY GO BACK IN, SUPER USEFUL //////////////////

      // console.log(
      //   'Observation:',
      //   JSON.stringify(observation, null, 2)
      // );

      if (!Array.isArray(observation.date_time)) {
        console.error(
          'Expected date_time to be an array, but got:',
          observation.date_time
        );
        continue;
      }

      // Helper function to safely get a value from an array or return null
      const safeGetArrayValue = (
        arr: any[],
        index: number,
        fieldName: string
      ) => {
        //   console.log('Array value:', {
        //     field: fieldName,
        //     value:
        //       Array.isArray(arr) && arr.length > index
        //         ? arr[index]
        //         : null,
        //     arrayLength: arr?.length,
        //     fullArray: Array.isArray(arr)
        //       ? arr.map((value, idx) => ({
        //           index: idx,
        //           value: value,
        //           timestamp: observation.date_time[idx],
        //         }))
        //       : 'not an array',
        //   }
        // );
        return Array.isArray(arr) && arr.length > index
          ? arr[index]
          : null;
      };

      // Helper function to safely parse a numeric value
      const safeParseFloat = (
        value: string | null | undefined | any[]
      ): number | null => {
        if (value === null || value === undefined || value === '') {
          return null;
        }
        // Handle arrays by taking first element or returning null
        if (Array.isArray(value)) {
          return value.length > 0
            ? parseFloat(String(value[0]))
            : null;
        }
        const parsed = parseFloat(String(value));
        return isNaN(parsed) ? null : parsed;
      };

      for (let i = 0; i < observation.date_time.length; i++) {
        const dateString = observation.date_time[i];
        const dateTime = moment(dateString);
        if (!dateTime.isValid()) {
          console.error('Invalid date encountered:', dateString);
          continue;
        }

        const formattedDateTime = dateTime.format(
          'YYYY-MM-DD HH:mm:ssZ'
        );

        // Get the corresponding values for this timestamp
        const air_temp = safeParseFloat(
          safeGetArrayValue(observation.air_temp, i, 'air_temp')
        );
        const wind_speed = safeParseFloat(
          safeGetArrayValue(observation.wind_speed, i, 'wind_speed')
        );
        const wind_gust = safeParseFloat(
          safeGetArrayValue(observation.wind_gust, i, 'wind_gust')
        );
        const wind_direction = safeParseFloat(
          safeGetArrayValue(
            observation.wind_direction,
            i,
            'wind_direction'
          )
        );
        const snow_depth = safeParseFloat(
          safeGetArrayValue(observation.snow_depth, i, 'snow_depth')
        );
        const snow_depth_24h = safeParseFloat(
          safeGetArrayValue(
            observation.snow_depth_24h,
            i,
            'snow_depth_24h'
          )
        );
        const intermittent_snow = safeParseFloat(
          safeGetArrayValue(
            observation.intermittent_snow,
            i,
            'intermittent_snow'
          )
        );
        const precip_accum_one_hour = safeParseFloat(
          safeGetArrayValue(
            observation.precip_accum_one_hour,
            i,
            'precip_accum_one_hour'
          )
        );
        const relative_humidity = safeParseFloat(
          safeGetArrayValue(
            observation.relative_humidity,
            i,
            'relative_humidity'
          )
        );
        const battery_voltage = safeParseFloat(
          safeGetArrayValue(
            observation.battery_voltage,
            i,
            'battery_voltage'
          )
        );
        const wind_speed_min = safeParseFloat(
          safeGetArrayValue(
            observation.wind_speed_min,
            i,
            'wind_speed_min'
          )
        );
        const solar_radiation = safeParseFloat(
          safeGetArrayValue(
            observation.solar_radiation,
            i,
            'solar_radiation'
          )
        );
        const equip_temperature = safeParseFloat(
          safeGetArrayValue(
            observation.equip_temperature,
            i,
            'equip_temperature'
          )
        );
        const pressure = safeParseFloat(
          safeGetArrayValue(observation.pressure, i, 'pressure')
        );
        const wet_bulb = safeParseFloat(
          safeGetArrayValue(observation.wet_bulb, i, 'wet_bulb')
        );
        const soil_temperature_a = safeParseFloat(
          safeGetArrayValue(
            observation.soil_temperature_a,
            i,
            'soil_temperature_a'
          )
        );
        const soil_temperature_b = safeParseFloat(
          safeGetArrayValue(
            observation.soil_temperature_b,
            i,
            'soil_temperature_b'
          )
        );
        const soil_moisture_a = safeParseFloat(
          safeGetArrayValue(
            observation.soil_moisture_a,
            i,
            'soil_moisture_a'
          )
        );
        const soil_moisture_b = safeParseFloat(
          safeGetArrayValue(
            observation.soil_moisture_b,
            i,
            'soil_moisture_b'
          )
        );
        const soil_temperature_c = safeParseFloat(
          safeGetArrayValue(
            observation.soil_temperature_c,
            i,
            'soil_temperature_c'
          )
        );
        const soil_moisture_c = safeParseFloat(
          safeGetArrayValue(
            observation.soil_moisture_c,
            i,
            'soil_moisture_c'
          )
        );

        // Check the raw data coming from the API
        // console.log('Raw precip observation data:', {
        //   index: i,
        //   value: observation.precip_accum_one_hour[i],
        //   type: typeof observation.precip_accum_one_hour[i],
        // fullArray: observation.precip_accum_one_hour.map(
        //   (value, idx) => ({
        //     index: idx,
        //     value: value,
        //     timestamp: observation.date_time[idx],
        //   })
        // ),
        // });

        console.log('Values before insert:', {
          precip_accum_one_hour,
          raw_value: observation.precip_accum_one_hour[i],
          parsed_value: safeParseFloat(
            safeGetArrayValue(
              observation.precip_accum_one_hour,
              i,
              'precip_accum_one_hour'
            )
          ),
        });

        try {
          const insertResult = await client.sql`
            WITH station_id AS (
              SELECT id FROM stationsTest WHERE stid = ${observation.stid}
            )
            INSERT INTO observationsTest (
              station_id,
              date_time,
              air_temp,
              wind_speed,
              wind_gust,
              wind_direction,
              snow_depth,
              snow_depth_24h,
              intermittent_snow,
              precip_accum_one_hour,
              relative_humidity,
              battery_voltage,
              wind_speed_min,
              solar_radiation,
              equip_temperature,
              pressure,
              wet_bulb,
              soil_temperature_a,
              soil_temperature_b,
              soil_moisture_a,
              soil_moisture_b,
              soil_temperature_c,
              soil_moisture_c
            )
            SELECT
              (SELECT id FROM station_id),
              ${formattedDateTime}::timestamp with time zone,
              NULLIF(${air_temp}, '')::DECIMAL(5,2),
              NULLIF(${wind_speed}, '')::DECIMAL(5,2),
              NULLIF(${wind_gust}, '')::DECIMAL(5,2),
              NULLIF(${wind_direction}, '')::DECIMAL(5,2),
              NULLIF(${snow_depth}, '')::DECIMAL(5,2),
              NULLIF(${snow_depth_24h}, '')::DECIMAL(5,2),
              NULLIF(${intermittent_snow}, '')::DECIMAL(5,2),
              ${precip_accum_one_hour}::NUMERIC::DECIMAL(5,4),
              NULLIF(${relative_humidity}, '')::DECIMAL(5,2),
              NULLIF(${battery_voltage}, '')::DECIMAL(5,2),
              NULLIF(${wind_speed_min}, '')::DECIMAL(5,2),
              NULLIF(${solar_radiation}, '')::DECIMAL(7,2),
              NULLIF(${equip_temperature}, '')::DECIMAL(5,2),
              NULLIF(${pressure}, '')::DECIMAL(7,2),
              NULLIF(${wet_bulb}, '')::DECIMAL(5,2),
              NULLIF(${soil_temperature_a}, '')::DECIMAL(5,2),
              NULLIF(${soil_temperature_b}, '')::DECIMAL(5,2),
              NULLIF(${soil_moisture_a}, '')::DECIMAL(5,2),
              NULLIF(${soil_moisture_b}, '')::DECIMAL(5,2),
              NULLIF(${soil_temperature_c}, '')::DECIMAL(5,2),
              NULLIF(${soil_moisture_c}, '')::DECIMAL(5,2)
            WHERE EXISTS (SELECT 1 FROM station_id)
            ON CONFLICT (station_id, date_time) 
            DO UPDATE SET
              air_temp = EXCLUDED.air_temp,
              wind_speed = EXCLUDED.wind_speed,
              wind_gust = EXCLUDED.wind_gust,
              wind_direction = EXCLUDED.wind_direction,
              snow_depth = EXCLUDED.snow_depth,
              snow_depth_24h = EXCLUDED.snow_depth_24h,
              intermittent_snow = EXCLUDED.intermittent_snow,
              precip_accum_one_hour = EXCLUDED.precip_accum_one_hour,
              relative_humidity = EXCLUDED.relative_humidity,
              battery_voltage = EXCLUDED.battery_voltage,
              wind_speed_min = EXCLUDED.wind_speed_min,
              solar_radiation = EXCLUDED.solar_radiation,
              equip_temperature = EXCLUDED.equip_temperature,
              pressure = EXCLUDED.pressure,
              wet_bulb = EXCLUDED.wet_bulb,
              soil_temperature_a = EXCLUDED.soil_temperature_a,
              soil_temperature_b = EXCLUDED.soil_temperature_b,
              soil_moisture_a = EXCLUDED.soil_moisture_a,
              soil_moisture_b = EXCLUDED.soil_moisture_b,
              soil_temperature_c = EXCLUDED.soil_temperature_c,
              soil_moisture_c = EXCLUDED.soil_moisture_c
          `;
          if (insertResult.rowCount === 0) {
            console.warn(
              `No matching station found for stid: ${observation.stid}`
            );
          } else {
            console.log(
              `Inserted/Updated observation for station ${observation.stid} at ${formattedDateTime}`
            );
          }
          // console.log('Insert result:', insertResult);
        } catch (error) {
          console.error('Error inserting observation:', error);
          console.error(
            'Problematic observation:',
            JSON.stringify({
              stid: observation.stid,
              date_time: dateString,
              air_temp,
              wind_speed,
              wind_gust,
              wind_direction,
              snow_depth,
              snow_depth_24h,
              intermittent_snow,
              precip_accum_one_hour,
              relative_humidity,
              battery_voltage,
              wind_speed_min,
              solar_radiation,
              equip_temperature,
              pressure,
              wet_bulb,
            })
          );
          throw error; // Re-throw the error to be caught by the outer try-catch
        }
      }
    }

    return NextResponse.json({
      message: 'Weekly data updated successfully',
    });
  } catch (error) {
    console.error('Error updating weekly data:', error);
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Error updating weekly data: ' + errorMessage },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.release();
    }
  }
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Operation failed after max retries');
}
