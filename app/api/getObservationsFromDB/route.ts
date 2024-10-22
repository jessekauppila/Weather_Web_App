import { NextResponse } from 'next/server';
import { db } from '@vercel/postgres';

export async function POST(request: Request) {
  const { startDate, endDate, stationIds } = await request.json();

  try {
    const client = await db.connect();

    // Query for observations
    const observationsQuery = `
      SELECT o.*, s.stid
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
    const unitsQuery = `SELECT * FROM units;`;
    const unitsResult = await client.query(unitsQuery);

    await client.release();

    return NextResponse.json({
      observations: observationsResult.rows,
      units: unitsResult.rows,
    });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
