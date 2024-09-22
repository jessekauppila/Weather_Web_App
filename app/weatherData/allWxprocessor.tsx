import fetchHrWeatherData from './getHrWxWithID';
import { WeatherData } from './fetchNWACweather'; // Import the WeatherData type

// Add types for the parameters
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
    const data: Record<string, WeatherData> | undefined =
      await fetchHrWeatherData(
        start_time_pst,
        end_time_pst,
        stids,
        auth
      );

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
      'battery_voltage',
      // Add all other keys you want in the specific order
    ];

    // Use a Set to collect all available keys from the data
    let availableKeys = new Set<string>([
      'Station Name',
      'Longitude',
      'Latitude',
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
        for (const stationObject of stationObjects) {
          const observations = stationObject.observations;
          for (const observationKey in observations) {
            if (observations.hasOwnProperty(observationKey)) {
              availableKeys.add(observationKey);
            }
          }
        }
      }
    }

    // Create the final sorted keys array
    const sortedKeys = orderedKeys.filter((key) =>
      availableKeys.has(key)
    );

    // Add any remaining keys from availableKeys that are not in orderedKeys
    Array.from(availableKeys).forEach((key) => {
      if (!sortedKeys.includes(key)) {
        sortedKeys.push(key);
      }
    });

    // Phase 2: Process data for each station
    const observationsData: any[] = [];

    for (const stationKey in data) {
      if (data.hasOwnProperty(stationKey)) {
        const stationData = data[stationKey];
        const stationObjects = stationData.STATION;

        // Add a check for stationObjects
        if (stationObjects) {
          for (const stationObject of stationObjects) {
            const observations = stationObject.observations;
            const newStationInfo: {
              [key: string]: string | (string | number)[];
            } = {};

            for (const key of sortedKeys) {
              if (key === 'Station Name') {
                newStationInfo[key] = stationObject.name;
              } else if (key === 'Longitude') {
                newStationInfo[key] = stationObject.longitude;
              } else if (key === 'Latitude') {
                newStationInfo[key] = stationObject.latitude;
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
    }

    if (Array.isArray(observationsData)) {
      console.log('observationsData is an Array');
    } else if (
      typeof observationsData === 'object' &&
      observationsData !== null
    ) {
      console.log('observationsData is an Object');
    } else {
      console.log(
        'observationsData is of type:',
        typeof observationsData
      );
    }

    // Check if unitConversions is an array or an object
    if (Array.isArray(unitConversions)) {
      console.log('unitConversions is an Array');
    } else if (
      typeof unitConversions === 'object' &&
      unitConversions !== null
    ) {
      console.log('unitConversions is an Object');
    } else {
      console.log(
        'unitConversions is of type:',
        typeof unitConversions
      );
    }

    console.log('unitConversions:', unitConversions);
    console.log('observationsData:', observationsData);
    return { observationsData, unitConversions };
  } catch (error) {
    console.error('Error in processAllWxData:', error);
    throw error;
  }
}

export default processAllWxData;
