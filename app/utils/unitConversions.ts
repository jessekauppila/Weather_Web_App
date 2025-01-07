// Helper functions for unit conversions
function convertTemperature(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

function convertWindSpeed(metersPerSecond: number): number {
  return metersPerSecond * 2.23694;  // m/s to mph
}

function convertPrecipitation(millimeters: number): number {
  return millimeters * 0.0393701;  // mm to inches
}

function convertSnowDepth(centimeters: number): number {
  return centimeters * 0.02953;  // hPa to inHg * 0.393701;  // cm to inches
}

function convertPressure(hectoPascals: number): number {
  return hectoPascals * 0.02953;  // cm to inches
}

function convertElevation(feet: number): number {
  return Math.round(feet * 0.3048);  // Convert feet to meters and round to whole number
}

export function convertObservationUnits(
  observation: Record<string, any>,
  isMetric: boolean
): Record<string, any> {
  console.log('🔧 UnitConversions: Converting with isMetric:', isMetric);
  
  if (isMetric) {
    const convertedToMetric = { ...observation };


    ['elevation'].forEach((key) => {
      if (convertedToMetric[key] !== null) {
        convertedToMetric[key] = convertElevation(convertedToMetric[key]);
      }
    });
    
    console.log('🔧 UnitConversions: Returning metric values');
    return convertedToMetric;
  }
  
  console.log('🔧 UnitConversions: Converting to imperial values');
  const converted = { ...observation };

  // Temperature conversions (C to F)
  ['air_temp', 'equip_temperature', 'soil_temperature_a', 'soil_temperature_b'].forEach((key) => {
    if (converted[key] !== null) {
      converted[key] = convertTemperature(converted[key]);
    }
  });

  // Wind speed conversions (m/s to mph)
  ['wind_speed', 'wind_gust'].forEach((key) => {
    if (converted[key] !== null) {
      converted[key] = convertWindSpeed(converted[key]);
    }
  });

  // Precipitation conversions (mm to in)
  ['precip_accum_one_hour'].forEach((key) => {
    if (converted[key] !== null) {
      converted[key] = convertPrecipitation(converted[key]);
    }
  });

  // Snow depth conversions (cm to in)
  ['snow_depth', 'snow_depth_24h', 'error_filtered_total_snow', 'error_filtered_24hr_snow_accum'].forEach((key) => {
    if (converted[key] !== null) {
      converted[key] = convertSnowDepth(converted[key]);
    }
  });

  // Pressure conversion (hPa to inHg)
  if (converted.pressure !== null) {
    converted.pressure = convertPressure(converted.pressure);
  }

  return converted;
}
