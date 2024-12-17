export function formatValueWithUnit(value: any, unit: string): string {
  if (value === null || value === undefined) return "-";

  // Handle timestamp formatting for API Fetch Time
  if (unit === "timestamp") {
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
    if (unit === "°F" || unit === "%" || unit === "mph") {
      return `${Math.round(numValue)}${unit}`;
    }
    if (unit === "in") {
      return `${numValue.toFixed(2)} ${unit}`;
    }
    return `${numValue.toFixed(1)} ${unit}`;
  }
  
  return "-";
}