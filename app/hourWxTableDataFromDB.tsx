import moment from "moment-timezone";

function degreeToCompass(degree: number): string {
  // A utility function to convert degrees to compass directions
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degree / 22.5) % 16;
  return directions[index];
}

function hourWxTableDataFromDB(
  observationsData: Array<Record<string, any>>,
  units: Array<Record<string, string>>
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

  console.log("observationsData from hourWxTableData:", observationsData);

  // Instead of grouping and averaging, process each observation individually
  const formattedData = observationsData.map((obs) => {
    const formatValueWithUnit = (value: any, unit: string): string => {
      if (value === null || value === undefined) return "-";
      if (typeof value === "number" || !isNaN(Number(value))) {
        const numValue = Number(value);
        // Special handling for temperature, humidity, wind speeds, and snow depth
        if (unit === "°F" || unit === "%" || unit === "mph") {
          return `${Math.round(numValue)}${unit}`;
        }
        if (unit === "in") {  // For snow depth and precipitation
          return `${numValue.toFixed(2)} ${unit}`;  // Round to 2 decimal places
        }
        return `${numValue.toFixed(1)} ${unit}`;
      }
      return "-";
    };

    return {
      Station: obs.station_name,
      Elevation: `${obs.elevation} ft`,
      Day: moment(obs.date_time).format("MMM D"),
      Hour: moment(obs.date_time).format("h:mm A"),
      "Air Temp": formatValueWithUnit(obs.air_temp, "°F"),
      "Wind Speed": formatValueWithUnit(obs.wind_speed, " mph"),
      "Wind Gust": formatValueWithUnit(obs.wind_gust, " mph"),
      "Wind Direction": degreeToCompass(obs.wind_direction),
      "Total Snow Depth": formatValueWithUnit(obs.snow_depth, "in"),
      "24h Snow Depth": formatValueWithUnit(obs.snow_depth_24h, "in"),
      "Precip Accum": formatValueWithUnit(obs.precip_accum_one_hour, "in"),
      "Precipitation": formatValueWithUnit(obs.precipitation, "in"),
      "Relative Humidity": formatValueWithUnit(obs.relative_humidity, "%"),
    };
  });

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

  return {
    data: formattedData,
    // title: `${stationName}, Hourly: ${timeRange}`,
    title: `Hourly - ${stationName}`,
  };
}

export default hourWxTableDataFromDB;
