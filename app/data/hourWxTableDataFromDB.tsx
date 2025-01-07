import moment from "moment-timezone";
import { formatValueWithUnit } from "@/app/utils/formatValueWithUnit";
import { degreeToCompass } from "@/app/utils/angleInDegreeToCompass";
import { UnitType } from "@/app/utils/units";

function hourWxTableDataFromDB(
  observationsData: Array<Record<string, any>>,
  units: Array<Record<string, string>>,
  isMetric: boolean
): {
  data: Array<{ [key: string]: number | string }>;
  title: string;
} {
  // Add safety check
  if (!observationsData || observationsData.length === 0) {
    return {
      data: [],
      title: "No data available",
    };
  }

  console.log("TABLE DATA FROM DB:", observationsData);

  // Instead of grouping and averaging, process each observation individually
  const formattedData = observationsData.map((obs) => {
    return {
      Station: obs.station_name,
      Elevation: formatValueWithUnit(obs.elevation, UnitType.ELEVATION, isMetric),
      Day: moment(obs.date_time).format("MMM D"),
      Hour: moment(obs.date_time).format("h:mm A"),
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
  });

  // error_filtered_total_snow = EXCLUDED.error_filtered_total_snow,
  // error_filtered_24hr_snow_accum = EXCLUDED.error_filtered_24hr_snow_accum

  // Get the dates and format them
  const startMoment = moment(observationsData[0].date_time);
  const endMoment = moment(
    observationsData[observationsData.length - 1].date_time
  );
  const startDate = startMoment.format("MMM D");
  const endDate = endMoment.format("MMM D");
  const startTime = startMoment.format("h:mm A");
  const endTime = endMoment.format("h:mm A");
  const stationName = observationsData[0]?.station_name || "";

  // Create title based on whether dates are the same
  const timeRange =
    startDate === endDate
      ? `${startDate}, ${startTime} - ${endTime}`
      : `${startDate}, ${startTime} - ${endDate}, ${endTime}`;

  console.log('formattedData in hourWxTableDataFromDB:', formattedData);

  return {
    data: formattedData,
    // title: `${stationName}, Hourly: ${timeRange}`,
    title: `Raw Hourly Station Data - ${stationName}`,
  };
}

export default hourWxTableDataFromDB;
