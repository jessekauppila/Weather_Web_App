export interface WeatherData {
  UNITS: Record<string, string>;
  VARIABLES: Array<Record<string, any>>;
  STATION?: Array<{
    name: string;
    longitude: string;
    latitude: string;
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
    let t1 = start_time_pdt
      .tz('America/Los_Angeles')
      .format('YYYYMMDDHHmm');
    let t2 = end_time_pdt
      .tz('America/Los_Angeles')
      .format('YYYYMMDDHHmm');

    console.log(`Fetching data for site ${site}`);
    console.log(`Start time (t1): ${t1}`);
    console.log(`End time (t2): ${t2}`);
    console.log(
      `Start time (PDT): ${start_time_pdt.format(
        'YYYY-MM-DD HH:mm:ss'
      )}`
    );
    console.log(
      `End time (PDT): ${end_time_pdt.format('YYYY-MM-DD HH:mm:ss')}`
    );
    console.log(
      `Start time (UTC): ${start_time_pdt
        .utc()
        .format('YYYY-MM-DD HH:mm:ss')}`
    );
    console.log(
      `End time (UTC): ${end_time_pdt
        .utc()
        .format('YYYY-MM-DD HH:mm:ss')}`
    );

    let url =
      `https://api.snowobs.com/wx/v1/station/data/timeseries/?stid=${site}` +
      `&source=nwac&start_date=${t1}&end_date=${t2}` +
      `&units=metric&output=mesowest&calc_diff=false&raw_data=true&token=${auth}` +
      `&tz=America/Los_Angeles`; // Add this parameter

    console.log('API URL:', url);

    let response = await axios.get(url);
    let wx_data: WeatherData = response.data;

    if (!wx_data.hasOwnProperty('STATION')) {
      console.log(
        `Error: 'STATION' key not found in the response for ${site}.`
      );
      return;
    }

    // // Add the 'stid' number to the 'UNITS' object
    // wx_data['UNITS']['stid'] = site;

    // // Add a new object with the 'stid' number to the 'VARIABLES' array
    // wx_data['VARIABLES'].push({ stid: site });

    output_data[site] = wx_data; // or whatever you've created
  });

  await Promise.all(requests);

  // Check if output_data is empty
  if (Object.keys(output_data).length === 0) {
    console.log('No data fetched for any of the sites.');
    return null;
  }

  return output_data;
};

export default getNWACobservations;

//export default getNWACobservations;

// stids = [
//     '1',
//     '10',
//     '11',
//     '12',
//     '13',
//     '14',
//     '17',
//     '18',
//     '19',
//     '2',
//     '20',
//     '21',
//     '22',
//     '23',
//     '24',
//     '25',
//     '26',
//     '27',
//     '28',
//     '29',
//     '3',
//     '30',
//     '31',
//     '32',
//     '33',
//     '34',
//     '35',
//     '36',
//     '37',
//     '39',
//     '4',
//     '40',
//     '41',
//     '42',
//     '43',
//     '44',
//     '45',
//     '46',
//     '47',
//     '48',
//     '49',
//     '5',
//     '50',
//     '51',
//     '53',
//     '54',
//     '56',
//     '57',
//     '6',
//     '7',
//     '8',
//     '9',
//   ];

//   names = [
//     'Alpental Base',
//     'Dirtyface Summit',
//     'Lake Wenatchee',
//     'Berne',
//     'Stevens Pass - Schmidt Haus',
//     'Stevens Pass - Grace Lakes',
//     'Stevens Pass - Skyline',
//     'Stevens Pass - Tye Mill',
//     'Tumwater Mountain',
//     'Alpental Mid-Mountain',
//     'Mt. Washington',
//     'Snoqualmie Pass',
//     'Snoqualmie Pass - Dodge Ridge',
//     'Snoqualmie Pass - East Shed',
//     'Mission Ridge Base',
//     'Mission Ridge Summit',
//     'Mission Ridge Mid-Mountain',
//     'Crystal - Green Valley',
//     'Crystal Base',
//     'Crystal Summit',
//     'Alpental Summit',
//     'Sunrise Upper',
//     'Sunrise Base',
//     'Chinook Pass Summit',
//     'Chinook Pass Base',
//     'Camp Muir',
//     'Paradise',
//     'Paradise Wind',
//     'White Pass Base',
//     'White Pass Upper',
//     'Hurricane Ridge',
//     'Mt. St. Helens - Coldwater',
//     'Mt. Hood Meadows - Cascade Express',
//     'Mt. Hood Meadows - Blue',
//     'Mt. Hood Meadows Base',
//     'Timberline Lodge',
//     'Timberline - Magic Mile',
//     'Skibowl Base',
//     'Skibowl Summit',
//     'Blewett Pass',
//     'White Pass - Pigtail Peak',
//     'Mt. Baker - Heather Meadows',
//     'Stevens Pass - Brooks Precipitation',
//     'Stevens Pass - Old Faithful',
//     'Leavenworth',
//     'Crystal - Campbell Basin',
//     'Timberline - Pucci',
//     'White Chuck Mountain',
//     'Mt. Baker - Pan Dome',
//     'Mazama',
//     'Washington Pass Base',
//     'Washington Pass Upper',
//   ];
