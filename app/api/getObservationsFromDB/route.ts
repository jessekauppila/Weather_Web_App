// this is activley used in the dayWxTableDataDayFromDB.tsx file to look for observations in the database
// I might want to do the conversions directly to this file before they go to dayWxTableDataDayFromDB

// http://localhost:3000/api/getObservationsFromDB

import { NextResponse } from 'next/server';
import { db } from '@vercel/postgres';
import { convertObservationUnits } from '../../utils/unitConversions'; // Adjust the import path as needed

export async function POST(request: Request) {
  try {
    const { startDate, endDate, stationIds, isMetric } = await request.json();
    //console.log('🌐 API: Processing request with isMetric:', isMetric);

    const client = await db.connect();

    // Query for observations
    const observationsQuery = `
      SELECT 
        o.id as observation_id,
        o.station_id,
        o.date_time,
        o.air_temp,
        o.battery_voltage,
        o.equip_temperature,
        o.intermittent_snow,
        o.precip_accum_one_hour,
        o.error_filtered_total_snow,
        o.error_filtered_24hr_snow_accum,
        o.relative_humidity,
        o.snow_depth,
        o.snow_depth_24h,
        o.solar_radiation,
        o.wind_direction,
        o.wind_gust,
        o.wind_speed,
        o.wind_speed_min,
        o.precipitation,
        o.api_fetch_time,
        s.stid,
        s.station_name,
        s.elevation
      FROM observations o
      JOIN stations s ON o.station_id = s.id
      WHERE s.stid = ANY($1)
      AND o.date_time >= $2 
      AND o.date_time < $3
      ORDER BY o.date_time ASC;
    `;


    const observationsResult = await client.query(observationsQuery, [
      stationIds,
      startDate,
      endDate,
    ]);


    // Query for units
    const unitsQuery = `SELECT measurement, unit FROM units;`;
    const unitsResult = await client.query(unitsQuery);

    await client.release();

    // Convert units for each observation
    const convertedObservations = observationsResult.rows.map(obs => 
      convertObservationUnits(obs, isMetric)
    );

    return NextResponse.json({
      observations: convertedObservations,
      units: unitsResult.rows,
    });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
