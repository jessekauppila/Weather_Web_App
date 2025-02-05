// this is used to upload data to BMR's InfoEx system

// http://localhost:3000/api/infoExExportStid6

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@vercel/postgres';
import * as ftp from 'basic-ftp';
//import * as fs from 'fs/promises';
import { Readable } from 'stream';

// First, let's define the InfoEx data structure
interface InfoExData {
  Location_UUID: string;
  obDate: string;
  obTime: string;
  timeZone: string;
  tempMaxHour: number | '';
  tempMaxHourUnit: string;
  tempMinHour: number | '';
  tempMinHourUnit: string;
  tempPres: number | '';
  tempPresUnit: string;
  precipitationGauge: number | '';
  precipitationGaugeUnit: string;
  windSpeedNum: number | '';
  windSpeedUnit: string;
  windDirectionNum: number | '';
  hS: number | '';  // snow depth
  hsUnit: string;
  baro: number | '';
  baroUnit: string;
  rH: number | '';  // relative humidity
  windGustSpeedNum: number | '';
  windGustSpeedNumUnit: string;
  windGustDirNum: number | '';
  dewPoint: number | '';
  dewPointUnit: string;
  hn24Auto: number | '';  // 24hr snow accumulation
  hn24AutoUnit: string;
  hstAuto: number | '';  // storm total
  hstAutoUnit: string;
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  try {
    console.log('Starting data processing...');
    
    // 1. Get data from your database
    const client = await db.connect();
    const observationsQuery = `
        SELECT 
        o.id as observation_id,
        o.station_id,
        o.date_time,
        o.air_temp,
        o.relative_humidity,
        o.snow_depth,
        o.wind_direction,
        o.wind_gust,
        o.wind_speed,
        o.precipitation
        FROM observations o
        WHERE o.station_id = (
            SELECT s.id
            FROM stations s
            WHERE s.stid = '6'
        )
        AND o.date_time >= NOW() - INTERVAL '3 hours'
        ORDER BY o.date_time DESC
        LIMIT 1;
    `;
    
    const observations = await client.query(observationsQuery);
    
    if (observations.rows.length === 0) {
      return NextResponse.json(
        { error: 'No recent observations found' },
        { status: 404 }
      );
    }

    console.log('Database query completed');
    console.log('Processing data:', observations.rows.length, 'records');

    // 2. Process the data
    const processedData = observations.rows.map(obs => ({
      Location_UUID: process.env.INFOEX_LOCATION_UUID_PANDOME || '',
      obDate: new Date(obs.date_time).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }),
      obTime: new Date(obs.date_time).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit'
      }),
      timeZone: 'Pacific',
      tempMaxHour: obs.air_temp ? Number(obs.air_temp).toFixed(1) : '',
      tempMaxHourUnit: 'C',
      tempMinHour: obs.air_temp ? Number(obs.air_temp).toFixed(1) : '',
      tempMinHourUnit: 'C',
      tempPres: obs.air_temp ? Number(obs.air_temp).toFixed(1) : '',
      tempPresUnit: 'C',
      precipitationGauge: obs.precipitation || '',
      precipitationGaugeUnit: 'mm',
      windSpeedNum: obs.wind_speed || '',
      windSpeedUnit: 'kph',
      windDirectionNum: obs.wind_direction || '',
      hS: obs.snow_depth ? Math.round(Number(obs.snow_depth)) : '',
      hsUnit: 'cm',
      baro: obs.pressure || '',
      baroUnit: 'kPa',
      rH: obs.relative_humidity ? Math.round(Number(obs.relative_humidity)) : '',
      windGustSpeedNum: obs.wind_gust || '',
      windGustSpeedNumUnit: 'kph',
      windGustDirNum: obs.wind_gust_direction || '',
      dewPoint:  '',
      dewPointUnit: 'C',
      hn24Auto: '',
      hn24AutoUnit: 'cm',
      hstAuto: '',
      hstAutoUnit: 'cm'
    })) as InfoExData[];

    console.log('Data processed successfully');

    // 3. Create CSV
    const csv = convertToCSV(processedData);
    console.log('CSV created:', csv.substring(0, 100) + '...');

    // 4. Upload to InfoEx
    console.log('Starting FTP upload...');
    try {
      const uploadResult = await uploadToInfoEx(csv);
      console.log('FTP upload result:', uploadResult);

      return NextResponse.json({ 
        success: true, 
        message: 'Data uploaded to InfoEx',
        data: processedData[0],
        uploadStatus: 'completed'
      });
    } catch (ftpError) {
      console.error('FTP Upload Error Details:', ftpError);
      throw ftpError;
    }

  } catch (error) {
    console.error('Full Error Details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process or upload data',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

////////////////
/// Functions // 
////////////////

// Convert to CSV
function convertToCSV(data: InfoExData[]): string {
  if (data.length === 0) return '';
  
  // Only include the data rows, no headers
  const rows = data.map(row => 
    Object.values(row).map(value => 
      value === '' ? '""' : `"${value}"`
    ).join(',')
  );
  
  return rows.join('\n');
}

async function uploadToInfoEx(csvData: string): Promise<boolean> {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log('Connecting to InfoEx FTP...');
    await client.access({
      host: 'weather.infoex.ca',
      user: process.env.INFOEX_UUID || '',
      password: process.env.INFOEX_API_KEY || '',
      secure: false
    });
    console.log('Connected successfully');

    const siteName = 'Pandome-Logger';
    const fileName = `INFOEX-${siteName}.csv`;
    console.log(`Uploading file: ${fileName}`);
    
    await client.uploadFrom(Readable.from(Buffer.from(csvData)), fileName);
    console.log('Upload complete');
    
    return true;
  } catch (err) {
    console.error('FTP Upload Error:', err);
    throw err;
  } finally {
    client.close();
  }
}