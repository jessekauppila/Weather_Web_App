import fetchHrWeatherData from './getHrWxWithID';
import { WeatherData } from './fetchNWACweather';
import moment from 'moment-timezone';
import { NextApiRequest, NextApiResponse } from 'next';

// Add this type definition if it doesn't exist already
type StationObject = {
  name: string;
  longitude: string;
  latitude: string;
  observations: Record<string, any[]>;
  id?: string;
  elevation?: number;
  // Add other properties that might exist on stationObject
};

function processStationData(
  stationObject: StationObject
): Record<string, any> {
  const newStationInfo: Record<string, any> = {
    'Station Name': '',
    Longitude: '',
    Latitude: '',
    stid: '',
    id: '',
    elevation: 0,
    // Add other keys you want to include
  };

  Object.keys(newStationInfo).forEach((key) => {
    if (key === 'Station Name') {
      newStationInfo[key] = stationObject.name;
    } else if (key === 'Longitude') {
      newStationInfo[key] = stationObject.longitude;
    } else if (key === 'Latitude') {
      newStationInfo[key] = stationObject.latitude;
    } else if (key === 'stid') {
      newStationInfo[key] = (stationObject as any).stid || '';
    } else if (key === 'id') {
      newStationInfo[key] = stationObject.id || '';
    } else if (key === 'elevation') {
      newStationInfo[key] = stationObject.elevation || 0;
    }
    // Add other cases as needed
  });

  return newStationInfo;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const start_time_pst = moment(req.query.start_time_pst);
    const end_time_pst = moment(req.query.end_time_pst);
    const stids = req.query.stids as string[];
    const auth = req.query.auth as string;

    const data = (await fetchHrWeatherData(
      start_time_pst,
      end_time_pst,
      stids,
      auth
    )) as Record<string, WeatherData>; // Type assertion here

    if (!data) {
      throw new Error('No data returned from fetchHrWeatherData');
    }

    const processedData = Object.values(data).map(
      (stationObject: StationObject) => {
        return processStationData(stationObject);
      }
    );

    res.status(200).json(processedData);
  } catch (error) {
    console.error('Error processing weather data:', error);
    res.status(500).json({ error: 'Error processing weather data' });
  }
}
