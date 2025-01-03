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

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const getNWACobservations = async (
  start_time_pdt: moment.Moment,
  end_time_pdt: moment.Moment,
  sites: string[],
  auth: string
): Promise<Record<string, WeatherData> | null> => {
  let output_data: Record<string, WeatherData> = {};
  
  const requests = sites.map(async (site) => {
    let retryCount = 0;
    let success = false;

    while (retryCount < MAX_RETRIES && !success) {
      try {
        let t1 = start_time_pdt.utc().format('YYYYMMDDHHmm');
        let t2 = end_time_pdt.utc().format('YYYYMMDDHHmm');

        let url = `https://api.snowobs.com/wx/v1/station/data/timeseries/?stid=${site}` +
          `&source=nwac&start_date=${t1}&end_date=${t2}` +
          `&units=metric&output=mesowest&calc_diff=false&raw_data=true&token=${auth}` +
          `&tz=UTC&timestamp=${Date.now()}&refresh=true`; // Added refresh parameter

        const fetchOptions = {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        };

        let response = await axios.get(url, fetchOptions);
        let wx_data: WeatherData = response.data;

        if (!wx_data.hasOwnProperty('STATION')) {
          throw new Error(`'STATION' key not found in the response for ${site}`);
        }

        // Check if data is fresh (you might need to adjust this logic)
        if (wx_data.STATION && wx_data.STATION.length > 0) {
          success = true;
          wx_data.STATION = wx_data.STATION?.map((station) => ({
            ...station,
            stid: site,
          }));
          output_data[site] = wx_data;
        } else {
          throw new Error('No fresh data available');
        }
      } catch (error) {
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          console.log(`Retry ${retryCount} for station ${site}`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        } else {
          console.error(`Failed to fetch data for station ${site} after ${MAX_RETRIES} attempts`);
        }
      }
    }
  });

  await Promise.all(requests);

  if (Object.keys(output_data).length === 0) {
    console.log('No data fetched for any of the sites.');
    return null;
  }

  return output_data;
};

export default getNWACobservations;
