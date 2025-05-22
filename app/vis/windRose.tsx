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
  


  // Process the data into the format expected by the windrose
  const processedData = useMemo(() => {
    // Define wind speed ranges
    const speedRanges = [
      '0 to .6', '.6 to 16.2', '16.2 to 25.5', '25.5 to 37.3', '37.3 to 150'
    ];

    // [0, .6], [.6, 16.2], [16.2, 25.5], [25.5, 37.3], [37.3, 500]


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
  const MAX_SIZE = 1500; // Maximum size for the wind rose
  const width = Math.min(1500, MAX_SIZE);
  const height = Math.min(500, MAX_SIZE);
  const margin = { top: 10, right: 500, bottom: 100, left: 40 };
  const innerRadius = 30;
  const outerRadius = Math.min(
    width - margin.left - margin.right,
    height - margin.top - margin.bottom
  ) / 2;

  useEffect(() => {
    if (!svgRef.current || processedData === undefined || processedData === null) {
      return;
    }

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create the SVG with viewBox for responsive scaling
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("font-family", "sans-serif")
      .style("max-width", `${MAX_SIZE}px`)
      .style("width", "100%")
      .style("height", "auto");

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

    // Create scales
    const x = d3.scaleBand()
      .range([0, 2 * Math.PI])
      .domain(parsedData.map(d => d.angle))
      .align(0);

    const y = d3.scaleLinear()
      .range([innerRadius, outerRadius])
      .domain([0, d3.max(parsedData, d => d.total) || 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(parsedData.columns.slice(1).map(String))
      //.range(d3.schemeBlues[parsedData.columns.length - 1]);
      .range(['#FFFFFF','#FFD5D5', '#E39E9E', '#F27272', '#F80707']);

    

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

    // Add the y-axis circles and their labels
    g.append("g")
      .attr("class", "yAxis")
      .selectAll("g")
      .data(y.ticks(5))
      .join("g")
      .call((selection: d3.Selection<d3.BaseType | SVGGElement, number, SVGGElement, unknown>) => {
        // Add the circle
        selection.append("circle")
          .attr("fill", "none")
          .attr("stroke", "gray")
          .attr("stroke-dasharray", "4,4")
          .attr("r", y);

        // Add the label
        selection.append("text")
          .attr("x", 0)
          .attr("y", d => -y(d)) // Position above the circle
          .attr("dy", "-.25em") // Small offset from the circle
          .attr("text-anchor", "middle")
          .attr("fill", "var(--app-text-primary)")
          .attr("font-size", "10px")
          .text(d => `${d} hrs`); // Show the value
      });

    // Add the legend
    g.append("g")
      .selectAll("g")
      .data(parsedData.columns.slice(1).reverse())
      .join("g")
        .attr("transform", (d: string | number | symbol, i: number) => 
          `translate(${outerRadius + 50},${-outerRadius + 25 + (i - (parsedData.columns.length - 1) / 3) * 20})`)
        .call((g: d3.Selection<d3.BaseType | SVGGElement, string | number | symbol, SVGGElement, unknown>) => g.append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", (d: string | number | symbol) => colorScale(String(d)) as string)
          .attr("stroke", "dimgray")
          .attr("stroke-width", 0.5))
        .call((g: d3.Selection<d3.BaseType | SVGGElement, string | number | symbol, SVGGElement, unknown>) => g.append("text")
          .attr("x", 18)
          .attr("y", 6)
          .attr("dy", "0.35em")
          .style("font-size", "10px")
          .style("font-weight", "normal")
          .style("fill", "var(--app-text-secondary)")
          .each(function(d: string | number | symbol) {
            const range = String(d);
            const [min, max] = range.split(' to ').map(Number);
            const description = getWindDescription(min, max);
            d3.select(this)
              .text(`${min}-${max} mph `)
              .append("tspan")
              .style("font-weight", "bold")
              .text(description);
          })
          .style("font-size", 9));

    // Helper function to get wind speed description
    function getWindDescription(min: number, max: number): string {
      if (min < .6) return "Calm";
      if (min < 16.2) return "Light";
      if (min < 25.2) return "Moderate";
      if (min < 37.3) return "Strong";
      return "Extreme";
    }

    // const getWindStrengthWithRange = (speed: number) => {
    //     if (speed <= 0.6) return 'Calm (≤ 0.6 mph)';
    //     else if (speed <= 16.2) return 'Light (0.6-16.2 mph)';
    //     else if (speed <= 25.5) return 'Moderate (16.2-25.5 mph)';
    //     else if (speed <= 37.3) return 'Strong (25.5-37.3 mph)';
    //     else return 'Extreme (> 37.3 mph)';
    //   };
      



    //Add annotations
    const annotation = g.append("g")
      .attr("class", "annotations")
      .attr("transform", `translate(${outerRadius + 50},${-outerRadius + 220 + (parsedData.columns.length) * 20})`)
      .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dy", "1.2em")
        .style("font-size", "9px")
        .style("fill", "var(--app-text-secondary)");

    annotation
      .append("tspan")
        .attr("x", 0)
        .attr("dy", "1.2em")
        .style("font-weight", "bold")
        .text("Extreme ")
      .append("tspan")
        .style("font-weight", "normal")
        .text("(Gale force or higher; difficulty in walking and slight to considerable structural damage.)");

    annotation
      .append("tspan")
        .attr("x", 0)
        .attr("dy", "1.2em")
        .style("font-weight", "bold")
        .text("Strong ")
      .append("tspan")
        .style("font-weight", "normal")
        .text("(Strong breeze; whole trees in motion and snow drifting.)");

    annotation
      .append("tspan")
        .attr("x", 0)
        .attr("dy", "1.2em")
        .style("font-weight", "bold")
        .text("Moderate ")
      .append("tspan")
        .style("font-weight", "normal")
        .text("(Fresh breeze; small trees sway, flags stretched and snow begins to drift.)");

    annotation
      .append("tspan")
        .attr("x", 0)
        .attr("dy", "1.2em")
        .style("font-weight", "bold")
        .text("Light ")
      .append("tspan")
        .style("font-weight", "normal")
        .text("(Light to gentle breeze; flags and twigs in motion.)");

    annotation
      .append("tspan")
        .attr("x", 0)
        .attr("dy", "1.2em")
        .style("font-weight", "bold")
        .text("Calm ")
      .append("tspan")
        .style("font-weight", "normal")
        .text("(No air motion; smoke rises vertically.)");

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
    [0, .6], [.6, 16.2], [16.2, 25.5], [25.5, 37.3], [37.3, 500]
    // [0, .6], [.6, 16.2], [16.2, 25.5], [25.5, 37.3], [37.3, 500],
    // [10, 12], [12, 14], [14, 16], [16, 18]
    
  ];

      // const getWindStrengthWithRange = (speed: number) => {
    //     if (speed <= 0.6) return 'Calm (≤ 0.6 mph)';
    //     else if (speed <= 16.2) return 'Light (0.6-16.2 mph)';
    //     else if (speed <= 25.5) return 'Moderate (16.2-25.5 mph)';
    //     else if (speed <= 37.3) return 'Strong (25.5-37.3 mph)';
    //     else return 'Extreme (> 37.3 mph)';
    //   };
  
  for (const [min, max] of ranges) {
    if (speed >= min && speed < max) {
      return `${min} to ${max}`;
    }
  }
  return '>37.3';
}

export default WindRose;