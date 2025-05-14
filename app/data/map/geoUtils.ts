import type { Feature, Geometry } from 'geojson';
import type { WeatherStation } from '../../map/map';
import type { Map_BlockProperties } from '../../map/map';

/**
 * Converts weather station data to GeoJSON format for map rendering
 */
export function map_weatherToGeoJSON(weatherData: WeatherStation[]): {
  type: 'FeatureCollection';
  features: Feature<Geometry, Map_BlockProperties>[];
} {
  const parseValue = (value: string) => {
    if (!value || value === '-') return null;
    const num = parseFloat(value.split(' ')[0]);
    return isNaN(num) ? null : num;
  };

  // Function to create a circular polygon
  const createCircle = (
    longitude: number,
    latitude: number,
    radius: number,
    numPoints: number = 32
  ) => {
    const coordinates = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI; // Distribute points evenly
      const dx = radius * Math.cos(angle);
      const dy = radius * Math.sin(angle);
      coordinates.push([longitude + dx, latitude + dy]);
    }
    coordinates.push(coordinates[0]); // Close the polygon
    return [coordinates]; // GeoJSON expects an array of rings
  };

  return {
    type: 'FeatureCollection' as const,
    features: weatherData.map((station) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: createCircle(
          parseFloat(station['Longitude']),
          parseFloat(station['Latitude']),
          0.03, // Adjust radius as needed
          32 // Adjust number of points as needed
        ),
      },
      properties: {
        stationName: station['Station'],
        latitude: parseFloat(station['Latitude']),
        longitude: parseFloat(station['Longitude']),
        totalSnowDepth: parseValue(station['Total Snow Depth']),
        totalSnowDepthChange: parseValue(
          station['Total Snow Depth Change']
        ),
        snowAccumulation24h: parseValue(
          station['24h Snow Accumulation']
        ),
        curAirTemp: parseValue(station['Cur Air Temp']),
        airTempMin: parseValue(station['Air Temp Min']),
        airTempMax: parseValue(station['Air Temp Max']),
        curWindSpeed: station['Cur Wind Speed'],
        maxWindGust: station['Max Wind Gust'],
        windDirection: station['Wind Direction'],
        windSpeedAvg: station['Wind Speed Avg'],
        elevation: parseValue(station['Elevation']),
        relativeHumidity: parseValue(station['Relative Humidity']),
        precipAccumOneHour: station['Precip Accum One Hour'] === '-' ? null : station['Precip Accum One Hour'],
        fetchTime: station['Api Fetch Time'],
        Stid: station['Stid'],
      },
    })),
  };
} 