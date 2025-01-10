export enum UnitType {
  TEMPERATURE = 'TEMPERATURE',
  WIND_SPEED = 'WIND_SPEED',
  PRECIPITATION = 'PRECIPITATION',
  PRECIPITATIONMM = 'PRECIPITATIONMM',

  HUMIDITY = 'HUMIDITY',
  SOLAR = 'SOLAR',
  TIMESTAMP = 'TIMESTAMP',
  ELEVATION = 'ELEVATION'
}

export const UNITS = {
  [UnitType.TEMPERATURE]: { imperial: ' °F', metric: ' °C' },
  [UnitType.WIND_SPEED]: { imperial: ' mph', metric: ' km/h' },
  [UnitType.PRECIPITATION]: { imperial: ' in', metric: ' cm' },
  [UnitType.PRECIPITATIONMM]: { imperial: ' in', metric: ' cm' },

  [UnitType.HUMIDITY]: { imperial: ' %', metric: ' %' },
  [UnitType.SOLAR]: { imperial: ' W/m²', metric: 'W/m²' },
  [UnitType.TIMESTAMP]: { imperial: 'timestamp', metric: 'timestamp' },
  [UnitType.ELEVATION]: { imperial: ' ft', metric: ' m' }
}; 