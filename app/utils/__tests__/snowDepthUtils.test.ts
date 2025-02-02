import { filterSnowDepthOutliers, SNOW_DEPTH_CONFIG, SNOW_DEPTH_24H_CONFIG } from '../snowDepthUtils';

describe('filterSnowDepthOutliers', () => {
  const mockData = [
    { date_time: '2024-02-20T00:00:00Z', snow_depth: 10 },
    { date_time: '2024-02-20T01:00:00Z', snow_depth: 10 }, // Identical value
    { date_time: '2024-02-20T02:00:00Z', snow_depth: 15 }, // Normal increase
    { date_time: '2024-02-20T03:00:00Z', snow_depth: 25 }, // Outlier increase
    { date_time: '2024-02-20T04:00:00Z', snow_depth: 5 },  // Outlier decrease
  ];

  test('identifies identical values in total snow depth', () => {
    const result = filterSnowDepthOutliers(mockData, SNOW_DEPTH_CONFIG);
    expect(result[0].snow_depth).toBeNull(); // First identical value should be null
    expect(result[1].snow_depth).toBeNull(); // Second identical value should be null
  });

  test('allows identical values in 24h snow', () => {
    const result = filterSnowDepthOutliers(mockData, SNOW_DEPTH_24H_CONFIG);
    expect(result[0].snow_depth).toBe(10); // Should keep identical values
    expect(result[1].snow_depth).toBe(10);
  });

  test('filters out rapid increases', () => {
    const result = filterSnowDepthOutliers(mockData, SNOW_DEPTH_CONFIG);
    expect(result[3].snow_depth).toBeNull(); // Should filter out 25" reading
  });

  test('filters out rapid decreases', () => {
    const result = filterSnowDepthOutliers(mockData, SNOW_DEPTH_CONFIG);
    expect(result[4].snow_depth).toBeNull(); // Should filter out 5" reading
  });

  test('handles metric conversion', () => {
    const result = filterSnowDepthOutliers(mockData, SNOW_DEPTH_CONFIG, true);
    // Add expectations for metric values
  });
}); 