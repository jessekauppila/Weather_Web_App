function getSnowAccumulation(
  elevation: number,
  temperature: string
): string {
  // Base snow amount with random variance
  let baseSnow;
  if (elevation > 6000) {
    baseSnow = Math.random() * 12; // 0-12 inches for high elevations
  } else if (elevation > 4000) {
    baseSnow = Math.random() * 6; // 0-6 inches for mid elevations
  } else {
    baseSnow = Math.random() * 1; // 0-1 inches for low elevations
  }

  // Elevation multiplier (more snow at higher elevations)
  let elevationMultiplier = 1;
  if (elevation > 6000)
    elevationMultiplier = 2.2; // Significant increase above 6000ft
  else if (elevation > 4000)
    elevationMultiplier = 1.8; // Moderate increase 4000-6000ft
  else if (elevation > 2000)
    elevationMultiplier = 1.4; // Small increase 2000-4000ft
  else elevationMultiplier = 1; // Base amount below 2000ft

  // Temperature multiplier
  const temp = parseInt(temperature.split(' ')[0]); // Extract number from "XX °F"
  let tempMultiplier = 1;
  if (temp > 34) tempMultiplier = 0.1; // Very little snow above 34°F
  else if (temp > 31) tempMultiplier = 0.5; // Reduced snow 31-34°F
  else tempMultiplier = 1; // Full snow below 31°F

  return (baseSnow * elevationMultiplier * tempMultiplier).toFixed(2);
}

function getWindPattern(
  latitude: number,
  longitude: number,
  elevation: number
) {
  // Create "zones" based on lat/long to group nearby stations
  const zoneSize = 0.5; // Size of each zone in degrees
  const zoneX = Math.floor(longitude / zoneSize);
  const zoneY = Math.floor(latitude / zoneSize);

  // Use the zone to seed a consistent random value for nearby stations
  const zoneSeed = Math.sin(zoneX * 12.9898 + zoneY * 78.233);
  const zoneRandom = Math.abs(Math.sin(zoneSeed) * 43758.5453123) % 1;

  // Wind directions in clockwise order
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  // Pick a base direction for this zone
  const baseDirectionIndex = Math.floor(
    zoneRandom * directions.length
  );

  // Add some random variance (±1 direction) for individual stations
  const stationVariance = Math.floor(Math.random() * 3) - 1;
  const finalDirectionIndex =
    (baseDirectionIndex + stationVariance + directions.length) %
    directions.length;

  // Generate wind speeds based on elevation and zone
  const baseSpeed = 10 + zoneRandom * 15; // Base speed 10-25 mph
  const elevationFactor = Math.min(
    1.5,
    Math.max(0.5, elevation / 5000)
  ); // Higher elevation = stronger winds
  const speedVariance = Math.random() * 10 - 5; // ±5 mph variance

  const windSpeed = Math.round(
    baseSpeed * elevationFactor + speedVariance
  );
  const windGust = Math.round(
    windSpeed * (1.3 + Math.random() * 0.4)
  ); // Gusts 30-70% stronger

  return {
    direction: directions[finalDirectionIndex],
    speed: windSpeed,
    gust: windGust,
    avgSpeed: Math.round((windSpeed + windSpeed * 0.8) / 2), // Average between current and 80% of current
  };
}

export const station_data = [
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      4210,
      '22 °F'
    )} in`,
    'Air Temp Max': '28 °F',
    'Air Temp Min': '15 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '22 °F',
    'Cur Wind Speed': `${
      getWindPattern(48.863017, -121.67785, 4210).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '4210 ft',
    Latitude: '48.863017',
    Longitude: '-121.67785',
    'Max Wind Gust': `${
      getWindPattern(48.863017, -121.67785, 4210).gust
    } mph`,
    'Precip Accum One Hour': '0.15 in',
    'Relative Humidity': '95%',
    Station: 'Mt. Baker - Heather Meadows',
    Stid: '5',
    'Total Snow Depth': '125.90 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      4210,
      '22 °F'
    )} in`,
    'Wind Direction': getWindPattern(48.863017, -121.67785, 4210)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(48.863017, -121.67785, 4210).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5020,
      '19 °F'
    )} in`,
    'Air Temp Max': '25 °F',
    'Air Temp Min': '12 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '19 °F',
    'Cur Wind Speed': `${
      getWindPattern(48.85305, -121.6772, 5020).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5020 ft',
    Latitude: '48.85305',
    Longitude: '-121.6772',
    'Max Wind Gust': `${
      getWindPattern(48.85305, -121.6772, 5020).gust
    } mph`,
    'Precip Accum One Hour': '0.18 in',
    'Relative Humidity': '97%',
    Station: 'Mt. Baker - Pan Dome',
    Stid: '6',
    'Total Snow Depth': '132.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5020,
      '19 °F'
    )} in`,
    'Wind Direction': getWindPattern(48.85305, -121.6772, 5020)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(48.85305, -121.6772, 5020).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      2170,
      '28 °F'
    )} in`,
    'Air Temp Max': '32 °F',
    'Air Temp Min': '22 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '28 °F',
    'Cur Wind Speed': `${
      getWindPattern(48.597283, -120.437433, 2170).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '2170 ft',
    Latitude: '48.597283',
    Longitude: '-120.437433',
    'Max Wind Gust': `${
      getWindPattern(48.597283, -120.437433, 2170).gust
    } mph`,
    'Precip Accum One Hour': '0.08 in',
    'Relative Humidity': '88%',
    Station: 'Mazama',
    Stid: '7',
    'Total Snow Depth': '45.60 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      2170,
      '28 °F'
    )} in`,
    'Wind Direction': getWindPattern(48.597283, -120.437433, 2170)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(48.597283, -120.437433, 2170).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5450,
      '21 °F'
    )} in`,
    'Air Temp Max': '26 °F',
    'Air Temp Min': '14 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '21 °F',
    'Cur Wind Speed': `${
      getWindPattern(48.525783, -120.65525, 5450).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5450 ft',
    Latitude: '48.525783',
    Longitude: '-120.65525',
    'Max Wind Gust': `${
      getWindPattern(48.525783, -120.65525, 5450).gust
    } mph`,
    'Precip Accum One Hour': '0.12 in',
    'Relative Humidity': '93%',
    Station: 'Washington Pass Base',
    Stid: '8',
    'Total Snow Depth': '98.30 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5450,
      '21 °F'
    )} in`,
    'Wind Direction': getWindPattern(48.525783, -120.65525, 5450)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(48.525783, -120.65525, 5450).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      6680,
      '17 °F'
    )} in`,
    'Air Temp Max': '22 °F',
    'Air Temp Min': '10 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '17 °F',
    'Cur Wind Speed': `${
      getWindPattern(48.533283, -120.649733, 6680).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '6680 ft',
    Latitude: '48.533283',
    Longitude: '-120.649733',
    'Max Wind Gust': `${
      getWindPattern(48.533283, -120.649733, 6680).gust
    } mph`,
    'Precip Accum One Hour': '0.20 in',
    'Relative Humidity': '96%',
    Station: 'Washington Pass Upper',
    Stid: '9',
    'Total Snow Depth': '142.60 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      6680,
      '17 °F'
    )} in`,
    'Wind Direction': getWindPattern(48.533283, -120.649733, 6680)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(48.533283, -120.649733, 6680).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      1930,
      '30 °F'
    )} in`,
    'Air Temp Max': '34 °F',
    'Air Temp Min': '24 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '30 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.813517, -120.722917, 1930).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '1930 ft',
    Latitude: '47.813517',
    Longitude: '-120.722917',
    'Max Wind Gust': `${
      getWindPattern(47.813517, -120.722917, 1930).gust
    } mph`,
    'Precip Accum One Hour': '0.06 in',
    'Relative Humidity': '85%',
    Station: 'Lake Wenatchee',
    Stid: '11',
    'Total Snow Depth': '38.20 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      1930,
      '30 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.813517, -120.722917, 1930)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.813517, -120.722917, 1930).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      2700,
      '27 °F'
    )} in`,
    'Air Temp Max': '31 °F',
    'Air Temp Min': '21 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '27 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.775017, -120.965983, 2700).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '2700 ft',
    Latitude: '47.775017',
    Longitude: '-120.965983',
    'Max Wind Gust': `${
      getWindPattern(47.775017, -120.965983, 2700).gust
    } mph`,
    'Precip Accum One Hour': '0.08 in',
    'Relative Humidity': '88%',
    Station: 'Berne',
    Stid: '12',
    'Total Snow Depth': '52.60 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      2700,
      '27 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.775017, -120.965983, 2700)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.775017, -120.965983, 2700).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      3950,
      '24 °F'
    )} in`,
    'Air Temp Max': '28 °F',
    'Air Temp Min': '18 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '24 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.746133, -121.092633, 3950).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '3950 ft',
    Latitude: '47.746133',
    Longitude: '-121.092633',
    'Max Wind Gust': `${
      getWindPattern(47.746133, -121.092633, 3950).gust
    } mph`,
    'Precip Accum One Hour': '0.12 in',
    'Relative Humidity': '92%',
    Station: 'Stevens Pass - Schmidt Haus',
    Stid: '13',
    'Total Snow Depth': '85.30 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      3950,
      '24 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.746133, -121.092633, 3950)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.746133, -121.092633, 3950).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      4790,
      '22 °F'
    )} in`,
    'Air Temp Max': '26 °F',
    'Air Temp Min': '16 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '22 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.74085, -121.117083, 4790).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '4790 ft',
    Latitude: '47.74085',
    Longitude: '-121.117083',
    'Max Wind Gust': `${
      getWindPattern(47.74085, -121.117083, 4790).gust
    } mph`,
    'Precip Accum One Hour': '0.15 in',
    'Relative Humidity': '94%',
    Station: 'Stevens Pass - Grace Lakes',
    Stid: '14',
    'Total Snow Depth': '98.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      4790,
      '22 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.74085, -121.117083, 4790)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.74085, -121.117083, 4790).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5250,
      '20 °F'
    )} in`,
    'Air Temp Max': '24 °F',
    'Air Temp Min': '14 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '20 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.734, -121.1081, 5250).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5250 ft',
    Latitude: '47.734',
    Longitude: '-121.1081',
    'Max Wind Gust': `${
      getWindPattern(47.734, -121.1081, 5250).gust
    } mph`,
    'Precip Accum One Hour': '0.16 in',
    'Relative Humidity': '95%',
    Station: 'Stevens Pass - Skyline',
    Stid: '17',
    'Total Snow Depth': '105.70 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5250,
      '20 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.734, -121.1081, 5250)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.734, -121.1081, 5250).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      4340,
      '26 °F'
    )} in`,
    'Air Temp Max': '30 °F',
    'Air Temp Min': '20 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '26 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.425933, -121.699383, 4340).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '4340 ft',
    Latitude: '47.425933',
    Longitude: '-121.699383',
    'Max Wind Gust': `${
      getWindPattern(47.425933, -121.699383, 4340).gust
    } mph`,
    'Precip Accum One Hour': '0.11 in',
    'Relative Humidity': '91%',
    Station: 'Mt. Washington',
    Stid: '20',
    'Total Snow Depth': '78.50 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      4340,
      '26 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.425933, -121.699383, 4340)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.425933, -121.699383, 4340).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      3010,
      '28 °F'
    )} in`,
    'Air Temp Max': '32 °F',
    'Air Temp Min': '22 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '28 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.424867, -121.41395, 3010).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '3010 ft',
    Latitude: '47.424867',
    Longitude: '-121.41395',
    'Max Wind Gust': `${
      getWindPattern(47.424867, -121.41395, 3010).gust
    } mph`,
    'Precip Accum One Hour': '0.09 in',
    'Relative Humidity': '89%',
    Station: 'Snoqualmie Pass',
    Stid: '21',
    'Total Snow Depth': '65.30 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      3010,
      '28 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.424867, -121.41395, 3010)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.424867, -121.41395, 3010).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      3760,
      '27 °F'
    )} in`,
    'Air Temp Max': '31 °F',
    'Air Temp Min': '21 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '27 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.4204, -121.427533, 3760).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '3760 ft',
    Latitude: '47.4204',
    Longitude: '-121.427533',
    'Max Wind Gust': `${
      getWindPattern(47.4204, -121.427533, 3760).gust
    } mph`,
    'Precip Accum One Hour': '0.10 in',
    'Relative Humidity': '90%',
    Station: 'Snoqualmie Pass - Dodge Ridge',
    Stid: '22',
    'Total Snow Depth': '72.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      3760,
      '27 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.4204, -121.427533, 3760)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.4204, -121.427533, 3760).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      3770,
      '27 °F'
    )} in`,
    'Air Temp Max': '31 °F',
    'Air Temp Min': '21 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '27 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.357233, -121.360333, 3770).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '3770 ft',
    Latitude: '47.357233',
    Longitude: '-121.360333',
    'Max Wind Gust': `${
      getWindPattern(47.357233, -121.360333, 3770).gust
    } mph`,
    'Precip Accum One Hour': '0.10 in',
    'Relative Humidity': '90%',
    Station: 'Snoqualmie Pass - East Shed',
    Stid: '23',
    'Total Snow Depth': '72.80 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      3770,
      '27 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.357233, -121.360333, 3770)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.357233, -121.360333, 3770).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5470,
      '24 °F'
    )} in`,
    'Air Temp Max': '28 °F',
    'Air Temp Min': '18 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '24 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.438817, -121.442617, 5470).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5470 ft',
    Latitude: '47.438817',
    Longitude: '-121.442617',
    'Max Wind Gust': `${
      getWindPattern(47.438817, -121.442617, 5470).gust
    } mph`,
    'Precip Accum One Hour': '0.14 in',
    'Relative Humidity': '93%',
    Station: 'Alpental Summit',
    Stid: '3',
    'Total Snow Depth': '95.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5470,
      '24 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.438817, -121.442617, 5470)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.438817, -121.442617, 5470).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      6230,
      '21 °F'
    )} in`,
    'Air Temp Max': '25 °F',
    'Air Temp Min': '15 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '21 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.939433, -121.494333, 6230).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '6230 ft',
    Latitude: '46.939433',
    Longitude: '-121.494333',
    'Max Wind Gust': `${
      getWindPattern(46.939433, -121.494333, 6230).gust
    } mph`,
    'Precip Accum One Hour': '0.17 in',
    'Relative Humidity': '94%',
    Station: 'Crystal - Green Valley',
    Stid: '27',
    'Total Snow Depth': '112.30 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      6230,
      '21 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.939433, -121.494333, 6230)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.939433, -121.494333, 6230).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      4540,
      '25 °F'
    )} in`,
    'Air Temp Max': '29 °F',
    'Air Temp Min': '19 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '25 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.9305, -121.47578, 4540).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '4540 ft',
    Latitude: '46.9305',
    Longitude: '-121.47578',
    'Max Wind Gust': `${
      getWindPattern(46.9305, -121.47578, 4540).gust
    } mph`,
    'Precip Accum One Hour': '0.12 in',
    'Relative Humidity': '91%',
    Station: 'Crystal Base',
    Stid: '28',
    'Total Snow Depth': '85.60 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      4540,
      '25 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.9305, -121.47578, 4540)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.9305, -121.47578, 4540).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      6830,
      '19 °F'
    )} in`,
    'Air Temp Max': '23 °F',
    'Air Temp Min': '13 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '19 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.93505, -121.500433, 6830).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '6830 ft',
    Latitude: '46.93505',
    Longitude: '-121.500433',
    'Max Wind Gust': `${
      getWindPattern(46.93505, -121.500433, 6830).gust
    } mph`,
    'Precip Accum One Hour': '0.19 in',
    'Relative Humidity': '95%',
    Station: 'Crystal Summit',
    Stid: '29',
    'Total Snow Depth': '125.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      6830,
      '19 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.93505, -121.500433, 6830)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.93505, -121.500433, 6830).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      10110,
      '15 °F'
    )} in`,
    'Air Temp Max': '18 °F',
    'Air Temp Min': '10 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '15 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.835417, -121.73305, 10110).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '10110 ft',
    Latitude: '46.835417',
    Longitude: '-121.73305',
    'Max Wind Gust': `${
      getWindPattern(46.835417, -121.73305, 10110).gust
    } mph`,
    'Precip Accum One Hour': '0.22 in',
    'Relative Humidity': '98%',
    Station: 'Camp Muir',
    Stid: '34',
    'Total Snow Depth': '145.80 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      10110,
      '15 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.835417, -121.73305, 10110)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.835417, -121.73305, 10110).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5400,
      '23 °F'
    )} in`,
    'Air Temp Max': '27 °F',
    'Air Temp Min': '17 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '23 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.786217, -121.7424, 5400).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5400 ft',
    Latitude: '46.786217',
    Longitude: '-121.7424',
    'Max Wind Gust': `${
      getWindPattern(46.786217, -121.7424, 5400).gust
    } mph`,
    'Precip Accum One Hour': '0.15 in',
    'Relative Humidity': '93%',
    Station: 'Paradise',
    Stid: '35',
    'Total Snow Depth': '98.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5400,
      '23 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.786217, -121.7424, 5400)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.786217, -121.7424, 5400).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      4500,
      '26 °F'
    )} in`,
    'Air Temp Max': '30 °F',
    'Air Temp Min': '20 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '26 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.63678, -121.3915, 4500).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '4500 ft',
    Latitude: '46.63678',
    Longitude: '-121.3915',
    'Max Wind Gust': `${
      getWindPattern(46.63678, -121.3915, 4500).gust
    } mph`,
    'Precip Accum One Hour': '0.11 in',
    'Relative Humidity': '90%',
    Station: 'White Pass Base',
    Stid: '37',
    'Total Snow Depth': '82.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      4500,
      '26 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.63678, -121.3915, 4500)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.63678, -121.3915, 4500).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5800,
      '23 °F'
    )} in`,
    'Air Temp Max': '27 °F',
    'Air Temp Min': '17 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '23 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.620767, -121.387367, 5800).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5800 ft',
    Latitude: '46.620767',
    Longitude: '-121.387367',
    'Max Wind Gust': `${
      getWindPattern(46.620767, -121.387367, 5800).gust
    } mph`,
    'Precip Accum One Hour': '0.14 in',
    'Relative Humidity': '93%',
    Station: 'White Pass Upper',
    Stid: '39',
    'Total Snow Depth': '98.60 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5800,
      '23 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.620767, -121.387367, 5800)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.620767, -121.387367, 5800).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5970,
      '22 °F'
    )} in`,
    'Air Temp Max': '26 °F',
    'Air Temp Min': '16 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '22 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.624, -121.388, 5970).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5970 ft',
    Latitude: '46.624',
    Longitude: '-121.388',
    'Max Wind Gust': `${
      getWindPattern(46.624, -121.388, 5970).gust
    } mph`,
    'Precip Accum One Hour': '0.15 in',
    'Relative Humidity': '94%',
    Station: 'White Pass - Pigtail Peak',
    Stid: '49',
    'Total Snow Depth': '102.30 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5970,
      '22 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.624, -121.388, 5970)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.624, -121.388, 5970).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      3260,
      '29 °F'
    )} in`,
    'Air Temp Max': '33 °F',
    'Air Temp Min': '23 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '29 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.303333, -122.265033, 3260).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '3260 ft',
    Latitude: '46.303333',
    Longitude: '-122.265033',
    'Max Wind Gust': `${
      getWindPattern(46.303333, -122.265033, 3260).gust
    } mph`,
    'Precip Accum One Hour': '0.08 in',
    'Relative Humidity': '87%',
    Station: 'Mt. St. Helens - Coldwater',
    Stid: '40',
    'Total Snow Depth': '55.20 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      3260,
      '29 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.303333, -122.265033, 3260)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.303333, -122.265033, 3260).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      7300,
      '20 °F'
    )} in`,
    'Air Temp Max': '24 °F',
    'Air Temp Min': '14 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '20 °F',
    'Cur Wind Speed': `${
      getWindPattern(45.349267, -121.681633, 7300).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '7300 ft',
    Latitude: '45.349267',
    Longitude: '-121.681633',
    'Max Wind Gust': `${
      getWindPattern(45.349267, -121.681633, 7300).gust
    } mph`,
    'Precip Accum One Hour': '0.18 in',
    'Relative Humidity': '95%',
    Station: 'Mt. Hood Meadows - Cascade Express',
    Stid: '41',
    'Total Snow Depth': '128.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      7300,
      '20 °F'
    )} in`,
    'Wind Direction': getWindPattern(45.349267, -121.681633, 7300)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(45.349267, -121.681633, 7300).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      6540,
      '22 °F'
    )} in`,
    'Air Temp Max': '26 °F',
    'Air Temp Min': '16 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '22 °F',
    'Cur Wind Speed': `${
      getWindPattern(45.343567, -121.672267, 6540).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '6540 ft',
    Latitude: '45.343567',
    Longitude: '-121.672267',
    'Max Wind Gust': `${
      getWindPattern(45.343567, -121.672267, 6540).gust
    } mph`,
    'Precip Accum One Hour': '0.15 in',
    'Relative Humidity': '93%',
    Station: 'Mt. Hood Meadows - Blue',
    Stid: '42',
    'Total Snow Depth': '112.60 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      6540,
      '22 °F'
    )} in`,
    'Wind Direction': getWindPattern(45.343567, -121.672267, 6540)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(45.343567, -121.672267, 6540).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5380,
      '25 °F'
    )} in`,
    'Air Temp Max': '29 °F',
    'Air Temp Min': '19 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '25 °F',
    'Cur Wind Speed': `${
      getWindPattern(45.332633, -121.666033, 5380).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5380 ft',
    Latitude: '45.332633',
    Longitude: '-121.666033',
    'Max Wind Gust': `${
      getWindPattern(45.332633, -121.666033, 5380).gust
    } mph`,
    'Precip Accum One Hour': '0.12 in',
    'Relative Humidity': '91%',
    Station: 'Mt. Hood Meadows Base',
    Stid: '43',
    'Total Snow Depth': '92.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5380,
      '25 °F'
    )} in`,
    'Wind Direction': getWindPattern(45.332633, -121.666033, 5380)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(45.332633, -121.666033, 5380).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      6990,
      '21 °F'
    )} in`,
    'Air Temp Max': '25 °F',
    'Air Temp Min': '15 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '21 °F',
    'Cur Wind Speed': `${
      getWindPattern(45.345367, -121.71175, 6990).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '6990 ft',
    Latitude: '45.345367',
    Longitude: '-121.71175',
    'Max Wind Gust': `${
      getWindPattern(45.345367, -121.71175, 6990).gust
    } mph`,
    'Precip Accum One Hour': '0.17 in',
    'Relative Humidity': '94%',
    Station: 'Timberline - Magic Mile',
    Stid: '45',
    'Total Snow Depth': '118.30 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      6990,
      '21 °F'
    )} in`,
    'Wind Direction': getWindPattern(45.345367, -121.71175, 6990)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(45.345367, -121.71175, 6990).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      3660,
      '29 °F'
    )} in`,
    'Air Temp Max': '33 °F',
    'Air Temp Min': '23 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '29 °F',
    'Cur Wind Speed': `${
      getWindPattern(45.301633, -121.772133, 3660).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '3660 ft',
    Latitude: '45.301633',
    Longitude: '-121.772133',
    'Max Wind Gust': `${
      getWindPattern(45.301633, -121.772133, 3660).gust
    } mph`,
    'Precip Accum One Hour': '0.08 in',
    'Relative Humidity': '88%',
    Station: 'Skibowl Base',
    Stid: '46',
    'Total Snow Depth': '58.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      3660,
      '29 °F'
    )} in`,
    'Wind Direction': getWindPattern(45.301633, -121.772133, 3660)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(45.301633, -121.772133, 3660).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      4610,
      '25 °F'
    )} in`,
    'Air Temp Max': '29 °F',
    'Air Temp Min': '19 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '25 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.29125, -120.399383, 4610).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '4610 ft',
    Latitude: '47.29125',
    Longitude: '-120.399383',
    'Max Wind Gust': `${
      getWindPattern(47.29125, -120.399383, 4610).gust
    } mph`,
    'Precip Accum One Hour': '0.11 in',
    'Relative Humidity': '90%',
    Station: 'Mission Ridge Base',
    Stid: '24',
    'Total Snow Depth': '75.60 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      4610,
      '25 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.29125, -120.399383, 4610)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.29125, -120.399383, 4610).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      6730,
      '19 °F'
    )} in`,
    'Air Temp Max': '23 °F',
    'Air Temp Min': '13 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '19 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.27495, -120.427417, 6730).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '6730 ft',
    Latitude: '47.27495',
    Longitude: '-120.427417',
    'Max Wind Gust': `${
      getWindPattern(47.27495, -120.427417, 6730).gust
    } mph`,
    'Precip Accum One Hour': '0.17 in',
    'Relative Humidity': '94%',
    Station: 'Mission Ridge Summit',
    Stid: '25',
    'Total Snow Depth': '108.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      6730,
      '19 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.27495, -120.427417, 6730)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.27495, -120.427417, 6730).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5160,
      '22 °F'
    )} in`,
    'Air Temp Max': '26 °F',
    'Air Temp Min': '16 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '22 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.285983, -120.410817, 5160).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5160 ft',
    Latitude: '47.285983',
    Longitude: '-120.410817',
    'Max Wind Gust': `${
      getWindPattern(47.285983, -120.410817, 5160).gust
    } mph`,
    'Precip Accum One Hour': '0.14 in',
    'Relative Humidity': '92%',
    Station: 'Mission Ridge Mid-Mountain',
    Stid: '26',
    'Total Snow Depth': '88.50 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5160,
      '22 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.285983, -120.410817, 5160)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.285983, -120.410817, 5160).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      1190,
      '32 °F'
    )} in`,
    'Air Temp Max': '36 °F',
    'Air Temp Min': '26 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '32 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.591185, -120.671318, 1190).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '1190 ft',
    Latitude: '47.591185',
    Longitude: '-120.671318',
    'Max Wind Gust': `${
      getWindPattern(47.591185, -120.671318, 1190).gust
    } mph`,
    'Precip Accum One Hour': '0.05 in',
    'Relative Humidity': '85%',
    Station: 'Leavenworth',
    Stid: '53',
    'Total Snow Depth': '28.40 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      1190,
      '32 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.591185, -120.671318, 1190)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.591185, -120.671318, 1190).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5030,
      '21 °F'
    )} in`,
    'Air Temp Max': '25 °F',
    'Air Temp Min': '15 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '21 °F',
    'Cur Wind Speed': `${
      getWindPattern(48.22067, -121.44057, 5030).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5030 ft',
    Latitude: '48.22067',
    Longitude: '-121.44057',
    'Max Wind Gust': `${
      getWindPattern(48.22067, -121.44057, 5030).gust
    } mph`,
    'Precip Accum One Hour': '0.15 in',
    'Relative Humidity': '93%',
    Station: 'White Chuck Mountain',
    Stid: '57',
    'Total Snow Depth': '95.60 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5030,
      '21 °F'
    )} in`,
    'Wind Direction': getWindPattern(48.22067, -121.44057, 5030)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(48.22067, -121.44057, 5030).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      3100,
      '52 °F'
    )} in`,
    'Air Temp Max': '58 °F',
    'Air Temp Min': '38 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '52 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.444067, -121.42485, 3100).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '3100 ft',
    Latitude: '47.444067',
    Longitude: '-121.424850',
    'Max Wind Gust': `${
      getWindPattern(47.444067, -121.42485, 3100).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '90%',
    Station: 'Alpental Base',
    Stid: '1',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      3100,
      '52 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.444067, -121.42485, 3100)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.444067, -121.42485, 3100).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      4350,
      '42 °F'
    )} in`,
    'Air Temp Max': '48 °F',
    'Air Temp Min': '28 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '42 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.43474, -121.433565, 4350).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '4350 ft',
    Latitude: '47.434740',
    Longitude: '-121.433565',
    'Max Wind Gust': `${
      getWindPattern(47.43474, -121.433565, 4350).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '92%',
    Station: 'Alpental Mid-Mountain',
    Stid: '2',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      4350,
      '42 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.43474, -121.433565, 4350)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.43474, -121.433565, 4350).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5250,
      '40 °F'
    )} in`,
    'Air Temp Max': '45 °F',
    'Air Temp Min': '25 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '40 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.9704, -123.499333, 5250).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5250 ft',
    Latitude: '47.970400',
    Longitude: '-123.499333',
    'Max Wind Gust': `${
      getWindPattern(47.9704, -123.499333, 5250).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '88%',
    Station: 'Hurricane Ridge',
    Stid: '4',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5250,
      '40 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.9704, -123.499333, 5250)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.9704, -123.499333, 5250).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5180,
      '41 °F'
    )} in`,
    'Air Temp Max': '46 °F',
    'Air Temp Min': '26 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '41 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.731633, -121.0853, 5180).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5180 ft',
    Latitude: '47.731633',
    Longitude: '-121.085300',
    'Max Wind Gust': `${
      getWindPattern(47.731633, -121.0853, 5180).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '91%',
    Station: 'Stevens Pass - Tye Mill',
    Stid: '18',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5180,
      '41 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.731633, -121.0853, 5180)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.731633, -121.0853, 5180).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      4180,
      '45 °F'
    )} in`,
    'Air Temp Max': '50 °F',
    'Air Temp Min': '30 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '45 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.628333, -120.707167, 4180).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '4180 ft',
    Latitude: '47.628333',
    Longitude: '-120.707167',
    'Max Wind Gust': `${
      getWindPattern(47.628333, -120.707167, 4180).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '89%',
    Station: 'Tumwater Mountain',
    Stid: '19',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      4180,
      '45 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.628333, -120.707167, 4180)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.628333, -120.707167, 4180).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      6880,
      '32 °F'
    )} in`,
    'Air Temp Max': '38 °F',
    'Air Temp Min': '18 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '32 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.919183, -121.6516, 6880).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '6880 ft',
    Latitude: '46.919183',
    Longitude: '-121.651600',
    'Max Wind Gust': `${
      getWindPattern(46.919183, -121.6516, 6880).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '93%',
    Station: 'Sunrise Upper',
    Stid: '30',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      6880,
      '32 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.919183, -121.6516, 6880)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.919183, -121.6516, 6880).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      6410,
      '36 °F'
    )} in`,
    'Air Temp Max': '42 °F',
    'Air Temp Min': '22 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '36 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.914367, -121.644167, 6410).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '6410 ft',
    Latitude: '46.914367',
    Longitude: '-121.644167',
    'Max Wind Gust': `${
      getWindPattern(46.914367, -121.644167, 6410).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '91%',
    Station: 'Sunrise Base',
    Stid: '31',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      6410,
      '36 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.914367, -121.644167, 6410)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.914367, -121.644167, 6410).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      6240,
      '35 °F'
    )} in`,
    'Air Temp Max': '40 °F',
    'Air Temp Min': '20 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '35 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.880533, -121.519567, 6240).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '6240 ft',
    Latitude: '46.880533',
    Longitude: '-121.519567',
    'Max Wind Gust': `${
      getWindPattern(46.880533, -121.519567, 6240).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '92%',
    Station: 'Chinook Pass Summit',
    Stid: '32',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      6240,
      '35 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.880533, -121.519567, 6240)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.880533, -121.519567, 6240).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5500,
      '40 °F'
    )} in`,
    'Air Temp Max': '45 °F',
    'Air Temp Min': '25 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '40 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.873267, -121.517383, 5500).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5500 ft',
    Latitude: '46.873267',
    Longitude: '-121.517383',
    'Max Wind Gust': `${
      getWindPattern(46.873267, -121.517383, 5500).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '90%',
    Station: 'Chinook Pass Base',
    Stid: '33',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5500,
      '40 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.873267, -121.517383, 5500)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.873267, -121.517383, 5500).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5380,
      '40 °F'
    )} in`,
    'Air Temp Max': '45 °F',
    'Air Temp Min': '25 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '40 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.784867, -121.7419, 5380).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5380 ft',
    Latitude: '46.784867',
    Longitude: '-121.741900',
    'Max Wind Gust': `${
      getWindPattern(46.784867, -121.7419, 5380).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '91%',
    Station: 'Paradise Wind',
    Stid: '36',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5380,
      '40 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.784867, -121.7419, 5380)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.784867, -121.7419, 5380).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5800,
      '40 °F'
    )} in`,
    'Air Temp Max': '45 °F',
    'Air Temp Min': '25 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '40 °F',
    'Cur Wind Speed': `${
      getWindPattern(45.329967, -121.711333, 5800).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5800 ft',
    Latitude: '45.329967',
    Longitude: '-121.711333',
    'Max Wind Gust': `${
      getWindPattern(45.329967, -121.711333, 5800).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '90%',
    Station: 'Timberline Lodge',
    Stid: '44',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5800,
      '40 °F'
    )} in`,
    'Wind Direction': getWindPattern(45.329967, -121.711333, 5800)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(45.329967, -121.711333, 5800).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5010,
      '41 °F'
    )} in`,
    'Air Temp Max': '46 °F',
    'Air Temp Min': '26 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '41 °F',
    'Cur Wind Speed': `${
      getWindPattern(45.288567, -121.78275, 5010).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5010 ft',
    Latitude: '45.288567',
    Longitude: '-121.782750',
    'Max Wind Gust': `${
      getWindPattern(45.288567, -121.78275, 5010).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '89%',
    Station: 'Skibowl Summit',
    Stid: '47',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5010,
      '41 °F'
    )} in`,
    'Wind Direction': getWindPattern(45.288567, -121.78275, 5010)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(45.288567, -121.78275, 5010).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      4100,
      '46 °F'
    )} in`,
    'Air Temp Max': '52 °F',
    'Air Temp Min': '32 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '46 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.334755, -120.577435, 4100).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '4100 ft',
    Latitude: '47.334755',
    Longitude: '-120.577435',
    'Max Wind Gust': `${
      getWindPattern(47.334755, -120.577435, 4100).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '88%',
    Station: 'Blewett Pass',
    Stid: '48',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      4100,
      '46 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.334755, -120.577435, 4100)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.334755, -120.577435, 4100).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      4800,
      '42 °F'
    )} in`,
    'Air Temp Max': '47 °F',
    'Air Temp Min': '27 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '42 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.737577, -121.107316, 4800).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '4800 ft',
    Latitude: '47.737577',
    Longitude: '-121.107316',
    'Max Wind Gust': `${
      getWindPattern(47.737577, -121.107316, 4800).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '91%',
    Station: 'Stevens Pass - Brooks Precipitation',
    Stid: '50',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      4800,
      '42 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.737577, -121.107316, 4800)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.737577, -121.107316, 4800).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      4590,
      '43 °F'
    )} in`,
    'Air Temp Max': '48 °F',
    'Air Temp Min': '28 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '43 °F',
    'Cur Wind Speed': `${
      getWindPattern(47.742, -121.117, 4590).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '4590 ft',
    Latitude: '47.742000',
    Longitude: '-121.117000',
    'Max Wind Gust': `${
      getWindPattern(47.742, -121.117, 4590).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '90%',
    Station: 'Stevens Pass - Old Faithful',
    Stid: '51',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      4590,
      '43 °F'
    )} in`,
    'Wind Direction': getWindPattern(47.742, -121.117, 4590)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(47.742, -121.117, 4590).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5940,
      '35 °F'
    )} in`,
    'Air Temp Max': '40 °F',
    'Air Temp Min': '20 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '35 °F',
    'Cur Wind Speed': `${
      getWindPattern(46.92534, -121.49732, 5940).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5940 ft',
    Latitude: '46.925340',
    Longitude: '-121.497320',
    'Max Wind Gust': `${
      getWindPattern(46.92534, -121.49732, 5940).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '92%',
    Station: 'Crystal - Campbell Basin',
    Stid: '54',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5940,
      '35 °F'
    )} in`,
    'Wind Direction': getWindPattern(46.92534, -121.49732, 5940)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(46.92534, -121.49732, 5940).avgSpeed
    } mph`,
  },
  {
    '24h Snow Accumulation': `${getSnowAccumulation(
      5920,
      '37 °F'
    )} in`,
    'Air Temp Max': '42 °F',
    'Air Temp Min': '22 °F',
    'Api Fetch Time': 'Jan 31, 12:05 PM',
    'Cur Air Temp': '37 °F',
    'Cur Wind Speed': `${
      getWindPattern(45.33073, -121.71249, 5920).speed
    } mph`,
    'Date Time': '2:00 pm - 12:00 pm, Jan 31, 2025',
    Elevation: '5920 ft',
    Latitude: '45.330730',
    Longitude: '-121.712490',
    'Max Wind Gust': `${
      getWindPattern(45.33073, -121.71249, 5920).gust
    } mph`,
    'Precip Accum One Hour': '0.00 in',
    'Relative Humidity': '91%',
    Station: 'Timberline - Pucci',
    Stid: '56',
    'Total Snow Depth': '0.00 in',
    'Total Snow Depth Change': `${getSnowAccumulation(
      5920,
      '37 °F'
    )} in`,
    'Wind Direction': getWindPattern(45.33073, -121.71249, 5920)
      .direction,
    'Wind Speed Avg': `${
      getWindPattern(45.33073, -121.71249, 5920).avgSpeed
    } mph`,
  },
];

// Update the station data to use the wind pattern generator
export const updated_station_data = station_data.map((station) => {
  const wind = getWindPattern(
    parseFloat(station.Latitude),
    parseFloat(station.Longitude),
    parseFloat(station.Elevation)
  );

  return {
    ...station,
    'Wind Direction': wind.direction,
    'Cur Wind Speed': `${wind.speed} mph`,
    'Max Wind Gust': `${wind.gust} mph`,
    'Wind Speed Avg': `${wind.avgSpeed} mph`,
  };
});
