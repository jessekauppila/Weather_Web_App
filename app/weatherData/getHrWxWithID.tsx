import getNWACobservations from './fetchNWACweather';

async function fetchHrWeatherData(
  start_time_pst: any,
  end_time_pst: any,
  stids: any,
  auth: any
): Promise<any> {
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
    console.log('Data:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch NWAC stations:', error);
  }
}

// fetchAndDisplayWeatherData(
//   start_time_pst,
//   end_time_pst,
//   stids,
//   auth
// ).then((data) => {
//   console.log(data);
// });

export default fetchHrWeatherData;
