//one of the main functions used to process hourly weather data

import fetchHrWeatherData from './getHrWxWithID';
//import { WeatherData } from './fetchNWACweather';
import moment from 'moment-timezone';

interface StationObject {
  name: string;
  longitude: string;
  latitude: string;
  observations: Record<string, any[]>;
  stid?: string;
  id?: string;
  elevation?: number;
  time_zone?: string;
  source?: string;
  // Add any other properties that might be present in your station object
}

type observationData = {
  name: string;
  longitude: string;
  latitude: string;
  observations: Record<string, any[]>;
  stid?: string; // Add this line
  id?: string; // Add this line if not already present
  elevation?: number; // Add this line if not already present
  // Add any other properties that might be present in your data
};
let observationsData: any[] = [];

// Add this helper function
// const validatePrecipitation = (
//   value: number | null
// ): number | null => {
//   if (value === null) return null;
//   // Ensure precipitation is not negative
//   if (value < 0) return 0;
//   // Round to 2 decimal places
//   return Math.round(value * 100) / 100;
// };

async function processAllWxData(
  start_time_pst: moment.Moment,
  end_time_pst: moment.Moment,
  stids: string[],
  auth: string
): Promise<{
  observationsData: any[];
  unitConversions: Record<string, string>;
  
  //added this to get all the keys from the data
  allKeys: string[];
}> {
  try {
    const data = (await fetchHrWeatherData(
      start_time_pst,
      end_time_pst,
      stids,
      auth
    )) as Record<
      string,
      { STATION: StationObject[]; UNITS: Record<string, string> }
    >;

    if (!data) {
      throw new Error('No data returned from fetchHrWeatherData');
    }

    // Define the desired order of keys
    const orderedKeys = [
      'date_time',
      'Station Name',
      'Longitude',
      'Latitude',
      'air_temp',
      'wind_speed',
      'wind_gust',
      'wind_direction',
      'precipitation',
      'snow_depth',
      'snow_depth_24h',
      'intermittent_snow',
      'precip_accum_one_hour',
      'relative_humidity',
      // Add all other keys you want in the specific order
    ];

    // // Use a Set to collect all available keys from the data
    // let availableKeys = new Set<string>([
    //   'Station Name',
    //   'Longitude',
    //   'Latitude',
    //   'id',
    //   'stid',
    //   'elevation',
    //   'time_zone',
    //   'source',
    //   'station_note',
    //   'station',
    // ]);

    let unitConversions: { [key: string]: string } = {};

    // Collect available keys
    for (const stationKey in data) {
      const stationData = data[stationKey];
      const stationObjects = stationData.STATION;
      const stationUnits = stationData.UNITS;

      // Collect units
      for (const unitKey in stationUnits) {
        if (stationUnits.hasOwnProperty(unitKey)) {
          unitConversions[unitKey] = stationUnits[unitKey];
        }
      }

      // Add a check for stationObjects
      if (stationObjects) {
        for (const stationObject of stationObjects as StationObject[]) {
          const observations = stationObject.observations;
          const newStationInfo: {
            [key: string]: string | (string | number)[] | any;
          } = {};

          // Ensure stid is included in newStationInfo
          newStationInfo['stid'] = stationObject.stid || stationKey;

          for (const key of orderedKeys) {
            if (key === 'Station Name') {
              newStationInfo[key] = stationObject.name;
            } else if (key === 'Longitude') {
              newStationInfo[key] = stationObject.longitude;
            } else if (key === 'Latitude') {
              newStationInfo[key] = stationObject.latitude;
            } else if (key === 'stid') {
              // This is now redundant, but we'll keep it for consistency
              newStationInfo[key] = stationObject.stid || stationKey;
            } else if (key === 'id') {
              newStationInfo[key] = stationObject.id ?? '';
            } else if (key === 'elevation') {
              newStationInfo[key] = stationObject.elevation ?? 0;
            } else if (key === 'time_zone') {
              newStationInfo[key] = stationObject.time_zone ?? '';
            } else if (key === 'source') {
              newStationInfo[key] = stationObject.source ?? '';
            } else if (key === 'precipitation') {
              const precipValues = observations[key] || [];
              console.log('Raw precipitation values:', precipValues);
              newStationInfo[key] = precipValues.map(value => {
                const parsed = parseFloat(value);
                return !isNaN(parsed) && parsed >= 0 ? parsed : null;
              });
              console.log('Processed precipitation values:', newStationInfo[key]);
            } else {
              const observationValues = observations[key] || [];
              newStationInfo[key] =
                observationValues.length === 0
                  ? ['']
                  : observationValues;
            }
          }

          observationsData.push(newStationInfo);
        }
      }
    }
    // console.log('observationData:', observationsData);
    // console.log(
    //   'observationData stringify:',
    //   JSON.stringify(observationsData, null, 2)
    // );
    //console.log('unitConversions:', unitConversions);

    const logAllKeys = (data: any) => {
      const allKeys = new Set<string>();
      for (const stationKey in data) {
        const stationData = data[stationKey];
        if (stationData.STATION) {
          stationData.STATION.forEach((station: StationObject) => {
            Object.keys(station.observations).forEach((key) => {
              allKeys.add(key);
            });
          });
        }
      }
      console.log('All available observation keys:', Array.from(allKeys));
      return allKeys;
    };

    const allKeys = logAllKeys(data);
    //return { observationsData, unitConversions };
    return { observationsData, unitConversions, allKeys: Array.from(allKeys) };
  } catch (error) {
    console.error('Error in processAllWxData:', error);
    throw error;
  }
}

export default processAllWxData;
