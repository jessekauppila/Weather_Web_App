export interface WindSpeedRange {
  min: number;
  max: number;
  label: string;
  description: string;
  color: string;
}

export const WIND_SPEED_RANGES: WindSpeedRange[] = [
  { min: 0, max: 0.6, label: '0 to .6', description: 'Calm', color: '#FFFFFF' },
  { min: 0.6, max: 16.2, label: '.6 to 16.2', description: 'Light', color: '#FFD5D5' },
  { min: 16.2, max: 25.5, label: '16.2 to 25.5', description: 'Moderate', color: '#E39E9E' },
  { min: 25.5, max: 37.3, label: '25.5 to 37.3', description: 'Strong', color: '#F27272' },
  { min: 37.3, max: 150, label: '37.3 to 150', description: 'Extreme', color: '#F80707' }
];

export const WIND_DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
];

export const WIND_DESCRIPTIONS = {
  'Extreme': '(Gale force or higher; difficulty in walking and slight to considerable structural damage.)',
  'Strong': '(Strong breeze; whole trees in motion and snow drifting.)',
  'Moderate': '(Fresh breeze; small trees sway, flags stretched and snow begins to drift.)',
  'Light': '(Light to gentle breeze; flags and twigs in motion.)',
  'Calm': '(No air motion; smoke rises vertically.)'
};

export function getWindSpeedRange(speed: number): string {
  for (const range of WIND_SPEED_RANGES) {
    if (speed >= range.min && speed < range.max) {
      return range.label;
    }
  }
  return WIND_SPEED_RANGES[WIND_SPEED_RANGES.length - 1].label;
}

export function getWindDescription(min: number, max: number): string {
  const range = WIND_SPEED_RANGES.find(r => r.min === min && r.max === max);
  return range?.description || 'Unknown';
}

export function getLabelSize(direction: string): number {
  const primaryDirections = ['N', 'E', 'S', 'W'];
  const secondaryDirections = ['NE', 'SE', 'SW', 'NW'];
  
  if (primaryDirections.includes(direction)) return 18;
  if (secondaryDirections.includes(direction)) return 14;
  return 12;
}

export function getLabelWeight(direction: string): number {
  const primaryDirections = ['N', 'E', 'S', 'W'];
  const secondaryDirections = ['NE', 'SE', 'SW', 'NW'];
  if (primaryDirections.includes(direction)) return 700;
  if (secondaryDirections.includes(direction)) return 600;
  return 500;
}

export function getCardinalDirection(degrees: number): string {
  const index = Math.round(degrees / 22.5) % 16;
  return WIND_DIRECTIONS[index];
}

export function processWindRoseData(data: Array<{
  'Wind Speed': string | number;
  'Wind Direction': string | number;
  [key: string]: any;
}>): string {
  const speedRanges = WIND_SPEED_RANGES.map(r => r.label);

  // Initialize the data structure
  const windData = WIND_DIRECTIONS.map(direction => {
    const row: { [key: string]: number | string } = { angle: direction };
    speedRanges.forEach(range => {
      row[range] = 0;
    });
    return row;
  });

  // Process each observation
  data.forEach(obs => {
    if (!obs['Wind Direction'] || !obs['Wind Speed']) return;

    const direction = String(obs['Wind Direction']);
    const speed = parseFloat(String(obs['Wind Speed']));
    if (isNaN(speed)) return;

    // Find the speed range
    const speedRange = getWindSpeedRange(speed);

    // Find the direction row and increment the count
    const directionRow = windData.find(row => String(row.angle) === direction);
    if (directionRow) {
      directionRow[speedRange] = (Number(directionRow[speedRange]) || 0) + 1;
    }
  });

  // Convert to CSV format
  const headers = ['angle', ...speedRanges];
  const csvRows = [headers.join(',')];
  windData.forEach(row => {
    const values = headers.map(header => row[header]);
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
} 