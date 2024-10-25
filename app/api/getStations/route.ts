import { NextResponse } from 'next/server';
import { db } from '@vercel/postgres';
//import { convertObservationUnits } from '../../utils/unitConversions'; // Adjust the import path as needed

export async function GET() {
  try {
    const stationsQuery = `
      SELECT *
      FROM stations;
    `;
    const result = await db.query(stationsQuery);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
