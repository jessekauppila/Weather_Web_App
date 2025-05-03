// Helper function to interpolate between two colors
export const interpolateColor = (color1: [number, number, number], color2: [number, number, number], factor: number): [number, number, number] => {
  return color1.map((c1, i) => Math.round(c1 + (color2[i] - c1) * factor)) as [number, number, number];
};

// Helper function to get color based on temperature
export const getTemperatureColor = (temp: number | null): [number, number, number] => {
  if (temp === null || isNaN(temp)) return [0, 0, 0];
  
  // Define color stops
  const black: [number, number, number] = [11, 11, 11]; // 0B0B0B
  const blue: [number, number, number] = [27, 163, 226]; // 1BA3E2
  const yellow: [number, number, number] = [222, 241, 13]; // DEF10D
  const orange: [number, number, number] = [247, 191, 7]; // F7BF07

  // First gradient: black to blue (9°F to 31°F)
  if (temp < 9) return black;
  if (temp <= 31) {
    const factor = (temp - 9) / (31 - 9);
    return interpolateColor(black, blue, factor);
  }
  
  // Second gradient: blue to yellow (31°F to 35°F)
  if (temp <= 35) {
    const factor = (temp - 31) / (35 - 31);
    return interpolateColor(blue, yellow, factor);
  }
  
  // Third gradient: yellow to orange (35°F to 60°F)
  if (temp <= 60) {
    const factor = (temp - 35) / (60 - 35);
    return interpolateColor(yellow, orange, factor);
  }
  
  // Above 60°F, use orange
  return orange;
}; 