import fetchHrWeatherData from './getHrWxWithID';
import { WeatherData } from './fetchNWACweather';
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

// type ObservationData = {
//   name: string;
//   longitude: string;
//   latitude: string;
//   observations: Record<string, any[]>;
//   stid?: string; // Add this line
//   id?: string; // Add this line if not already present
//   elevation?: number; // Add this line if not already present
//   // Add any other properties that might be present in your data
// };
let observationsData: any[] = [];

async function processAllWxData(
  start_time_pst: moment.Moment,
  end_time_pst: moment.Moment,
  stids: string[],
  auth: string
): Promise<{
  observationsData: any[];
  unitConversions: Record<string, string>;
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

    // Use a Set to collect all available keys from the data
    let availableKeys = new Set<string>([
      'Station Name',
      'Longitude',
      'Latitude',
      'id',
      'stid',
      'elevation',
      'time_zone',
      'source',
      'station_note',
      'station',
    ]);

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

          for (const key of orderedKeys) {
            if (key === 'Station Name') {
              newStationInfo[key] = stationObject.name;
            } else if (key === 'Longitude') {
              newStationInfo[key] = stationObject.longitude;
            } else if (key === 'Latitude') {
              newStationInfo[key] = stationObject.latitude;
            } else if (key === 'stid') {
              newStationInfo[key] = stationObject.stid ?? '';
            } else if (key === 'id') {
              newStationInfo[key] = stationObject.id ?? '';
            } else if (key === 'elevation') {
              newStationInfo[key] = stationObject.elevation ?? 0;
            } else if (key === 'time_zone') {
              newStationInfo[key] = stationObject.time_zone ?? '';
            } else if (key === 'source') {
              newStationInfo[key] = stationObject.source ?? '';
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

    console.log(
      'observationData:',
      JSON.stringify(observationsData, null, 2)
    );
    console.log('unitConversions:', unitConversions);
    return { observationsData, unitConversions };
  } catch (error) {
    console.error('Error in processAllWxData:', error);
    throw error;
  }
}

// function processStationData(stationObject: ObservationData): Record<string, any> {
//   const newStationInfo: Record<string, any> = {
//     'Station Name': '',
//     'Longitude': '',
//     'Latitude': '',
//     'stid': '',
//     'id': '',
//     'elevation': 0,
//     // Add other keys you want to include
//   };

//   Object.keys(newStationInfo).forEach((key) => {
//     if (key === 'Station Name') {
//       newStationInfo[key] = stationObject.name;
//     } else if (key === 'Longitude') {
//       newStationInfo[key] = stationObject.longitude;
//     } else if (key === 'Latitude') {
//       newStationInfo[key] = stationObject.latitude;
//     } else if (key === 'stid') {
//       newStationInfo[key] = stationObject.stid || '';
//     } else if (key === 'id') {
//       newStationInfo[key] = stationObject.id || '';
//     } else if (key === 'elevation') {
//       newStationInfo[key] = stationObject.elevation || 0;
//     }
//     // Add other cases as needed
//   });

//   return newStationInfo;
// }

export default processAllWxData;
