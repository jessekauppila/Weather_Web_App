// run by going to this URL when running the app locally:
// http://localhost:3000/api/updateStations

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
    const start_time_pst = moment(end_time_pst).subtract(365, 'days');

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
      const result = await processAllWxData(
        start_time_pst,
        end_time_pst,
        stids,
        auth
      );
      observationsData = result.observationsData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return NextResponse.json(
        {
          error:
            'Failed to fetch weather data: ' +
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

    // Insert or update station data
    for (const station of observationsData) {
      try {
        const insertResult = await client.sql`
          INSERT INTO stations (id, stid, station_name, longitude, latitude, elevation, source)
          VALUES (
            ${station.id},
            ${station.stid},
            ${station['Station Name']},
            ${station.Longitude},
            ${station.Latitude},
            ${station.elevation},
            ${station.source}
          )
          ON CONFLICT (stid) 
          DO UPDATE SET
            id = EXCLUDED.id,
            station_name = EXCLUDED.station_name,
            longitude = EXCLUDED.longitude,
            latitude = EXCLUDED.latitude,
            elevation = EXCLUDED.elevation,
            source = EXCLUDED.source;
        `;
        console.log(`Inserted/Updated station ${station.stid}`);
      } catch (error) {
        console.error('Error inserting/updating station:', error);
        console.error(
          'Problematic station:',
          JSON.stringify(station)
        );
      }
    }
    return NextResponse.json({
      message: 'Station data updated successfully',
    });
  } catch (error) {
    console.error('Error updating station data:', error);
    return NextResponse.json(
      {
        error:
          'Error updating station data: ' +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.release();
    }
  }
}
