// this is used to upload data to BMR's InfoEx system

// http://localhost:3000/api/infoExExpor

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

interface Observation {
  date_time: string;
  air_temp: number;
  relative_humidity: number;
  snow_depth: number;
  wind_direction: number;
  wind_gust: number;
  wind_speed: number;
  precipitation: number;
}

export async function GET(request: NextRequest) {
    return handleRequest(request);
  }
  
  export async function POST(request: NextRequest) {
    return handleRequest(request);
  }
  

async function handleRequest(request: NextRequest) {
    const client = await db.connect();
    console.log('Starting data processing for all stations...');
    
    try {
      await client.query("SET timezone = 'America/Vancouver';");
      console.log('Timezone set to America/Vancouver');
  
      const stations = [
        {
          stid: '5',
          locationUuid: process.env.INFOEX_LOCATION_UUID || '',
          siteName: 'Heather-Meadows-Logger'
        },
        {
          stid: '6',
          locationUuid: process.env.INFOEX_LOCATION_UUID_PANDOME || '',
          siteName: 'Pan-Dome-Logger'
        }
        // Add more stations as needed
      ];
  
      // Process each station
      for (const station of stations) {
        console.log(`Processing station ${station.siteName} (STID: ${station.stid})...`);
        await processStation(client, station);
      }
  
      return NextResponse.json({ 
        success: true, 
        message: 'Data uploaded to InfoEx for all stations'
      });
  
    } catch (error) {
      console.error('Full Error Details:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process stations',
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    } finally {
      await client.release();
      console.log('Database connection released');
    }
  }
  
  async function processStation(client: any, station: { stid: string, locationUuid: string, siteName: string }) {
    console.log(`Querying database for station ${station.siteName}...`);
    
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
        WHERE s.stid = $1
      )
      AND o.date_time >= NOW() - INTERVAL '3 hours'
      ORDER BY o.date_time DESC
      LIMIT 1;
    `;
  
    const observations = await client.query(observationsQuery, [station.stid]);
    console.log(`Found ${observations.rows.length} observations for ${station.siteName}`);
    
    if (observations.rows.length === 0) {
      console.log(`No recent data found for station ${station.siteName}`);
      return;
    }
  
    console.log(`Processing data for ${station.siteName}...`);
    const processedData = observations.rows.map((obs: Observation) => {
      const pacificDate = new Date(obs.date_time);
      pacificDate.setHours(pacificDate.getHours() - 8);
      console.log(`Converting time for ${station.siteName}: ${obs.date_time} -> ${pacificDate.toISOString()}`);
      
      return {
        Location_UUID: station.locationUuid,
        obDate: pacificDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }),
        obTime: pacificDate.toLocaleTimeString('en-US', { 
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
        baro: '',
        baroUnit: 'kPa',
        rH: obs.relative_humidity ? Math.round(Number(obs.relative_humidity)) : '',
        windGustSpeedNum: obs.wind_gust || '',
        windGustSpeedNumUnit: 'kph',
        windGustDirNum: '',
        dewPoint:  '',
        dewPointUnit: 'C',
        hn24Auto: '',
        hn24AutoUnit: 'cm',
        hstAuto: '',
        hstAutoUnit: 'cm'
      }
    }) as InfoExData[];
  
    const csv = convertToCSV(processedData);
    console.log(`CSV created for ${station.siteName}: ${csv.substring(0, 100)}...`);
  
    console.log(`Starting FTP upload for ${station.siteName}...`);
    await uploadToInfoEx(csv, station.siteName);
    console.log(`Upload completed for ${station.siteName}`);
  }
  
  async function uploadToInfoEx(csvData: string, siteName: string): Promise<boolean> {
    const client = new ftp.Client();
    client.ftp.verbose = true;
  
    try {
      console.log(`Connecting to InfoEx FTP for ${siteName}...`);
      await client.access({
        host: 'weather.infoex.ca',
        user: process.env.INFOEX_UUID || '',
        password: process.env.INFOEX_API_KEY || '',
        secure: false
      });
      console.log('Connected successfully');
  
      const fileName = `INFOEX-${siteName}.csv`;
      console.log(`Uploading file: ${fileName}`);
      
      await client.uploadFrom(Readable.from(Buffer.from(csvData)), fileName);
      console.log(`Upload complete for ${fileName}`);
      
      return true;
    } catch (err) {
      console.error(`FTP Upload Error for ${siteName}:`, err);
      throw err;
    } finally {
      client.close();
      console.log(`FTP connection closed for ${siteName}`);
    }
  }

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
  