import getNWACobservations, { WeatherData } from './fetchNWACweather';

import moment from 'moment-timezone';

// Add types for the parameters
async function fetchHrWeatherData(
  start_time_pst: moment.Moment,
  end_time_pst: moment.Moment,
  stids: string[],
  auth: string
): Promise<Record<string, WeatherData> | undefined | null> {
  try {
    const data = await getNWACobservations(
      start_time_pst,
      end_time_pst,
      stids,
      auth
    );

    for (const stationKey in data) {
      if (data.hasOwnProperty(stationKey)) {
        const stationData = data[stationKey];
      }
    }
    //console.log('Full Data:', JSON.stringify(data, null, 2));

    //console.log('Data:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch NWAC stations:', error);
    return undefined;
  }
}

export default fetchHrWeatherData;
