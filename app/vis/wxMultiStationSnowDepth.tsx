import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import moment from 'moment-timezone';
import { formatValueWithUnit } from "@/app/utils/formatValueWithUnit";
import { UnitType } from "@/app/utils/units";
import { 
  graphDimensions, 
  graphColors, 
  svgStyles, 
  legendConfig,
  createScales
} from './utils/graphStyles';

interface StationData {
  [key: string]: any[];
}

interface MultiStationProps {
  stationData: {
    data: any[];
    stationData: StationData;
  };
  isHourly?: boolean;
  isMetric?: boolean;
}

// Generate distinct colors for stations
const stationColors = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

function WxMultiStationSnowDepth({ stationData, isHourly = false, isMetric = false }: MultiStationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!stationData.stationData || !svgRef.current || !containerRef.current) return;

    // Clear previous content
    setIsLoaded(false);
    d3.select(svgRef.current).selectAll('*').remove();

    // Get dimensions
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = graphDimensions.containerHeight;
    const margin = graphDimensions.margin;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Process data for each station
    const processedData = Object.entries(stationData.stationData).map(([stationName, data]) => {
      return {
        stationName,
        data: data.map(d => ({
          date: new Date(`${d.Day} ${d.Hour}`),
          snowDepth: Number(d['Total Snow Depth'].toString().split(' ')[0])
        })).filter(d => !isNaN(d.snowDepth))
      };
    });

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(processedData.flatMap(d => d.data), d => d.date) as [Date, Date])
      .range([0, width])
      .nice();

    const yScale = d3.scaleLinear()
      .domain([
        0,
        (d3.max(processedData.flatMap(d => d.data), d => d.snowDepth) || 0) * 1.2  // Add 10% to max value
      ])
      .range([height, 0])
      .nice();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', containerHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add white background first
    svg.append('rect')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('x', -margin.left)
      .attr('y', -margin.top)
      .attr('fill', 'white');

    // Add title after the white background
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top + 25)  // Slightly adjusted position
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', 'black')  // Explicitly set text color
      .text(`Snow Depth (${isMetric ? 'cm' : 'in'})`);

    // Add grid lines with subtle dotted style (matching wxSnowGraph)
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')  // Creates dotted line effect
      .style('stroke', '#ccc')  // Light gray color
      .style('opacity', 0.3);  // Make it more subtle

    // Create line generator
    const line = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.snowDepth))
      .defined(d => !isNaN(d.snowDepth));

    // Add lines for each station
    processedData.forEach((station, i) => {
      svg.append('path')
        .datum(station.data)
        .attr('fill', 'none')
        .attr('stroke', stationColors[i % stationColors.length])
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d => moment(d as Date).format('MM/DD HH:mm')));

    svg.append('g')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => formatValueWithUnit(d, UnitType.PRECIPITATION, isMetric))
        .tickSize(0)
        .tickPadding(10))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-0.5em');

    // Add legend
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 12)
      .attr('transform', `translate(0,${height + graphDimensions.spacing.legendOffset})`);

    const legendItems = processedData.map((station, i) => ({
      name: station.stationName,
      color: stationColors[i % stationColors.length]
    }));

    const itemWidth = width / legendItems.length;
    legendItems.forEach((item, i) => {
      const g = legend.append('g')
        .attr('transform', `translate(${i * itemWidth},0)`);
      
      g.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', item.color);

      g.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('fill', 'black')
        .text(item.name);
    });

    setIsLoaded(true);
  }, [stationData, isHourly, isMetric]);

  return (
    <div 
      ref={containerRef} 
      className={`graph-container bg-white p-4 rounded-xl shadow-md transition-opacity duration-500 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={svgStyles.container}
    >
      <svg 
        ref={svgRef}
        style={svgStyles.svg}
      />
    </div>
  );
}

export default WxMultiStationSnowDepth; 