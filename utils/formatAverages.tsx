// weatherWidgetData/utils/formatAverages.tsx

// Define the Unit Conversion Types
export enum UnitConversionType {
  MetersToInches = 'meters',
  CelsiusToFahrenheit = 'celsius',
  MetersPerSecondToMph = 'm/s',
  WattPerSquareMeterToBtu = 'W/m²',
  // Add other conversion types as needed
}

// Interface for Averages Object
export interface Averages {
  [key: string]: string | number;
}

// Interface for Unit Conversions Mapping
export interface UnitConversions {
  [key: string]: UnitConversionType;
}

// Mapping Conversion Types to Their Respective Unit Labels
const unitLabels: Record<UnitConversionType, string> = {
  [UnitConversionType.MetersToInches]: 'in',
  [UnitConversionType.CelsiusToFahrenheit]: '°F',
  [UnitConversionType.MetersPerSecondToMph]: 'mph',
  [UnitConversionType.WattPerSquareMeterToBtu]: 'Btu/h·ft²',
  // Add other unit labels as needed
};

/**
 * Formats the averages data by appending unit labels to numerical values based on unitConversions.
 * Non-numerical values or fields without specified unit conversions remain unchanged.
 *
 * @param averages - The averages object containing various weather metrics.
 * @param unitConversions - A mapping of fields to their respective unit conversion types.
 * @returns A new averages object with formatted string values including unit labels.
 */

export function formatAveragesData(
  averages: Averages,
  unitConversions: UnitConversions
): Averages {
  // Create a shallow copy to avoid mutating the original object
  const formattedAverages: Averages = { ...averages };

  Object.keys(unitConversions).forEach((key) => {
    const conversionType = unitConversions[key];
    const unitLabel = unitLabels[conversionType];
    const value = averages[key];

    // Only format numerical values
    if (value !== undefined && typeof value === 'number') {
      formattedAverages[key] = `${value} ${unitLabel}`;
    }
  });

  return formattedAverages;
}
