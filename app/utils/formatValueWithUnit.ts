export function formatValueWithUnit(value: any, unit: string): string {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number" || !isNaN(Number(value))) {
      const numValue = Number(value);
      // Special handling for temperature, humidity, wind speeds, and snow depth
      if (unit === "°F" || unit === "%" || unit === "mph") {
        return `${Math.round(numValue)}${unit}`;
      }
      if (unit === "in") {  // For snow depth and precipitation
        return `${numValue.toFixed(2)} ${unit}`;  // Round to 2 decimal places
      }
      return `${numValue.toFixed(1)} ${unit}`;
    }
    return "-";
  }