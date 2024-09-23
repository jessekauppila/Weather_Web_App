function wxTableDataConversion(
  observationsData: Array<any>,
  unitConversions: Record<string, string>
) {
  return observationsData
    .map((data) => {
      const convertedData: Record<string, any> = { ...data };

      // Iterate through each key in unitConversions
      Object.keys(unitConversions).forEach((key) => {
        const conversionType = unitConversions[key];
        const value = data[key];

        if (value !== undefined) {
          if (Array.isArray(value)) {
            // Handle array of numbers
            convertedData[key] = value.map((item) => {
              if (typeof item === 'number') {
                return convertValue(item, conversionType);
              }
              return item;
            });
          } else if (typeof value === 'number') {
            // Handle single number
            convertedData[key] = convertValue(value, conversionType);
          }
        }
      });

      return convertedData;
    })
    .flat(); // Flatten the array if necessary
}

// Helper function to handle conversions based on type
function convertValue(value: number, type: string): number {
  switch (type) {
    case 'meters':
      return value * 39.3701; // Convert meters to inches
    case 'celsius':
      return (value * 9) / 5 + 32; // Convert Celsius to Fahrenheit
    case 'm/s':
      return value * 2.23694; // Convert m/s to mph
    case 'W/m²':
      return value * 0.316998; // Convert W/m² to Btu/h·ft²
    default:
      return value; // No conversion
  }
}

export default wxTableDataConversion;
