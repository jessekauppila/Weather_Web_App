// maybe can delete!

import { fi } from 'date-fns/locale';
import fetchHrWeatherData from '../app/api/getHrWxWithID';

async function processDayWxData(
  start_time_pst: any,
  end_time_pst: any,
  stids: string[],
  auth: any
): Promise<any> {
  try {
    const data = await fetchHrWeatherData(
      start_time_pst,
      end_time_pst,
      stids,
      auth
    );

    //console.log(`All data:`, data);

    // Phase 1: Collect all observation keys and units
    let allObservationKeysUnedited: Set<string> = new Set();
    let allUnits: { [key: string]: string } = {};

    // Phase 1: Collect all observation keys and units

    for (const stationKey in data) {
      if (data.hasOwnProperty(stationKey)) {
        const stationData = data[stationKey];
        const stationUnits = stationData.UNITS;
        const stationObjects = stationData.STATION;

        // Collect units
        for (const unitKey in stationUnits) {
          if (stationUnits.hasOwnProperty(unitKey)) {
            allUnits[unitKey] = stationUnits[unitKey];
          }
        }

        // Collect observation keys
        for (const stationObject of stationObjects) {
          const observations = stationObject.observations;
          for (const observationKey in observations) {
            if (observations.hasOwnProperty(observationKey)) {
              allObservationKeysUnedited.add(observationKey);
            }
          }
        }
      }
    }

    // Phase 2: Process data for each station
    const tableDataDay: any[] = [];

    for (const stationKey in data) {
      if (data.hasOwnProperty(stationKey)) {
        const stationData = data[stationKey];
        const stationObjects = stationData.STATION;

        for (const stationObject of stationObjects) {
          const observations = stationObject.observations;
          const stationName = stationObject.name;
          const longitude = stationObject.longitude;
          const latitude = stationObject.latitude;
          const averages: { [key: string]: string } = {
            'Station Name': stationName,
            Longitude: longitude,
            Latitude: latitude,
          };

          // Process each observation
          for (const observationKey of Array.from(
            allObservationKeysUnedited
          )) {
            const observationValues =
              observations[observationKey] || [];

            if (observationValues.length === 0) {
              averages[observationKey] = '';
            } else if (
              [
                'snow_depth_24h',
                'snow_depth',
                'precip_accum_one_hour',
              ].includes(observationKey)
            ) {
              const sum = observationValues.reduce(
                (a, b) => a + b,
                0
              );
              averages[observationKey] = (
                sum / observationValues.length
              ).toFixed(1);
            } else if (observationKey === 'date_time') {
              const date = new Date(start_time_pst);
              averages[observationKey] = date.toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric', year: 'numeric' }
              );
            } else {
              averages[observationKey] =
                observationValues[
                  observationValues.length - 1
                ].toFixed(1);
            }
          }

          tableDataDay.push(averages);
        }
      }
    }

    // Process tableDataDay to transform keys
    const processedTableDataDay = tableDataDay.map((entry) => {
      const processedEntry: { [key: string]: any } = {};
      Object.entries(entry).forEach(([key, value]) => {
        const unit = allUnits[key] || '';
        const modifiedKey =
          key === 'Station Name'
            ? 'Station'
            : `${key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase())} (${unit})`;
        processedEntry[modifiedKey] = value;
      });
      return processedEntry;
    });

    console.log('Table Data:', tableDataDay);
    console.log('Processed Table Data:', processedTableDataDay);

    return { tableDataDay: processedTableDataDay };
    //return tableDataDay; // Return the array of averages objects
  } catch (error) {
    console.error('Error:', error);
    throw error; // or handle the error in another way
  }
}

export default processDayWxData;
