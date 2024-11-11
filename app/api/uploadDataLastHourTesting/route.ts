// run by going to this URL when running the app locally:
// http://localhost:3000/api/uploadDataLastHourTesting

//this is used to upload the last hour of data to the database, it is run a minute, 5 minutes, and 20 minutes after the hour

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@vercel/postgres';
import moment from 'moment-timezone';
import processAllWxData from '../allWxprocessor';

// Add this validation helper function at the top of the file
function validateNumericValue(value: number | null, maxValue: number): number | null {
  if (value === null) return null;
  if (Math.abs(value) > maxValue) {
    console.warn(`Value ${value} exceeds maximum ${maxValue}, setting to null`);
    return null;
  }
  return value;
}

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
      '4',
      '5',
      '6',
      // '1',
      // '11',
      // '12',
      // '13',
      // '14',
      // '17',
      // '18',
      // '19',
      // '2',
      // '20',
      // '21',
      // '22',
      // '23',
      // '24',
      // '25',
      // '26',
      // '27',
      // '28',
      // '29',
      // '3',
      // '30',
      // '31',
      // '32',
      // '33',
      // '34',
      // '35',
      // '36',
      // '37',
      // '39',
      // '4',
      // '40',
      // '41',
      // '42',
      // '43',
      // '44',
      // '45',
      // '46',
      // '47',
      // '48',
      // '49',
      // '5',
      // '50',
      // '51',
      // '53',
      // '54',
      // '56',
      // '57',
      // '6',
      // '7',
      // '8',
      // '9',
    ];

    const auth: string = '50a07f08af2fe5ca0579c21553e1c9029e04';

    // Fetch weather data
    let observationsData;
    let allKeys;
    try {
      const result = await retryOperation(() =>
        processAllWxData(start_time_pst, end_time_pst, stids, auth)
      );
      observationsData = result.observationsData;
      allKeys = result.allKeys;
      console.log('Available keys:', allKeys);
      console.log(
        'Fetched observations data:',
        JSON.stringify(observationsData, null, 2)
      );
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

    for (const observation of observationsData) {
      console.log(
        'Observation:',
        JSON.stringify(observation, null, 2)
      );

      if (!Array.isArray(observation.date_time)) {
        console.error(
          'Expected date_time to be an array, but got:',
          observation.date_time
        );
        continue;
      }

      // Helper function to safely get a value from an array or return null
      const safeGetArrayValue = (arr: any[], index: number) =>
        Array.isArray(arr) && arr.length > index ? arr[index] : null;

      // Helper function to safely parse a numeric value
      const safeParseFloat = (
        value: string | null | undefined
      ): number | null => {
        if (value === null || value === undefined || value === '') {
          return null;
        }
        const parsed = parseFloat(value);
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
          safeGetArrayValue(observation.air_temp, i)
        );
        const wind_speed = safeParseFloat(
          safeGetArrayValue(observation.wind_speed, i)
        );
        const wind_gust = safeParseFloat(
          safeGetArrayValue(observation.wind_gust, i)
        );
        const wind_direction = safeParseFloat(
          safeGetArrayValue(observation.wind_direction, i)
        );
        const snow_depth = safeParseFloat(
          safeGetArrayValue(observation.snow_depth, i)
        );
        const snow_depth_24h = safeParseFloat(
          safeGetArrayValue(observation.snow_depth_24h, i)
        );
        const intermittent_snow = safeGetArrayValue(
          observation.intermittent_snow,
          i
        );
        const precip_accum_one_hour = safeParseFloat(
          safeGetArrayValue(observation.precip_accum_one_hour, i)
        );
        const relative_humidity = safeParseFloat(
          safeGetArrayValue(observation.relative_humidity, i)
        );
        const battery_voltage = safeParseFloat(
          safeGetArrayValue(observation.battery_voltage, i)
        );
        const wind_speed_min = safeParseFloat(
          safeGetArrayValue(observation.wind_speed_min, i)
        );
        const solar_radiation = safeParseFloat(
          safeGetArrayValue(observation.solar_radiation, i)
        );
        const equip_temperature = safeParseFloat(
          safeGetArrayValue(observation.equip_temperature, i)
        );
        const pressure = safeParseFloat(
          safeGetArrayValue(observation.pressure, i)
        );
        const wet_bulb = safeParseFloat(
          safeGetArrayValue(observation.wet_bulb, i)
        );
        const soil_temperature_a = safeParseFloat(
          safeGetArrayValue(observation.soil_temperature_a, i)
        );
        const soil_temperature_b = safeParseFloat(
          safeGetArrayValue(observation.soil_temperature_b, i)
        );
        const soil_moisture_a = safeParseFloat(
          safeGetArrayValue(observation.soil_moisture_a, i)
        );
        const soil_moisture_b = safeParseFloat(
          safeGetArrayValue(observation.soil_moisture_b, i)
        );
        const soil_temperature_c = safeParseFloat(
          safeGetArrayValue(observation.soil_temperature_c, i)
        );
        const soil_moisture_c = safeParseFloat(
          safeGetArrayValue(observation.soil_moisture_c, i)
        );
        const precipitation = safeParseFloat(
          safeGetArrayValue(observation.precipitation, i)
        );

        // Before the SQL insert, add validation:
        const validatedData = {
          air_temp: validateNumericValue(air_temp, 999.99),
          wind_speed: validateNumericValue(wind_speed, 999.99),
          wind_gust: validateNumericValue(wind_gust, 999.99),
          wind_direction: validateNumericValue(wind_direction, 360),
          snow_depth: validateNumericValue(snow_depth, 9999.99), // Increased max for snow depth
          snow_depth_24h: validateNumericValue(snow_depth_24h, 999.99),
          intermittent_snow: validateNumericValue(intermittent_snow, 999.99),
          precip_accum_one_hour: validateNumericValue(precip_accum_one_hour, 99.999999),
          relative_humidity: validateNumericValue(relative_humidity, 100),
          battery_voltage: validateNumericValue(battery_voltage, 999.99),
          wind_speed_min: validateNumericValue(wind_speed_min, 999.99),
          solar_radiation: validateNumericValue(solar_radiation, 9999.99),
          equip_temperature: validateNumericValue(equip_temperature, 999.99),
          pressure: validateNumericValue(pressure, 9999.99),
          wet_bulb: validateNumericValue(wet_bulb, 999.99),
          soil_temperature_a: validateNumericValue(soil_temperature_a, 999.99),
          soil_temperature_b: validateNumericValue(soil_temperature_b, 999.99),
          soil_moisture_a: validateNumericValue(soil_moisture_a, 999.99),
          soil_moisture_b: validateNumericValue(soil_moisture_b, 999.99),
          soil_temperature_c: validateNumericValue(soil_temperature_c, 999.99),
          soil_moisture_c: validateNumericValue(soil_moisture_c, 999.99),
          precipitation: validateNumericValue(precipitation, 999.9999)
        };

        try {
          const insertResult = await client.sql`
            WITH station_id AS (
              SELECT id FROM stations WHERE stid = ${observation.stid}
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
              soil_moisture_c,
              precipitation
            )
            SELECT
              (SELECT id FROM station_id),
              ${formattedDateTime}::timestamp with time zone,
              NULLIF(${validatedData.air_temp}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.wind_speed}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.wind_gust}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.wind_direction}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.snow_depth}, '')::DECIMAL(10,2),
              NULLIF(${validatedData.snow_depth_24h}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.intermittent_snow}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.precip_accum_one_hour}, '')::DECIMAL(8,6),
              NULLIF(${validatedData.relative_humidity}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.battery_voltage}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.wind_speed_min}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.solar_radiation}, '')::DECIMAL(10,2),
              NULLIF(${validatedData.equip_temperature}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.pressure}, '')::DECIMAL(10,2),
              NULLIF(${validatedData.wet_bulb}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.soil_temperature_a}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.soil_temperature_b}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.soil_moisture_a}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.soil_moisture_b}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.soil_temperature_c}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.soil_moisture_c}, '')::DECIMAL(8,2),
              NULLIF(${validatedData.precipitation}, '')::DECIMAL(8,4)
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
              soil_moisture_c = EXCLUDED.soil_moisture_c,
              precipitation = EXCLUDED.precipitation
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
          console.log('Insert result:', insertResult);
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
              precipitation
            })
          );
          throw error; // Re-throw the error to be caught by the outer try-catch
        }
      }
    }

    // Add this before the final success response
    console.log('\n=== Raw Data Summary ===');
    observationsData.forEach(station => {
      console.log(`\nStation ${station.stid}:`);
      console.log('Raw data:', station);
      console.log('Precipitation values:', station.precip_accum_one_hour);
    });
    console.log('\n===========================\n');

    // Keep your existing precipitation summary
    const precipSummary = await client.sql`
      SELECT s.stid, s.station_name, o.date_time, o.precip_accum_one_hour 
      FROM observationsTest o
      JOIN stations s ON s.id = o.station_id
      WHERE o.date_time >= ${start_time_pst.toISOString()}
      ORDER BY s.stid, o.date_time;
    `;

    console.log('\n=== Database Precipitation Summary ===');
    let currentStation = '';
    precipSummary.rows.forEach(row => {
      const dateStr = new Date(row.date_time).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      if (currentStation !== row.stid) {
        console.log(`\nStation ${row.stid} - ${row.station_name}:`);
        currentStation = row.stid;
      }
      console.log(`  ${dateStr}: ${row.precip_accum_one_hour ?? 'No data'} inches`);
    });
    console.log('\n===========================\n');

    return NextResponse.json({
      message: 'Weekly data updated successfully',
      precipitationSummary: precipSummary.rows,
      allKeys: allKeys
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
