import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM api_runs 
      ORDER BY run_time DESC
    `;

    console.log('All API runs:', result.rows);

    return NextResponse.json({ 
      lastApiCall: result.rows[0]?.run_time,
      allCalls: result.rows
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.error();
  }
}