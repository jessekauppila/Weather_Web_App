//maybe can delete

import fetchHrWeatherData from '../weatherData/getHrWxWithID';

async function processHrWxData(
  start_time_pst: any,
  end_time_pst: any,
  stids: any,
  auth: any
): Promise<any> {
  try {
    const data = await fetchHrWeatherData(
      start_time_pst,
      end_time_pst,
      stids,
      auth
    );

    let newTableDataHr: { [key: string]: any }[] = [];

    for (const stationKey in data) {
      if (data.hasOwnProperty(stationKey)) {
        const stationData = data[stationKey];
        const stationObjects = stationData.STATION;

        for (const stationObject of stationObjects) {
          const observations = stationObject.observations;

          for (const observationKey in observations) {
            if (observations.hasOwnProperty(observationKey)) {
              const observationValues = observations[observationKey];
              for (let i = 0; i < observationValues.length; i++) {
                if (!newTableDataHr[i]) {
                  newTableDataHr[i] = {};
                }
                newTableDataHr[i][observationKey] =
                  observationValues[i];
              }
            }
          }
        }
        return newTableDataHr;
      }
    }
  } catch (error) {
    console.error('Error:', error);
    throw error; // or handle the error in another way
  }
}

export default processHrWxData;
