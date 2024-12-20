import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  const client = await db.connect();
  
  try {
    const result = await client.query(`
      SELECT run_time 
      FROM api_runs 
      WHERE type = 'batch_upload' 
      ORDER BY run_time DESC 
      LIMIT 1
    `);
    
    return NextResponse.json({
      lastApiCall: result.rows[0]?.run_time
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch last API run' }, { status: 500 });
  } finally {
    client.release();
  }
}