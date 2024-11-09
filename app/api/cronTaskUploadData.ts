import { NextRequest, NextResponse } from 'next/server';
import { handleRequest } from './uploadDataLast12Hours/route';

export const config = {
  runtime: 'edge',
  // Run at 5 AM and 5 PM Pacific time
  cron: '0 5,17 * * *',
};

export default async function handler(req: NextRequest) {
  try {
    const result = await handleRequest(req);
    console.log(
      '12-hour cron job executed successfully at:',
      new Date().toISOString()
    );
    return result;
  } catch (error) {
    console.error('12-hour cron job failed:', error);
    return NextResponse.json(
      { error: 'Cron job execution failed' },
      { status: 500 }
    );
  }
}
