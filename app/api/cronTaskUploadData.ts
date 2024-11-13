import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
  // Cron job so it should run 1, 5, and 30 minutes after the hour 
  cron: '1,5,30 * * * *',};

export default async function handler(req: NextRequest) {
  try {
    // Make an internal request to the upload endpoint
    const response = await fetch(
      new URL('/api/uploadDataLastHour', req.url),
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(
      'Cron job executed successfully at:',
      new Date().toISOString()
    );
    return response;
  } catch (error) {
    console.error('Cronjob failed:', error);
    return NextResponse.json(
      { error: 'Cron job execution failed' },
      { status: 500 }
    );
  }
}
