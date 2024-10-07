const stations = [
  {
    id: 'd13223c3-0692-4d23-8677-e093c8897efc',
    stid: '1',
    station_name: 'Alpental Base',
    longitude: -121.42485,
    latitude: 47.444066667,
    elevation: 3100,
    source: 'nwac',
    station_note:
      '09-01-2023 to ongoing: The precipitation gauge is underreporting compared to the WSDOT gauge at Snoqualmie Pass. Consider using the WSDOT gauge as a more reliable value at this time. | 05-31-2024 to ongoing: The 24-hour board has been removed for the summer season. Disregard all values.',
  },
  {
    id: 'd815ed9a-4663-4788-93b2-79998260b509',
    stid: '2',
    station_name: 'Alpental Mid-Mountain',
    longitude: -121.433565,
    latitude: 47.4347404,
    elevation: 4350,
    source: 'nwac',
    station_note:
      '05-31-2024 to ongoing: The 24-hour board has been removed for the summer season. Disregard all values.',
  },
];

const observations = [
  {
    station_id: 'd13223c3-0692-4d23-8677-e093c8897efc',
    date_time: '2024-10-02T12:00:00+00:00',
    air_temp: 6.11,
    snow_depth: 0.34,
    snow_depth_24h: -2.62,
    precip_accum_one_hour: 0,
    relative_humidity: 66.07,
    battery_voltage: 12.99,
  },
  {
    station_id: 'd13223c3-0692-4d23-8677-e093c8897efc',
    date_time: '2024-10-02T13:00:00+00:00',
    air_temp: 4.91,
    snow_depth: 0.35,
    snow_depth_24h: -2.75,
    precip_accum_one_hour: 0,
    relative_humidity: 77.48,
    battery_voltage: 12.99,
  },
  // ... (include all other measurements for Alpental Base)
  {
    station_id: 'd815ed9a-4663-4788-93b2-79998260b509',
    date_time: '2024-10-02T12:00:00+00:00',
    air_temp: 2.87,
    snow_depth: 0.2,
    snow_depth_24h: -0.42,
    relative_humidity: 71.22,
    battery_voltage: 13.21,
  },
  {
    station_id: 'd815ed9a-4663-4788-93b2-79998260b509',
    date_time: '2024-10-02T13:00:00+00:00',
    air_temp: 2.24,
    snow_depth: 0.2,
    snow_depth_24h: -0.39,
    relative_humidity: 75.08,
    battery_voltage: 13.21,
  },
  // ... (include all other measurements for Alpental Mid-Mountain)
];

export { stations, observations };
