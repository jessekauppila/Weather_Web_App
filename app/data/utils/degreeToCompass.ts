// app/data/utils/degreeToCompass.ts

/**
 * Converts a degree value (0-360) to a 16-point compass direction.
 * @param degree - The wind direction in degrees.
 * @returns The compass direction as a string (e.g., 'N', 'NE', etc.)
 */
export function degreeToCompass(degree: number): string {
    const directions = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
  }

/**
 * Computes the circular mean (vector average) of an array of wind directions in degrees.
 * @param directions - Array of wind directions in degrees (0-360)
 * @returns The average wind direction in degrees (0-360)
 */
export function circularMean(directions: number[]): number | null {
  if (!directions.length) return null;
  const radians = directions.map(d => (d * Math.PI) / 180);
  const sumSin = radians.reduce((sum, r) => sum + Math.sin(r), 0);
  const sumCos = radians.reduce((sum, r) => sum + Math.cos(r), 0);
  let mean = Math.atan2(sumSin / directions.length, sumCos / directions.length);
  if (mean < 0) mean += 2 * Math.PI;
  return (mean * 180) / Math.PI;
}