import moment from 'moment-timezone';

function degreeToCompass(degree: number): string {
  // A utility function to convert degrees to compass directions
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
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
  console.log(
    'observationsData from hourWxTableData:',
    observationsData
  );

  // Instead of grouping and averaging, process each observation individually
  const formattedData = observationsData.map((obs) => {
    const formatValueWithUnit = (
      value: any,
      unit: string
    ): string => {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'number')
        return `${value.toFixed(1)} ${unit}`;
      return value;
    };

    return {
      Station: obs.station_name,
      Elevation: `${obs.elevation} ft`,
      Day: moment(obs.date_time).format('MMM D'),
      Hour: moment(obs.date_time).format('h:mm A'),
      'Air Temp': formatValueWithUnit(obs.air_temp, '°F'),
      'Wind Speed': formatValueWithUnit(obs.wind_speed, 'mph'),
      'Wind Gust': formatValueWithUnit(obs.wind_gust, 'mph'),
      'Wind Direction': degreeToCompass(obs.wind_direction),
      'Total Snow Depth': formatValueWithUnit(obs.snow_depth, 'in'),
      '24h Snow Depth': formatValueWithUnit(obs.snow_depth_24h, 'in'),
      'Precip Accum': formatValueWithUnit(
        obs.precip_accum_one_hour,
        'in'
      ),
      'Relative Humidity': formatValueWithUnit(
        obs.relative_humidity,
        '%'
      ),
    };
  });

  // Get the first and last dates from the observations with times
  const startDate = moment(observationsData[0].date_time).format(
    'MMM D, YYYY h:mm A'
  );
  const endDate = moment(
    observationsData[observationsData.length - 1].date_time
  ).format('MMM D, YYYY h:mm A');
  const stationName = observationsData[0]?.station_name || '';

  return {
    data: formattedData,
    title: `${stationName} Hourly Data: ${startDate} to ${endDate}`,
  };
}

export default hourWxTableDataFromDB;
