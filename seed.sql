-- seed.sql

-- Insert stations data
INSERT INTO stations (station_id, stid, station_name, longitude, latitude, elevation, source, station_note)
VALUES
('d13223c3-0692-4d23-8677-e093c8897efc', '1', 'Alpental Base', -121.42485, 47.444066667, 3100, 'nwac', '09-01-2023 to ongoing: The precipitation gauge is underreporting compared to the WSDOT gauge at Snoqualmie Pass. Consider using the WSDOT gauge as a more reliable value at this time. | 05-31-2024 to ongoing: The 24-hour board has been removed for the summer season. Disregard all values.'),
('d815ed9a-4663-4788-93b2-79998260b509', '2', 'Alpental Mid-Mountain', -121.433565, 47.4347404, 4350, 'nwac', '05-31-2024 to ongoing: The 24-hour board has been removed for the summer season. Disregard all values.');

-- Insert measurements data for Alpental Base
INSERT INTO measurements (station_id, date_time, air_temp, snow_depth, snow_depth_24h, precip_accum_one_hour, relative_humidity, battery_voltage)
VALUES
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T12:00:00+00:00', 6.11, 0.34, -2.62, 0, 66.07, 12.99),
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T13:00:00+00:00', 4.91, 0.35, -2.75, 0, 77.48, 12.99),
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T14:00:00+00:00', 4.54, 0.35, -2.83, 0, 71.95, 12.99),
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T15:00:00+00:00', 5.84, 0.35, -2.80, 0, 68.05, 12.99),
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T16:00:00+00:00', 6.08, 0.35, -2.69, 0, 70.68, 12.99),
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T17:00:00+00:00', 6.64, 0.35, -2.59, 0, 68.40, 12.98),
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T18:00:00+00:00', 7.42, 0.35, -2.45, 0, 57.61, 12.98),
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T19:00:00+00:00', 8.48, 0.35, -2.31, 0, 50.81, 12.98),
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T20:00:00+00:00', 8.14, 0.35, -1.77, 0, 54.26, 12.98),
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T21:00:00+00:00', 8.31, 0.35, -2.04, 0, 51.80, 12.98),
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T22:00:00+00:00', 8.08, 0.35, -2.28, 0, 56.09, 12.98),
('d13223c3-0692-4d23-8677-e093c8897efc', '2024-10-02T23:00:00+00:00', 7.77, 0.35, -2.47, 0, 58.13, 12.98);

-- Insert measurements data for Alpental Mid-Mountain
INSERT INTO measurements (station_id, date_time, air_temp, snow_depth, snow_depth_24h, relative_humidity, battery_voltage)
VALUES
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T12:00:00+00:00', 2.87, 0.2, -0.42, 71.22, 13.21),
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T13:00:00+00:00', 2.24, 0.2, -0.39, 75.08, 13.21),
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T14:00:00+00:00', 2.01, 0.2, -0.46, 74.84, 13.21),
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T15:00:00+00:00', 2.21, 0.2, -0.38, 81.40, 13.21),
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T16:00:00+00:00', 2.32, 0.2, -0.39, 85.10, 13.21),
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T17:00:00+00:00', 2.74, 0.2, -0.23, 83.10, 13.21),
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T18:00:00+00:00', 2.96, 0.2, -0.23, 69.96, 13.21),
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T19:00:00+00:00', 3.62, 0.2, -0.13, 66.20, 13.21),
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T20:00:00+00:00', 3.96, 0.2, -0.06, 66.87, 13.21),
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T21:00:00+00:00', 4.20, 0.2, -0.01, 64.00, 13.21),
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T22:00:00+00:00', 4.74, 0.2,  0.12, 67.06, 13.21),
('d815ed9a-4663-4788-93b2-79998260b509', '2024-10-02T23:00:00+00:00', 4.74, 0.2,  0.10, 67.30, 13.21);