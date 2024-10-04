import bcrypt from 'bcrypt';
import { db } from '@vercel/postgres';
import { stations, observations } from '../lib/placeholder-data';

const client = await db.connect();

async function seedStations() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS stations (
      id UUID PRIMARY KEY,
      stid VARCHAR(255) NOT NULL,
      station_name VARCHAR(255) NOT NULL,
      longitude DECIMAL(9,6) NOT NULL,
      latitude DECIMAL(9,6) NOT NULL,
      elevation INTEGER NOT NULL,
      source VARCHAR(255) NOT NULL,
      station_note TEXT
    );
  `;

  const insertedStations = await Promise.all(
    stations.map(
      (station) => client.sql`
        INSERT INTO stations (id, stid, station_name, longitude, latitude, elevation, source, station_note)
        VALUES (${station.id}, ${station.stid}, ${station.station_name}, ${station.longitude}, ${station.latitude}, ${station.elevation}, ${station.source}, ${station.station_note})
        ON CONFLICT (id) DO NOTHING;
      `
    )
  );

  return insertedStations;
}
async function seedObservations() {
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

      battery_voltage DECIMAL(5,2),
      battery_voltage DECIMAL(5,2),
      battery_voltage DECIMAL(5,2),
      battery_voltage DECIMAL(5,2),
      battery_voltage DECIMAL(5,2),
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );
  `;

  const insertedObservations = await Promise.all(
    observations.map(
      (obs) => client.sql`
        INSERT INTO observations (station_id, date_time, air_temp, snow_depth, snow_depth_24h, precip_accum_one_hour, relative_humidity, battery_voltage)
        VALUES (${obs.station_id}, ${obs.date_time}, ${obs.air_temp}, ${obs.snow_depth}, ${obs.snow_depth_24h}, ${obs.precip_accum_one_hour}, ${obs.relative_humidity}, ${obs.battery_voltage})
        ON CONFLICT DO NOTHING;
      `
    )
  );

  return insertedObservations;
}

export async function GET() {
  try {
    await client.sql`BEGIN`;
    await seedStations();
    await seedObservations();
    await client.sql`COMMIT`;

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    await client.sql`ROLLBACK`;
    return Response.json({ error }, { status: 500 });
  }
}
