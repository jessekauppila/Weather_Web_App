// app/vis/windRose.tsx
import React, { useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface WindRoseProps {
  data: Array<{
    'Wind Speed': string | number;
    'Wind Direction': string | number;
    [key: string]: any;
  }>;
  stationName: string;
}

interface WindRoseData {
  angle: string;
  total: number;
  [key: string]: any;
}

const WindRose: React.FC<WindRoseProps> = ({ data, stationName }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  console.log('WindRose received data:', data);
  console.log('Station name:', stationName);

  // Process the data into the format expected by the windrose
  const processedData = useMemo(() => {
    // Define wind speed ranges
    const speedRanges = [
      '0 to 2', '2 to 4', '4 to 6', '6 to 8', '8 to 10',
      '10 to 12', '12 to 14', '14 to 16', '16 to 18'
    ];

    // Define wind directions (16 points)
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

    // Initialize the data structure
    const windData = directions.map(direction => {
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
      let speedRange = '16 to 18';
      for (const range of speedRanges) {
        const [min, max] = range.split(' to ').map(Number);
        if (speed >= min && speed < max) {
          speedRange = range;
          break;
        }
      }

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
  }, [data]);

  // Constants for the visualization
  const width = 600;
  const height = 600;
  const margin = { top: 40, right: 80, bottom: 40, left: 40 };
  const innerRadius = 30;
  const outerRadius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;

  useEffect(() => {
    console.log('useEffect triggered with processedData:', processedData);
    if (!svgRef.current || processedData === undefined || processedData === null) {
      console.log('Early return - missing ref or data');
      return;
    }

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create the SVG
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("font-family", "sans-serif");

    // Create the main group and center it
    const g = svg.append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    // Parse the CSV data
    const parsedData = d3.csvParse(processedData, (d: any) => {
      let t = 0;
      for (let i = 1; i < Object.keys(d).length; ++i) {
        t += +d[Object.keys(d)[i]];
      }
      d.total = t;
      return d;
    });
    console.log('Parsed CSV data:', parsedData);

    // Create scales
    const x = d3.scaleBand()
      .range([0, 2 * Math.PI])
      .domain(parsedData.map(d => d.angle))
      .align(0);
    console.log('X scale domain:', x.domain());

    const y = d3.scaleLinear()
      .range([innerRadius, outerRadius])
      .domain([0, d3.max(parsedData, d => d.total) || 0]);
    console.log('Y scale domain:', y.domain());

    const colorScale = d3.scaleOrdinal()
      .domain(parsedData.columns.slice(1).map(String))
      .range(d3.schemeBlues[parsedData.columns.length - 1]);
    console.log('Color scale domain:', colorScale.domain());

    // Create the arc generator
    const makeArc = d3.arc<d3.SeriesPoint<{ [key: string]: number }>>()
      .innerRadius(d => y(d[0]))
      .outerRadius(d => y(d[1]))
      .startAngle(d => Number(x(String(d.data.angle))) ?? 0)
      .endAngle(d => (Number(x(String(d.data.angle))) ?? 0) + x.bandwidth())
      .padAngle(0.02)
      .padRadius(innerRadius);

    // Create the stacked data
    const stackedData = d3.stack()
      .keys(parsedData.columns.slice(1).map(String))(parsedData);

    // Add the axes
    g.append("g")
      .attr("class", "axes")
      .selectAll(".axis")
      .data(d3.range(0, 360, 360/parsedData.length))
      .join("g")
        .attr("class", "axis")
        .attr("transform", (d: number) => `rotate(${d - 90})`)
        .append("line")
          .attr("x1", innerRadius)
          .attr("x2", y(y.ticks(5).reverse()[0]))
          .attr("fill", "none")
          .attr("stroke", "gray")
          .attr("stroke-dasharray", "1,4");

    // Add the rings
    g.append("g")
      .attr("class", "rings")
      .selectAll(".ring")
      .data(stackedData)
      .join("g")
        .attr("fill", (d: d3.Series<{ [key: string]: number }, string>) => colorScale(d.key) as string)
        .selectAll("path")
        .data((d: d3.Series<{ [key: string]: number }, string>) => d)
        .join("path")
          .attr("d", makeArc)
          .attr("transform", `rotate(${-360.0/parsedData.length/2.0})`);

    // Add direction labels
    const label = g.append("g")
      .attr("class", "direction-labels")
      .selectAll("g")
      .data(parsedData)
      .join("g")
        .attr("text-anchor", "middle")
        .attr("transform", (d: WindRoseData) => 
          `rotate(${(Number(x(d.angle) ?? 0) + x.bandwidth() / 2) * 180 / Math.PI - (90 - (-360.0/parsedData.length/2.0))}) 
           translate(${outerRadius + 20},0)`);

    const inLowerHalf = (d: any) => {
      const angle = x(d.angle);
      return angle !== undefined ? (angle + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI : false;
    };

    // Helper function to determine label size
    const getLabelSize = (direction: string): number => {
      const primaryDirections = ['N', 'E', 'S', 'W'];
      const secondaryDirections = ['NE', 'SE', 'SW', 'NW'];
      
      if (primaryDirections.includes(direction)) return 18;
      if (secondaryDirections.includes(direction)) return 14;
      return 12;
    };

    label.append("text")
      .attr("transform", (d: WindRoseData) => inLowerHalf(d) ? "rotate(90)translate(0,6)" : "rotate(-90)translate(0,6)")
      .text((d: WindRoseData) => d.angle)
      .attr("font-weight", (d: WindRoseData) => {
        const primaryDirections = ['N', 'E', 'S', 'W'];
        const secondaryDirections = ['NE', 'SE', 'SW', 'NW'];
        if (primaryDirections.includes(d.angle)) return 700;
        if (secondaryDirections.includes(d.angle)) return 600;
        return 500;
      })
      .attr("font-size", (d: WindRoseData) => getLabelSize(d.angle))
      .attr("fill", "var(--app-text-primary)")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");

    // Add the y-axis circles
    g.append("g")
      .attr("class", "yAxis")
      .selectAll("g")
      .data(y.ticks(5))
      .join("g")
      .call((selection: d3.Selection<d3.BaseType | SVGGElement, number, SVGGElement, unknown>) => {
        selection.append("circle")
          .attr("fill", "none")
          .attr("stroke", "gray")
          .attr("stroke-dasharray", "4,4")
          .attr("r", y);
      });

    // Add the legend
    g.append("g")
      .selectAll("g")
      .data(parsedData.columns.slice(1).reverse())
      .join("g")
        .attr("transform", (d: string | number | symbol, i: number) => 
          `translate(${outerRadius + 30},${-outerRadius + 40 + (i - (parsedData.columns.length - 1) / 3) * 20})`)
        .call((g: d3.Selection<d3.BaseType | SVGGElement, string | number | symbol, SVGGElement, unknown>) => g.append("rect")
          .attr("width", 18)
          .attr("height", 18)
          .attr("fill", (d: string | number | symbol) => colorScale(String(d)) as string)
          .attr("stroke", "dimgray")
          .attr("stroke-width", 0.5))
        .call((g: d3.Selection<d3.BaseType | SVGGElement, string | number | symbol, SVGGElement, unknown>) => g.append("text")
          .attr("x", 24)
          .attr("y", 9)
          .attr("dy", "0.35em")
          .text((d: string | number | symbol) => `${String(d)} km/h`)
          .style("font-size", 13));

  }, [processedData, width, height, innerRadius, outerRadius]);

  return (
    <div className="windrose-container">
      <h3 className="text-lg font-semibold mb-4">{stationName} Wind Rose</h3>
      <svg ref={svgRef} />
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