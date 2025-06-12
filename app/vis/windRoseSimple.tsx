import React, { useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { processWindRoseData, WIND_SPEED_RANGES, getLabelSize, getLabelWeight } from './windRoseUtils';

interface WindRoseSimpleProps {
  data: Array<{
    'Wind Speed': string | number;
    'Wind Direction': string | number;
    [key: string]: any;
  }>;
  stationName: string;
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
}

interface WindRoseData {
  angle: string;
  total: number;
  [key: string]: any;
}

const WindRoseSimple: React.FC<WindRoseSimpleProps> = ({ 
  data, 
  stationName, 
  size = 'medium',
  showTitle = true 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Process the data using shared utility
  const processedData = useMemo(() => {
    return processWindRoseData(data);
  }, [data]);

  // Size configurations
  const sizeConfigs = {
    small: { maxSize: 400, width: 400, height: 300, margin: { top: 10, right: 120, bottom: 50, left: 20 } },
    medium: { maxSize: 600, width: 600, height: 400, margin: { top: 10, right: 200, bottom: 70, left: 30 } },
    large: { maxSize: 1000, width: 1000, height: 600, margin: { top: 10, right: 350, bottom: 100, left: 40 } }
  };

  const config = sizeConfigs[size];
  const { width, height, margin } = config;
  const innerRadius = size === 'small' ? 20 : size === 'medium' ? 25 : 30;
  const outerRadius = Math.min(
    width - margin.left - margin.right,
    height - margin.top - margin.bottom
  ) / 2;

  useEffect(() => {
    if (!svgRef.current || !processedData) {
      return;
    }

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create the SVG with viewBox for responsive scaling
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("font-family", "sans-serif")
      .style("max-width", `${config.maxSize}px`)
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
      .domain(WIND_SPEED_RANGES.map(r => r.label))
      .range(WIND_SPEED_RANGES.map(r => r.color));

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
           translate(${outerRadius + (size === 'small' ? 15 : 20)},0)`);

    const inLowerHalf = (d: any) => {
      const angle = x(d.angle);
      return angle !== undefined ? (angle + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI : false;
    };

    // Scale label sizes based on wind rose size
    const labelSizeMultiplier = size === 'small' ? 0.7 : size === 'medium' ? 0.85 : 1;

    label.append("text")
      .attr("transform", (d: WindRoseData) => inLowerHalf(d) ? "rotate(90)translate(0,6)" : "rotate(-90)translate(0,6)")
      .text((d: WindRoseData) => d.angle)
      .attr("font-weight", (d: WindRoseData) => getLabelWeight(d.angle))
      .attr("font-size", (d: WindRoseData) => getLabelSize(d.angle) * labelSizeMultiplier)
      .attr("fill", "var(--app-text-primary)")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");

    // Add the y-axis circles and their labels
    const tickSize = size === 'small' ? 3 : size === 'medium' ? 4 : 5;
    g.append("g")
      .attr("class", "yAxis")
      .selectAll("g")
      .data(y.ticks(tickSize))
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
          .attr("y", d => -y(d))
          .attr("dy", "-.25em")
          .attr("text-anchor", "middle")
          .attr("fill", "var(--app-text-primary)")
          .attr("font-size", `${8 + (size === 'large' ? 2 : size === 'medium' ? 1 : 0)}px`)
          .text(d => `${d} hrs`);
      });

  }, [processedData, width, height, innerRadius, outerRadius, size]);

  return (
    <div className="windrose-simple-container">
      {showTitle && (
        <h3 className={`font-semibold mb-2 ${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-lg'}`}>
          {stationName} Wind Rose
        </h3>
      )}
      <svg ref={svgRef} />
    </div>
  );
};

export default WindRoseSimple; 