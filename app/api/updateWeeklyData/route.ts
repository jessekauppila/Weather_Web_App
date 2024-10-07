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

    // Set time range for the last week
    const end_time_pst = moment().tz('America/Los_Angeles');
    const start_time_pst = moment(end_time_pst).subtract(1, 'hours');

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

      // Helper function to safely get a value from an array or return null
      const safeGetArrayValue = (arr, index) =>
        Array.isArray(arr) && arr.length > index ? arr[index] : null;

      // Helper function to safely parse a numeric value
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

        try {
          await client.sql`
            INSERT INTO observations (
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
            VALUES (
              (SELECT id FROM stations WHERE stid = ${observation.stid}),
              ${formattedDateTime}::timestamp with time zone,
              ${air_temp},
              ${wind_speed},
              ${wind_gust},
              ${wind_direction},
              ${snow_depth},
              ${snow_depth_24h},
              ${intermittent_snow},
              ${precip_accum_one_hour},
              ${relative_humidity},
              ${battery_voltage},
              ${wind_speed_min},
              ${solar_radiation},
              ${equip_temperature},
              ${pressure},
              ${wet_bulb},
              ${soil_temperature_a},
              ${soil_temperature_b},
              ${soil_moisture_a},
              ${soil_moisture_b},
              ${soil_temperature_c},
              ${soil_moisture_c}
            )
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
              soil_moisture_c = EXCLUDED.soil_moisture_c;
          `;
          console.log(
            `Inserted/Updated observation for station ${observation.stid} at ${formattedDateTime}`
          );
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
              soil_temperature_a,
              soil_temperature_b,
              soil_moisture_a,
              soil_moisture_b,
              soil_temperature_c,
              soil_moisture_c,
            })
          );
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
