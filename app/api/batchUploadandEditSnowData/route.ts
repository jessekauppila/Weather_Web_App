// run by going to this URL when running the app locally:
// http://localhost:3000/api/batchUploadandEditSnowData

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@vercel/postgres';
import moment from 'moment-timezone';
import { filterSnowDepthOutliers, calculateSnowDepthAccumulation, SNOW_DEPTH_CONFIG, SNOW_DEPTH_24H_CONFIG } from '../../snowDepthUtils';

export async function GET(request: NextRequest) {
  let client;

  try {
    client = await db.connect();
    console.log('Database connected');
    
    const chunkDays = 2;
    const end_time = moment();
    const start_time = moment(end_time).subtract(chunkDays, 'days');
    console.log('Time range:', { start: start_time.format(), end: end_time.format() });

    // Fetch observations
    const result = await client.query(`
      SELECT 
        o.date_time,
        o.station_id,
        o.snow_depth,
        o.snow_depth_24h,
        s.stid
      FROM observations o
      JOIN stations s ON o.station_id = s.id
      WHERE o.date_time >= $1 AND o.date_time < $2
      ORDER BY o.station_id, o.date_time
    `, [start_time.toISOString(), end_time.toISOString()]);

    console.log('Fetched rows:', result.rows.length);
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        message: 'No data found for the specified time range',
        timeRange: { start: start_time.format(), end: end_time.format() }
      });
    }

    // Process the data
    console.log('Starting snow data processing');
    const processedData = processSnowData(result.rows);
    console.log('Processed data count:', processedData.length);

    // Log sample of processed data
    if (processedData.length > 0) {
      console.log('Sample processed data:', processedData[0]);
    }

    // Update database
    let updatedCount = 0;
    for (const data of processedData) {
      try {
        const updateResult = await client.query(`
          UPDATE observations
          SET 
            error_filtered_total_snow = $1,
            error_filtered_24hr_snow_accum = $2
          WHERE station_id = (SELECT id FROM stations WHERE stid = $3)
            AND date_time = $4;
        `, [
          data.error_filtered_total_snow,
          data.error_filtered_24hr_snow_accum,
          data.stid,
          data.date_time
        ]);
        updatedCount += updateResult.rowCount ?? 0;
      } catch (updateError) {
        console.error('Error updating row:', {
          error: updateError,
          data: data
        });
      }
    }

    return NextResponse.json({
      message: 'Snow data processing completed',
      processed: processedData.length,
      updated: updatedCount
    });

  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { 
        error: 'Error processing snow data', 
        details: error,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.release();
    }
  }
}

// Use your existing processSnowData function here
function processSnowData(batch: any[]) {
  // Group by station
  const stationGroups: { [key: string]: ProcessedObservation[] } = batch.reduce((acc, obs) => {
    const stid = obs.stid;
    if (!acc[stid]) acc[stid] = [];
    acc[stid].push(obs);
    return acc;
  }, {});

  // Process each station's data
  const processedData: ProcessedObservation[] = [];
  
  // @ts-ignore
  Object.entries(stationGroups).forEach(([stid, stationData]) => {
    // Sort by date
    const sortedData = stationData.sort((a, b) => 
      new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );

    // Split into 24-hour chunks
    const chunks: ProcessedObservation[][] = [];
    let currentChunk: ProcessedObservation[] = [];
    let chunkStartTime = new Date(sortedData[0].date_time).getTime();

    sortedData.forEach(obs => {
      const obsTime = new Date(obs.date_time).getTime();
      if (obsTime - chunkStartTime > 24 * 60 * 60 * 1000) {
        chunks.push(currentChunk);
        currentChunk = [];
        chunkStartTime = obsTime;
      }
      currentChunk.push(obs);
    });
    if (currentChunk.length > 0) chunks.push(currentChunk);

    // Process each 24-hour chunk
    chunks.forEach(chunk => {
      const filteredTotalSnow = filterSnowDepthOutliers(
        chunk
          .filter(d => d.snow_depth !== null && typeof d.snow_depth === 'number')
          .map(d => ({
            date_time: d.date_time,
            snow_depth: Number(d.snow_depth),
            stid: d.stid
          })),
        SNOW_DEPTH_CONFIG
      );

      const filtered24hSnow = filterSnowDepthOutliers(
        chunk
          .filter(d => d.snow_depth_24h !== null && typeof d.snow_depth_24h === 'number')
          .map(d => ({
            date_time: d.date_time,
            snow_depth: Number(d.snow_depth_24h),
            stid: d.stid
          })),
        SNOW_DEPTH_24H_CONFIG
      );

      // Calculate accumulation
      const snowAccum = calculateSnowDepthAccumulation(filtered24hSnow);

      // Merge processed data back
      chunk.forEach((obs, index) => {
        processedData.push({
          ...obs,
          error_filtered_total_snow: filteredTotalSnow[index]?.snow_depth ?? null,
          error_filtered_24hr_snow_accum: snowAccum[index]?.snow_total ?? null
        });
      });
    });
  });

  return processedData;
}

interface ProcessedObservation {
  date_time: string;
  snow_depth: number | null;
  snow_depth_24h: number | null;
  error_filtered_total_snow: number | null;
  error_filtered_24hr_snow_accum: number | null;
  [key: string]: any;
}