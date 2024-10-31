export interface WeatherData {
  UNITS: Record<string, string>;
  VARIABLES: Array<Record<string, any>>;
  STATION?: Array<{
    name: string;
    longitude: string;
    latitude: string;
    stid: string; // Add this line
    observations: Record<string, any[]>;
  }>;
}

import moment from 'moment-timezone';
import axios from 'axios';

const getNWACobservations = async (
  start_time_pdt: moment.Moment,
  end_time_pdt: moment.Moment,
  sites: string[],
  auth: string
): Promise<Record<string, WeatherData> | null> => {
  let output_data: Record<string, WeatherData> = {};
  const requests = sites.map(async (site) => {
    let t1 = start_time_pdt.utc().format('YYYYMMDDHHmm');
    let t2 = end_time_pdt.utc().format('YYYYMMDDHHmm');

    let url =
      `https://api.snowobs.com/wx/v1/station/data/timeseries/?stid=${site}` +
      `&source=nwac&start_date=${t1}&end_date=${t2}` +
      `&units=metric&output=mesowest&calc_diff=false&raw_data=true&token=${auth}` +
      `&tz=UTC`; // Change this to UTC

    //console.log('API URL:', url);

    let response = await axios.get(url);
    let wx_data: WeatherData = response.data;

    if (!wx_data.hasOwnProperty('STATION')) {
      console.log(
        `Error: 'STATION' key not found in the response for ${site}.`
      );
      return;
    }

    // Ensure the stid is added to each station in the STATION array
    wx_data.STATION = wx_data.STATION?.map((station) => ({
      ...station,
      stid: site,
    }));

    output_data[site] = wx_data;

    console.log(
      'Raw precipitation data for station:',
      site,
      response.data.STATION?.[0]?.observations?.precip_accum_one_hour
    );
  });

  await Promise.all(requests);

  // Check if output_data is empty
  if (Object.keys(output_data).length === 0) {
    console.log('No data fetched for any of the sites.');
    return null;
  }

  //console.log('output_data:', output_data);
  return output_data;
};

export default getNWACobservations;
