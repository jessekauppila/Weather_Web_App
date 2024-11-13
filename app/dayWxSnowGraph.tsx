import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import moment from 'moment-timezone';

interface DailyAverage {
  [key: string]: string | number;
}

interface SnowGraphProps {
  dayAverages: {
    data: DailyAverage[];
    title: string;
  };
}

function DayWxSnowGraph({ dayAverages }: SnowGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!dayAverages.data.length || !svgRef.current) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Process data
    const data = dayAverages.data
      .map((d) => ({
        date: moment(d.Day, 'MMM D').toDate(),
        totalSnowDepth: parseFloat(String(d['Total Snow Depth']).replace(' in', '')),
        snowDepth24h: parseFloat(String(d['24h Snow Depth']).replace(' in', '')),
        precipHour: parseFloat(String(d['Precip Accum One Hour']).replace(' in', ''))
      }))
      .filter(d => !isNaN(d.totalSnowDepth) || !isNaN(d.snowDepth24h) || !isNaN(d.precipHour));

    // Setup dimensions
    const margin = { top: 20, right: 60, bottom: 30, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.totalSnowDepth, d.snowDepth24h, d.precipHour)) || 0])
      .range([height, 0]);

    // Create line for Total Snow Depth
    const line = d3.line<(typeof data)[0]>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.totalSnowDepth));

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d => moment(d as Date).format('MM/DD')));

    svg.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('fill', '#000')
      .attr('y', -50)
      .attr('x', -height / 2)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .text('Snow/Precip (in)');

    // Add total snow depth line
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'blue')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add 24h snow depth bars
    svg.selectAll('.snow-bars')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'snow-bars')
      .attr('x', d => xScale(d.date) - 8)
      .attr('y', d => yScale(d.snowDepth24h))
      .attr('width', 8)
      .attr('height', d => height - yScale(d.snowDepth24h))
      .attr('fill', '#4169E1')
      .attr('opacity', 0.7);

    // Add hourly precip bars
    svg.selectAll('.precip-bars')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'precip-bars')
      .attr('x', d => xScale(d.date))
      .attr('y', d => yScale(d.precipHour))
      .attr('width', 8)
      .attr('height', d => height - yScale(d.precipHour))
      .attr('fill', '#82EEFD')
      .attr('opacity', 0.7);

    // Add legend
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(['Total Snow Depth', '24h Snow Depth', 'Hourly Precip'])
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(${width},${i * 20})`);

    legend.append('rect')
      .attr('x', -19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', (d, i) => i === 0 ? 'blue' : i === 1 ? '#4169E1' : '#82EEFD')
      .attr('opacity', 0.7);

    legend.append('text')
      .attr('x', -24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(d => d);

  }, [dayAverages]);

  return (
    <div className="graph-container">
      <h3>{dayAverages.title}</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default DayWxSnowGraph;