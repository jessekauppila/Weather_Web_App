import React, { useMemo } from 'react';
import * as d3 from 'd3';

interface WindRoseProps {
  data: Array<{
    'Wind Speed': string | number;
    'Wind Direction': string | number;
    [key: string]: any;
  }>;
  stationName: string;
}

const WindRose: React.FC<WindRoseProps> = ({ data, stationName }) => {
  // Process the data into the format expected by the windrose
  const processedData = useMemo(() => {
    // Group data by direction and speed
    const groupedData = data.reduce((acc, record) => {
      const speed = parseFloat(record['Wind Speed'] as string);
      const direction = parseFloat(record['Wind Direction'] as string);
      
      // Convert direction to cardinal direction
      const cardinalDirection = getCardinalDirection(direction);
      
      // Determine speed range
      const speedRange = getSpeedRange(speed);
      
      if (!acc[cardinalDirection]) {
        acc[cardinalDirection] = {};
      }
      if (!acc[cardinalDirection][speedRange]) {
        acc[cardinalDirection][speedRange] = 0;
      }
      acc[cardinalDirection][speedRange]++;
      
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Convert to CSV format
    const speedRanges = ['0 to 2', '2 to 4', '4 to 6', '6 to 8', '8 to 10', '10 to 12', '12 to 14', '14 to 16', '16 to 18'];
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    
    const csvRows = [
      ['angle', ...speedRanges.map(range => `${range} km/h`)].join(','),
      ...directions.map(dir => {
        const row = [dir];
        speedRanges.forEach(range => {
          const count = groupedData[dir]?.[range] || 0;
          row.push((count / data.length * 100).toFixed(1));
        });
        return row.join(',');
      })
    ];

    return csvRows.join('\n');
  }, [data]);

  // Render the windrose using the Observable code
  return (
    <div className="windrose-container">
      <h3 className="text-lg font-semibold mb-4">{stationName} Wind Rose</h3>
      <div id="windrose" />
    </div>
  );
};

// Helper function to convert degrees to cardinal direction
function getCardinalDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Helper function to determine speed range
function getSpeedRange(speed: number): string {
  const ranges = [
    [0, 2], [2, 4], [4, 6], [6, 8], [8, 10],
    [10, 12], [12, 14], [14, 16], [16, 18]
  ];
  
  for (const [min, max] of ranges) {
    if (speed >= min && speed < max) {
      return `${min} to ${max}`;
    }
  }
  return '16 to 18';
}

export default WindRose;