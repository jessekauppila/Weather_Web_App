export function convertObservationUnits(
  observation: Record<string, any>
): Record<string, any> {
  const converted = { ...observation };

  // Temperature conversions (C to F)
  [
    'air_temp',
    'equip_temperature',
    'soil_temperature_a',
    'soil_temperature_b',
    'soil_temperature_c',
    'wet_bulb',
  ].forEach((key) => {
    if (converted[key] !== null) {
      converted[key] = (converted[key] * 9) / 5 + 32;
    }
  });

  // Wind speed conversions (m/s to mph)
  ['wind_speed', 'wind_gust', 'wind_speed_min'].forEach((key) => {
    if (converted[key] !== null) {
      converted[key] = converted[key] * 2.23694;
    }
  });

  // Precipitation and snow depth conversions (mm to in)
  ['precip_accum_one_hour', 'snow_depth', 'snow_depth_24h'].forEach(
    (key) => {
      if (converted[key] !== null) {
        converted[key] = converted[key] / 25.4;
      }
    }
  );

  // Pressure conversion (hPa to inHg)
  if (converted.pressure !== null) {
    converted.pressure = converted.pressure * 0.02953;
  }

  // No conversion needed for relative_humidity, solar_radiation, soil_moisture_a/b/c, wind_direction

  return converted;
}
