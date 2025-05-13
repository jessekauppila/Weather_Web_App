import type { WeatherStation } from '../../map/map';
import type { Map_BlockProperties } from '../../map/map';

export function formatValue(value: number | string | null | undefined, unit: string): string {
  if (value === null || value === undefined || value === '-') return '-';
  return `${value} ${unit}`;
}

export function createWeatherStationFromProperties(properties: Map_BlockProperties): WeatherStation {
  return {
    Station: properties.stationName,
    'Cur Air Temp': formatValue(properties.curAirTemp, '°F'),
    '24h Snow Accumulation': formatValue(properties.snowAccumulation24h, 'in'),
    'Cur Wind Speed': properties.curWindSpeed || '-',
    'Elevation': formatValue(properties.elevation, 'ft'),
    'Stid': properties.Stid,
    'Air Temp Min': formatValue(properties.airTempMin, '°F'),
    'Air Temp Max': formatValue(properties.airTempMax, '°F'),
    'Wind Speed Avg': properties.windSpeedAvg || '-',
    'Max Wind Gust': properties.maxWindGust || '-',
    'Wind Direction': properties.windDirection || '-',
    'Total Snow Depth Change': formatValue(properties.totalSnowDepthChange, 'in'),
    'Precip Accum One Hour': properties.precipAccumOneHour || '-',
    'Total Snow Depth': formatValue(properties.totalSnowDepth, 'in'),
    'Latitude': properties.latitude.toString(),
    'Longitude': properties.longitude.toString(),
    'Relative Humidity': formatValue(properties.relativeHumidity, '%'),
    'Api Fetch Time': properties.fetchTime || new Date().toISOString()
  };
}