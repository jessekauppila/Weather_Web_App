import { NextRequest, NextResponse } from 'next/server';
import { db } from '@vercel/postgres';
import moment from 'moment-timezone';
import { filterSnowDepthOutliers, calculateSnowDepthAccumulation, SNOW_DEPTH_CONFIG, SNOW_DEPTH_24H_CONFIG } from '../../snowDepthUtils';

export async function GET(request: NextRequest) {
  let client;

  try {
    client = await db.connect();
    
    const end_time = moment();
    const start_time = moment(end_time).subtract(1, 'days');

    // Fetch 24 hours of data
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

    // Group by station
    const stationGroups = result.rows.reduce((acc, obs) => {
      const stid = obs.stid;
      if (!acc[stid]) acc[stid] = [];
      acc[stid].push(obs);
      return acc;
    }, {});

    let updatedCount = 0;

    // Process each station's 24h chunk
    for (const [stid, stationData] of Object.entries(stationGroups)) {
      const sortedData = stationData.sort((a, b) => 
        new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
      );

      // Filter with 24h context
      const filteredTotalSnow = filterSnowDepthOutliers(
        sortedData.map(d => ({
          date_time: d.date_time,
          snow_depth: Number(d.snow_depth),
          stid: d.stid
        })),
        SNOW_DEPTH_CONFIG
      );

      const filtered24hSnow = filterSnowDepthOutliers(
        sortedData.map(d => ({
          date_time: d.date_time,
          snow_depth: Number(d.snow_depth_24h),
          stid: d.stid
        })),
        SNOW_DEPTH_24H_CONFIG
      );

      const snowAccum = calculateSnowDepthAccumulation(filtered24hSnow);

      // Update each observation
      for (let i = 0; i < sortedData.length; i++) {
        const updateResult = await client.query(`
          UPDATE observations
          SET 
            error_filtered_total_snow = $1,
            error_filtered_24hr_snow_accum = $2
          WHERE station_id = (SELECT id FROM stations WHERE stid = $3)
            AND date_time = $4
        `, [
          filteredTotalSnow[i]?.snow_depth ?? null,
          snowAccum[i]?.snow_total ?? null,
          stid,
          sortedData[i].date_time
        ]);
        updatedCount += updateResult.rowCount ?? 0;
      }
    }

    return NextResponse.json({
      message: 'Update completed',
      updated: updatedCount
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  } finally {
    if (client) await client.release();
  }
} 