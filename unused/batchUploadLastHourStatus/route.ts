import { NextRequest, NextResponse } from 'next/server';
import { db } from '@vercel/postgres';
import moment from 'moment-timezone';

export async function GET(request: NextRequest) {
  let client;

  try {
    client = await db.connect();
    const end_time = moment().tz('America/Los_Angeles');
    const start_time = moment(end_time).subtract(24, 'hours');

    const query = `
      SELECT 
        COUNT(DISTINCT station_id) as stations_with_data,
        MIN(date_time) as earliest_record,
        MAX(date_time) as latest_record,
        COUNT(*) as total_observations
      FROM observations
      WHERE date_time >= $1 AND date_time <= $2
    `;

    const result = await client.query(query, [
      start_time.format('YYYY-MM-DD HH:mm:ssZ'),
      end_time.format('YYYY-MM-DD HH:mm:ssZ')
    ]);

    return NextResponse.json({
      status: 'ok',
      lastCheck: new Date().toISOString(),
      data: result.rows[0],
      timeRange: {
        start: start_time.format(),
        end: end_time.format()
      }
    });

  } catch (error) {
    console.error('Status check failed:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    }, { status: 500 });
  } finally {
    if (client) await client.release();
  }
}