// run by going to this URL when running the app locally:
// http://localhost:3000/api/updateWeeklyData

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

    // Get the column names from the observations table
    const tableInfoResult = await client.sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'observations';
    `;
    const columnNames = tableInfoResult.rows.map(
      (row) => row.column_name
    );

    // Set time range for the last week
    const end_time_pst = moment().tz('America/Los_Angeles');
    const start_time_pst = moment(end_time_pst).subtract(1, 'days');

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
    const { observationsData } = await processAllWxData(
      start_time_pst,
      end_time_pst,
      stids,
      auth
    );

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

      // Helper functions (same as before)
      const safeGetArrayValue = (arr, index) =>
        Array.isArray(arr) && arr.length > index ? arr[index] : null;
      const safeParseFloat = (value) => {
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

        // Prepare the data object
        const data = {
          station_id: `(SELECT id FROM stations WHERE stid = ${observation.stid})`,
          date_time: formattedDateTime,
          air_temp: safeParseFloat(
            safeGetArrayValue(observation.air_temp, i)
          ),
          wind_speed: safeParseFloat(
            safeGetArrayValue(observation.wind_speed, i)
          ),
          wind_gust: safeParseFloat(
            safeGetArrayValue(observation.wind_gust, i)
          ),
          wind_direction: safeParseFloat(
            safeGetArrayValue(observation.wind_direction, i)
          ),
          snow_depth: safeParseFloat(
            safeGetArrayValue(observation.snow_depth, i)
          ),
          snow_depth_24h: safeParseFloat(
            safeGetArrayValue(observation.snow_depth_24h, i)
          ),
          intermittent_snow: safeGetArrayValue(
            observation.intermittent_snow,
            i
          ),
          precip_accum_one_hour: safeParseFloat(
            safeGetArrayValue(observation.precip_accum_one_hour, i)
          ),
          relative_humidity: safeParseFloat(
            safeGetArrayValue(observation.relative_humidity, i)
          ),
          battery_voltage: safeParseFloat(
            safeGetArrayValue(observation.battery_voltage, i)
          ),
          wind_speed_min: safeParseFloat(
            safeGetArrayValue(observation.wind_speed_min, i)
          ),
          solar_radiation: safeParseFloat(
            safeGetArrayValue(observation.solar_radiation, i)
          ),
          equip_temperature: safeParseFloat(
            safeGetArrayValue(observation.equip_temperature, i)
          ),
          pressure: safeParseFloat(
            safeGetArrayValue(observation.pressure, i)
          ),
          wet_bulb: safeParseFloat(
            safeGetArrayValue(observation.wet_bulb, i)
          ),
          soil_temperature_a: safeParseFloat(
            safeGetArrayValue(observation.soil_temperature_a, i)
          ),
          soil_temperature_b: safeParseFloat(
            safeGetArrayValue(observation.soil_temperature_b, i)
          ),
          soil_moisture_a: safeParseFloat(
            safeGetArrayValue(observation.soil_moisture_a, i)
          ),
          soil_moisture_b: safeParseFloat(
            safeGetArrayValue(observation.soil_moisture_b, i)
          ),
          soil_temperature_c: safeParseFloat(
            safeGetArrayValue(observation.soil_temperature_c, i)
          ),
          soil_moisture_c: safeParseFloat(
            safeGetArrayValue(observation.soil_moisture_c, i)
          ),
        };

        // Filter out fields that don't exist in the table
        const existingColumns = Object.keys(data).filter((key) =>
          columnNames.includes(key)
        );
        const values = existingColumns.map((key) => data[key]);

        // Construct the SQL query dynamically
        const insertColumns = existingColumns.join(', ');
        const insertPlaceholders = existingColumns
          .map((_, index) => `$${index + 1}`)
          .join(', ');
        const updateSet = existingColumns
          .map((col) => `${col} = EXCLUDED.${col}`)
          .join(', ');

        const queryString = `
          INSERT INTO observations (${insertColumns})
          VALUES (${insertPlaceholders})
          ON CONFLICT (station_id, date_time) 
          DO UPDATE SET ${updateSet};
        `;

        try {
          // Use the sql tagged template literal with interpolation
          await client.sql`${queryString}`.values(values);
          console.log(
            `Inserted/Updated observation for station ${observation.stid} at ${formattedDateTime}`
          );
        } catch (error) {
          console.error('Error inserting observation:', error);
          console.error(
            'Problematic observation:',
            JSON.stringify(data)
          );
          console.error('Query:', queryString);
          console.error('Values:', values);
        }
      }
    }

    return NextResponse.json({
      message: 'Weekly data updated successfully',
    });
  } catch (error) {
    console.error('Error updating weekly data:', error);
    return NextResponse.json(
      { error: 'Error updating weekly data' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.release();
    }
  }
}
