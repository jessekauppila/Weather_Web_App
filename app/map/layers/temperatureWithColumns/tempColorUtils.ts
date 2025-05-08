// Helper function to interpolate between two colors
export const interpolateColor = (color1: [number, number, number], color2: [number, number, number], factor: number): [number, number, number] => {
  return color1.map((c1, i) => Math.round(c1 + (color2[i] - c1) * factor)) as [number, number, number];
};

// Helper function to get color based on temperature
export function getTemperatureColor(temp: number | null): [number, number, number] {
  if (temp === null || isNaN(temp)) return [0, 0, 0];
  
  // Define color stops
  const purple: [number, number, number] = [55, 0, 195]; // 3700C3
  const darkBlue: [number, number, number] = [55, 0, 195]; // 3700C3
  const blue: [number, number, number] = [55, 0, 195]; // 3700C3
  const lightBlue: [number, number, number] = [0, 149, 255]; // 0095FF
  const blue31: [number, number, number] = [0, 174, 255]; // 00AEFF
  const blue32: [number, number, number] = [56, 194, 191]; // 38C2BF
  const blue33: [number, number, number] = [111, 215, 128]; // 6FD780
  const blue34: [number, number, number] = [167, 235, 64]; // A7EB40
  const blue35: [number, number, number] = [222, 255, 0]; // DEFF00
  const blue36: [number, number, number] = [228, 255, 0]; // E4FF00
  const yellow: [number, number, number] = [228, 255, 0]; // E4FF00
  const orange: [number, number, number] = [255, 229, 0]; // FFE500
  const darkOrange: [number, number, number] = [255, 195, 0]; // FFC300
  const red: [number, number, number] = [255, 0, 0]; // FF0000

  // Temperature ranges and their corresponding colors
  if (temp < -9) return purple;
  if (temp <= 0) {
    const factor = (temp + 9) / (9);
    return interpolateColor(purple, darkBlue, factor);
  }
  if (temp <= 10) {
    const factor = (temp ) / (10 );
    return interpolateColor(darkBlue, blue, factor);
  }
  if (temp <= 20) {
    const factor = (temp - 10) / (10);
    return interpolateColor(blue, lightBlue, factor);
  }
  if (temp <= 31) {
    const factor = (temp - 20) / (31 - 20);
    return interpolateColor(lightBlue, blue31, factor);
  }
  if (temp <= 32) return blue32;
  if (temp <= 33) return blue33;
  if (temp <= 34) return blue34;
  if (temp <= 35) return blue35;
  if (temp <= 36) return blue36;
  if (temp <= 40) {
    const factor = (temp - 36) / (40 - 36);
    return interpolateColor(blue36, yellow, factor);
  }
  if (temp <= 50) {
    const factor = (temp - 40) / (50 - 40);
    return interpolateColor(yellow, orange, factor);
  }
  if (temp <= 60) {
    const factor = (temp - 50) / (60 - 50);
    return interpolateColor(orange, darkOrange, factor);
  }
  if (temp <= 120) {
    const factor = (temp - 60) / (120 - 60);
    return interpolateColor(darkOrange, red, factor);
  }
  return red;
} 