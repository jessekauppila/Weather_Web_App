import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
  // Run at 5 AM and 5 PM Pacific time
  cron: '0 5,17 * * *',
};

export default async function handler(req: NextRequest) {
  try {
    // Make an internal request to the upload endpoint
    const response = await fetch(
      new URL('/api/uploadDataLast12Hours', req.url),
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(
      '12-hour cron job executed successfully at:',
      new Date().toISOString()
    );
    return response;
  } catch (error) {
    console.error('12-hour cron job failed:', error);
    return NextResponse.json(
      { error: 'Cron job execution failed' },
      { status: 500 }
    );
  }
}
