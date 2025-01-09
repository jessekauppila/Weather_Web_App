import { UnitType, UNITS } from "./units";

export function formatValueWithUnit(value: any, unitType: UnitType, isMetric: boolean = false): string {
  if (value === null || value === undefined) return "-";

  // Get the appropriate unit label based on metric/imperial setting
  const unit = UNITS[unitType][isMetric ? 'metric' : 'imperial'];
  
  // Log to verify unit selection

  // Handle timestamp formatting for API Fetch Time
  if (unitType === UnitType.TIMESTAMP) {
    try {
      const date = new Date(value);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return "-";
    }
  }

  // Handle numeric values
  if (typeof value === "number" || !isNaN(Number(value))) {
    const numValue = Number(value);
    
    if (unitType === UnitType.PRECIPITATION) {
      return `${numValue.toFixed(2)}${unit}`;
    }
    if (unitType === UnitType.TEMPERATURE || 
        unitType === UnitType.WIND_SPEED || 
        unitType === UnitType.HUMIDITY ||
        unitType === UnitType.ELEVATION) {
      return `${Math.round(numValue)}${unit}`;
    }
    return `${numValue.toFixed(1)}${unit}`;
  }
  
  return "-";
}