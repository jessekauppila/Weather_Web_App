// run by going to this URL when running the app locally:
// http://localhost:3000/seed

import { NextResponse } from 'next/server';
import { db, VercelPoolClient } from '@vercel/postgres';
import { stations, observations } from '../lib/placeholder-data';

let client: VercelPoolClient;

const testDatabaseConnection = async () => {
  try {
    const result = await client.sql`SELECT NOW();`;
    console.log('Database connection test result:', result);
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
};

const seedStations = async () => {
  await client.sql`
    CREATE TABLE IF NOT EXISTS stations (
      id UUID PRIMARY KEY,
      stid VARCHAR(255) UNIQUE NOT NULL,
      station_name VARCHAR(255) NOT NULL,
      longitude DECIMAL(9,6) NOT NULL,
      latitude DECIMAL(9,6) NOT NULL,
      elevation INTEGER NOT NULL,
      source VARCHAR(255) NOT NULL
    );
  `;

  if (stations && stations.length > 0) {
    for (const station of stations) {
      await client.sql`
        INSERT INTO stations (id, stid, station_name, longitude, latitude, elevation, source)
        VALUES (${station.id}, ${station.stid}, ${station.station_name}, ${station.longitude}, ${station.latitude}, ${station.elevation}, ${station.source})
        ON CONFLICT (id) DO UPDATE SET
          stid = EXCLUDED.stid,
          station_name = EXCLUDED.station_name,
          longitude = EXCLUDED.longitude,
          latitude = EXCLUDED.latitude,
          elevation = EXCLUDED.elevation,
          source = EXCLUDED.source;
      `;
    }
  }

  console.log('Stations table seeded successfully');
};

const seedObservations = async () => {
  await client.sql`
    CREATE TABLE IF NOT EXISTS observations (
      id SERIAL PRIMARY KEY,
      station_id UUID NOT NULL,
      date_time TIMESTAMP WITH TIME ZONE NOT NULL,
      air_temp DECIMAL(5,2),
      snow_depth DECIMAL(5,2),
      snow_depth_24h DECIMAL(5,2),
      precip_accum_one_hour DECIMAL(5,2),
      relative_humidity DECIMAL(5,2),
      battery_voltage DECIMAL(5,2),
      intermittent_snow DECIMAL(5,2),
      precipitation DECIMAL(5,2),
      wind_speed DECIMAL(5,2),
      wind_speed_min DECIMAL(5,2),
      wind_gust DECIMAL(5,2),
      wind_direction DECIMAL(5,2),
      solar_radiation DECIMAL(7,2),
      equip_temperature DECIMAL(5,2),
      pressure DECIMAL(7,2),
      wet_bulb DECIMAL(5,2),
      soil_temperature_a DECIMAL(5,2),
      soil_temperature_b DECIMAL(5,2),
      soil_moisture_a DECIMAL(5,2),
      soil_moisture_b DECIMAL(5,2),
      soil_temperature_c DECIMAL(5,2),
      soil_moisture_c DECIMAL(5,2),
      FOREIGN KEY (station_id) REFERENCES stations(id),
      UNIQUE (station_id, date_time)
    );
  `;

  console.log('Observations table created or already exists');

  if (observations && observations.length > 0) {
    for (const obs of observations) {
      const columns = Object.keys(obs).filter((key) => key !== 'id');
      const values = columns.map((key) =>
        obs[key as keyof typeof obs] === undefined
          ? null
          : obs[key as keyof typeof obs]
      );

      const columnString = columns.join(', ');
      const valuePlaceholders = columns
        .map((_, index) => `$${index + 1}`)
        .join(', ');

      const query = `
        INSERT INTO observations (${columnString})
        VALUES (${valuePlaceholders})
        ON CONFLICT (station_id, date_time) DO UPDATE SET
        ${columns
          .map((col) => `${col} = EXCLUDED.${col}`)
          .join(', ')};
      `;

      try {
        await client.query(query, values);
        console.log('Observation inserted successfully');
      } catch (error) {
        console.error('Error inserting observation:', error);
        console.error(
          'Failed observation:',
          JSON.stringify(obs, null, 2)
        );
        console.error('Query:', query);
        console.error('Values:', values);
      }
    }
  } else {
    console.log('No observation data to insert');
  }
  console.log('Observations table seeded successfully');
};

export async function GET() {
  try {
    client = await db.connect();
    await testDatabaseConnection();
    console.log('Starting database seeding process');

    await seedStations();
    await seedObservations();

    console.log('Database seeding completed successfully');

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Error during database seeding:', error);
    await client.sql`ROLLBACK`;
    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.release();
    }
  }
}
