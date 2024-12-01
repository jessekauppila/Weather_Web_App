// run by going to this URL when running the app locally:
// http://localhost:3000/api/batchUploadLastHour

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@vercel/postgres';
import moment from 'moment-timezone';
import processAllWxData from '../allWxprocessor';
import { VercelPoolClient } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  let client;
  const startTime = new Date();
  console.log('=== Batch Upload Started ===', startTime.toISOString());

  try {
    client = await db.connect();
    
    const end_time_pst = moment().tz('America/Los_Angeles');
    const start_time_pst = moment(end_time_pst).subtract(1, 'hours');

    console.log('Time Range:', {
      start: start_time_pst.format(),
      end: end_time_pst.format(),
      currentServerTime: new Date().toISOString()
    });

    // Add request tracking
    let totalAttempted = 0;
    let totalSuccessful = 0;
    let failedStations: string[] = [];

    const stids = [
      '1',
      '14',
      '11',
      '12',
      '13',
      '14',
      '17',
      '18',
      '19',
      '2',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '3',
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '39',
      '4',
      '40',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
      '5',
      '50',
      '51',
      '53',
      '54',
      '56',
      '57',
      '6',
      '7',
      '8',
      '9',
    ];
    const auth: string = '50a07f08af2fe5ca0579c21553e1c9029e04';

    // Create Set of all stations we're trying to fetch
    const attemptedStations = new Set(stids);
    const updatedStations = new Set<string>();

    let observationsData;
    try {
      const result = await retryOperation(() =>
        processAllWxData(start_time_pst, end_time_pst, stids, auth)
      );

      console.log(
        'Result from processAllWxData:',
        JSON.stringify(result, null, 2)
      );

      if (!result || typeof result !== 'object') {
        console.error(
          'Invalid result from processAllWxData:',
          result
        );
        return NextResponse.json(
          {
            error:
              'Invalid result from processAllWxData: ' +
              // (result && typeof result === 'object' && result instanceof Error
              //   ? (result as Error).message
              //   : JSON.stringify(
              //       result,
              //       Object.getOwnPropertyNames(result)
              //     ))
              (isError(result)
                ? (result as Error).message
                : JSON.stringify(result, Object.getOwnPropertyNames(result))),
            details: result,
          },
          { status: 500 }
        );
      }

      observationsData = result.observationsData;

      if (!Array.isArray(observationsData)) {
        console.error(
          'observationsData is not an array:',
          observationsData
        );
        return NextResponse.json(
          {
            error:
              'observationsData is not an array: ' +
              (isError(observationsData)
                ? (observationsData as Error).message
                : JSON.stringify(
                    observationsData,
                    Object.getOwnPropertyNames(observationsData)
                  )),
            details: observationsData,
          },
          { status: 500 }
        );
      }

      if (observationsData.length === 0) {
        console.log(
          'No observations data returned for this time period'
        );
        return NextResponse.json(
          {
            error:
              'No observations data returned for this time period',
            details: null,
          },
          { status: 200 }
        );
      }

      const batchSize = 1000;
      let batch = [];

      for (const observation of observationsData) {
        totalAttempted++;
        try {
          const dateStrings = observation.date_time;
          if (!dateStrings || !Array.isArray(dateStrings)) {
            console.error('Invalid date_time array for station:', {
              stid: observation.stid,
              dateTimeValue: dateStrings
            });
            failedStations.push(observation.stid);
            continue;
          }

          console.log(`Processing station ${observation.stid}:`, {
            dataPoints: dateStrings.length,
            firstDate: dateStrings[0],
            lastDate: dateStrings[dateStrings.length - 1]
          });

          // Add station to tracking set
          updatedStations.add(observation.stid);

          // Log the full observation data
          console.log(
            'Full observation data:',
            JSON.stringify(observation, null, 2)
          );

          // Check each array property before processing
          const arrays = {
            date_time: observation.date_time,
            air_temp: observation.air_temp,
            wind_speed: observation.wind_speed,
            wind_gust: observation.wind_gust,
            // ... add other properties you're accessing
          };

          // Validate all arrays have same length
          const arrayLengths = Object.entries(arrays).map(
            ([key, arr]) => ({
              key,
              length: Array.isArray(arr) ? arr.length : null,
            })
          );

          console.log('Array lengths:', arrayLengths);

          // Verify observation object and required properties
          if (!observation) {
            console.error('Invalid observation:', observation);
            continue;
          }

          console.log('Processing observation:', {
            stid: observation.stid,
            dateStringsLength: dateStrings?.length,
            hasDateStrings: !!dateStrings,
          });

          for (let i = 0; i < dateStrings.length; i++) {
            const dateString = dateStrings[i];
            if (!dateString || dateString === '') {
              console.warn(
                `Skipping invalid date_time for station ${observation.stid}`
              );
              continue;
            }

            const observationData = {
              station_id: observation.stid,
              date_time: dateString,
              air_temp: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.air_temp, i)
                )
              ),
              wind_speed: validateWindSpeed(
                safeParseFloat(
                  safeGetArrayValue(observation.wind_speed, i)
                )
              ),
              wind_gust: validateWindGust(
                safeParseFloat(
                  safeGetArrayValue(observation.wind_gust, i)
                )
              ),
              wind_direction: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.wind_direction, i)
                )
              ),
              snow_depth: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.snow_depth, i)
                )
              ),
              snow_depth_24h: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.snow_depth_24h, i)
                )
              ),
              intermittent_snow: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.intermittent_snow, i)
                )
              ),
              precip_accum_one_hour: validateValue(
                safeParseFloat(
                  safeGetArrayValue(
                    observation.precip_accum_one_hour,
                    i
                  )
                )
              ),
              relative_humidity: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.relative_humidity, i)
                )
              ),
              battery_voltage: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.battery_voltage, i)
                )
              ),
              wind_speed_min: validateWindSpeed(
                safeParseFloat(
                  safeGetArrayValue(observation.wind_speed_min, i)
                )
              ),
              solar_radiation: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.solar_radiation, i)
                )
              ),
              equip_temperature: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.equip_temperature, i)
                )
              ),
              pressure: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.pressure, i)
                )
              ),
              wet_bulb: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.wet_bulb, i)
                )
              ),
              soil_temperature_a: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.soil_temperature_a, i)
                )
              ),
              soil_temperature_b: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.soil_temperature_b, i)
                )
              ),
              soil_moisture_a: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.soil_moisture_a, i)
                )
              ),
              soil_moisture_b: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.soil_moisture_b, i)
                )
              ),
              soil_temperature_c: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.soil_temperature_c, i)
                )
              ),
              soil_moisture_c: validateValue(
                safeParseFloat(
                  safeGetArrayValue(observation.soil_moisture_c, i)
                )
              ),
            };

            batch.push(observationData);

            if (batch.length >= batchSize) {
              await insertBatch(client, batch);
              batch = [];
            }
          }

          totalSuccessful++;
        } catch (error) {
          failedStations.push(observation.stid);
          console.error(`Failed to process station ${observation.stid}:`, error);
        }
      }

      // Insert any remaining observations
      if (batch.length > 0) {
        await insertBatch(client, batch);
      }

      // After all batches are processed
      const stationsList = Array.from(updatedStations).sort();
      const missingStations = Array.from(attemptedStations)
        .filter(stid => !updatedStations.has(stid));
      
      // Get station names
      const stationQuery = `
        SELECT stid, station_name 
        FROM stations 
        WHERE stid = ANY($1)
      `;
      const stationResult = await client.query(stationQuery, [stids]);
      const stationMap = stationResult.rows.reduce((acc, station) => ({
        ...acc,
        [station.stid]: station.station_name
      }), {} as Record<string, string>);

      // Check which stations have data in the database for the last hour
      const dbDataQuery = `
        SELECT DISTINCT s.stid 
        FROM stations s
        JOIN observations o ON s.id = o.station_id
        WHERE o.date_time >= $1 AND o.date_time <= $2
      `;
      const dbResult = await client.query(dbDataQuery, [
        start_time_pst.format('YYYY-MM-DD HH:mm:ssZ'),
        end_time_pst.format('YYYY-MM-DD HH:mm:ssZ')
      ]);
      const stationsWithDbData = new Set(dbResult.rows.map(row => row.stid));

      // Convert to arrays of station names with their status
      const stationStatus = stids.map(stid => ({
        name: stationMap[stid] || 'Unknown Station',
        hasApiData: updatedStations.has(stid),
        hasDbData: stationsWithDbData.has(stid)
      })).sort((a, b) => a.name.localeCompare(b.name));

      console.log('Station Status:', stationStatus);

      // Add summary logging
      console.log('=== Batch Upload Complete ===', {
        duration: `${(new Date().getTime() - startTime.getTime()) / 1000}s`,
        stationsAttempted: totalAttempted,
        stationsSuccessful: totalSuccessful,
        failedStations: failedStations,
      });

      return NextResponse.json({
        message: 'Hourly data update completed',
        stationStatus,
        summary: {
          stationsAttempted: totalAttempted,
          stationsSuccessful: totalSuccessful,
          failedStations: failedStations,
        }
      });
    } catch (error) {
      console.error(
        'Error fetching weather data:',
        error
      );
      return NextResponse.json(
        {
          error:
            'Error fetching weather data: ' +
            (error instanceof Error
              ? error.message
              : JSON.stringify(
                  error,
                  Object.getOwnPropertyNames(error)
                )),
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Hourly data update completed',
    });
  } catch (error) {
    console.error('Error updating yearly data:', error);
    return NextResponse.json(
      {
        error:
          'Error updating yearly data: ' +
          (error instanceof Error
            ? error.message
            : JSON.stringify(
                error,
                Object.getOwnPropertyNames(error)
              )),
        details: error,
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.release();
    }
  }
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
  context?: string
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Attempt ${i + 1}/${maxRetries} failed${context ? ` for ${context}` : ''}:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
    }
  }
  throw new Error('Operation failed after max retries');
}

function validateWindGust(value: number | null): number | null {
  if (value === null || value < 0 || value > 250) {
    return null;
  }
  return value;
}

function validateWindSpeed(value: number | null): number | null {
  if (value === null || value < 0 || value > 250) {
    return null;
  }
  return value;
}

async function insertBatch(client: VercelPoolClient, batch: any[]) {
  const columns = Object.keys(batch[0]).join(', ');
  const values = batch
    .map(
      (obs, index) =>
        `(${Object.values(obs)
          .map((v, i) => {
            if (i === 0) {
              // Assuming station_id is the first column
              return v === null
                ? 'NULL'
                : `(SELECT id FROM stations WHERE stid = '${v}')`;
            }
            if (i === 1) {
              // Assuming date_time is the second column
              if (v === null || v === '') {
                console.error(
                  `Invalid date_time at index ${index}:`,
                  obs
                );
                return 'NULL';
              }
              return `'${v}'::timestamp with time zone`;
            }
            // Clamp numeric values
            if (typeof v === 'number') {
              const clampedValue = clampNumericValue(v, 5, 2);
              return clampedValue === null
                ? 'NULL'
                : `'${clampedValue}'`;
            }
            return v === null || v === '' ? 'NULL' : `'${v}'`;
          })
          .join(', ')})`
    )
    .join(', ');

  const query = `
    INSERT INTO observations (${columns})
    VALUES ${values}
    ON CONFLICT (station_id, date_time) 
    DO UPDATE SET
      air_temp = EXCLUDED.air_temp,
      wind_speed = EXCLUDED.wind_speed,
      wind_gust = EXCLUDED.wind_gust,
      wind_direction = EXCLUDED.wind_direction,
      snow_depth = EXCLUDED.snow_depth,
      snow_depth_24h = EXCLUDED.snow_depth_24h,
      intermittent_snow = EXCLUDED.intermittent_snow,
      precip_accum_one_hour = EXCLUDED.precip_accum_one_hour,
      relative_humidity = EXCLUDED.relative_humidity,
      battery_voltage = EXCLUDED.battery_voltage,
      wind_speed_min = EXCLUDED.wind_speed_min,
      solar_radiation = EXCLUDED.solar_radiation,
      equip_temperature = EXCLUDED.equip_temperature,
      pressure = EXCLUDED.pressure,
      wet_bulb = EXCLUDED.wet_bulb,
      soil_temperature_a = EXCLUDED.soil_temperature_a,
      soil_temperature_b = EXCLUDED.soil_temperature_b,
      soil_moisture_a = EXCLUDED.soil_moisture_a,
      soil_moisture_b = EXCLUDED.soil_moisture_b,
      soil_temperature_c = EXCLUDED.soil_temperature_c,
      soil_moisture_c = EXCLUDED.soil_moisture_c
  `;

  try {
    const result = await client.query(query);
    console.log(`Inserted/Updated ${result.rowCount} observations`);
  } catch (error) {
    console.error('Error inserting batch:', error);
    console.error('Problematic batch:', JSON.stringify(batch));
    throw error;
  }
}

function validateValue(value: number | null): number | null {
  if (value === null || isNaN(value)) {
    return null;
  }
  return value;
}

function safeParseFloat(value: string | null): number | null {
  if (value === null || value === '') {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function safeGetArrayValue(
  arr: any[] | null | undefined,
  index: number
): any {
  if (!arr) {
    console.warn('Array is null or undefined in safeGetArrayValue');
    return null;
  }
  if (!Array.isArray(arr)) {
    console.warn('Value is not an array in safeGetArrayValue:', arr);
    return null;
  }
  if (index < 0 || index >= arr.length) {
    console.warn(
      `Index ${index} out of bounds for array of length ${arr.length}`
    );
    return null;
  }
  return arr[index];
  //return arr?.[index] ?? null;
}

function clampNumericValue(
  value: number | null,
  precision: number,
  scale: number
): number | null {
  if (value === null) return null;
  const maxValue =
    Math.pow(10, precision - scale) - Math.pow(10, -scale);
  return Math.max(Math.min(value, maxValue), -maxValue);
}

function isError(value: unknown): value is Error {
  return value instanceof Error;
}
