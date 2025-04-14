import { formatValueWithUnit } from "@/app/utils/formatValueWithUnit";
import { degreeToCompass } from "@/app/utils/angleInDegreeToCompass";
import { UnitType } from "@/app/utils/units";


interface Observation {
    station_name: string;
    elevation: number;
    date_time: string;
    air_temp: number | null;
    wind_speed: number | null;
    wind_gust: number | null;
    wind_direction: string | null;
    snow_depth: number | null;
    snow_depth_24h: number | null;
    precip_accum_one_hour: number | null;
    precipitation: number | null;
    relative_humidity: number | null;
  }
  
  interface FormattedObservation {
    Station: string;
    Elevation: string;
    Day: string;
    Hour: string;
    'Air Temp': string;
    'Wind Speed': string;
    'Wind Gust': string;
    'Wind Direction': string;
    'Total Snow Depth': string;
    '24h Snow Depth': string;
    'Precip Accum': string;
    'Precipitation': string;
    'Relative Humidity': string;
    "Solar Radiation": string;
    "API Fetch Time": string;
  }
  
  export default function hourWxTableDataFiltered(data: any[], isMetric: boolean, units?: any) {

    console.log('data in hourWxTableDataFiltered:', data);
    // Flatten the nested structure into a single array
    const flattenedData: FormattedObservation[] = Object.values(data)
      .flat()
      .map(obs => {
        const date = new Date(obs.date_time);
        
        return {
          Station: obs.station_name,
          Elevation: formatValueWithUnit(obs.elevation, UnitType.ELEVATION, isMetric),          
          Day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          Hour: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          "Air Temp": formatValueWithUnit(obs.air_temp, UnitType.TEMPERATURE, isMetric),
          "Wind Speed": formatValueWithUnit(obs.wind_speed, UnitType.WIND_SPEED, isMetric),
          "Wind Gust": formatValueWithUnit(obs.wind_gust, UnitType.WIND_SPEED, isMetric),
          "Wind Direction": obs.wind_direction ? degreeToCompass(Number(obs.wind_direction)) : '-',
          "Total Snow Depth": formatValueWithUnit(obs.snow_depth, UnitType.PRECIPITATION, isMetric),
          "24h Snow Depth": formatValueWithUnit(obs.snow_depth_24h, UnitType.PRECIPITATION, isMetric),
          "Precip Accum": formatValueWithUnit(obs.precip_accum_one_hour, UnitType.PRECIPITATION, isMetric),
          "Precipitation": formatValueWithUnit(obs.precipitation, UnitType.PRECIPITATION, isMetric),
          "Relative Humidity": formatValueWithUnit(obs.relative_humidity, UnitType.HUMIDITY, isMetric),
          "Solar Radiation": formatValueWithUnit(obs.solar_radiation, UnitType.SOLAR, isMetric),
          "API Fetch Time": formatValueWithUnit(obs.api_fetch_time, UnitType.TIMESTAMP, isMetric)
        };
      })
      .sort((a, b) => {
        // Sort by date/time first, then by station name
        const dateA = new Date(`${a.Day} ${a.Hour}`);
        const dateB = new Date(`${b.Day} ${b.Hour}`);
        const dateCompare = dateA.getTime() - dateB.getTime();
        return dateCompare || a.Station.localeCompare(b.Station);
      });
  
      //console.log('flattenedData in hourWxTableDataFiltered:', flattenedData);
    return {
      data: flattenedData,
      title: 'Filtered Hourly Observations'
    };
  }