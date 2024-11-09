import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import moment from 'moment-timezone';

interface HourlyAverage {
  [key: string]: string | number;
}

interface SnowGraphProps {
  hourAverages: {
    data: HourlyAverage[];
    title: string;
  };
}

function HourWxSnowGraph({ hourAverages }: SnowGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!hourAverages.data.length || !svgRef.current) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Process data
    const data = hourAverages.data
      .map((d) => ({
        date: moment(d.Day + ' ' + d.Hour, 'MMM D h:mm A').toDate(),
        totalSnowDepth: parseFloat(
          String(d['Total Snow Depth']).replace(' in', '')
        ),
        snowDepth24h: parseFloat(
          String(d['24h Snow Depth']).replace(' in', '')
        ),
      }))
      .filter(
        (d) => !isNaN(d.totalSnowDepth) || !isNaN(d.snowDepth24h)
      );

    // Setup dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data, (d) =>
          Math.max(d.totalSnowDepth, d.snowDepth24h)
        ) || 0,
      ])
      .range([height, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Add axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    svg
      .append('g')
      .call(yAxis)
      .append('text')
      .attr('fill', '#000')
      .attr('y', -20)
      .attr('x', -height / 2)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .text('Snow Depth (in)');

    // Create line for Total Snow Depth
    const line = d3
      .line<(typeof data)[0]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.totalSnowDepth));

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'blue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    // Create bars for 24h Snow Depth
    svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.date) - 3)
      .attr('y', (d) => yScale(Math.max(0, d.snowDepth24h)))
      .attr('width', 6)
      .attr(
        'height',
        (d) => height - yScale(Math.max(0, d.snowDepth24h))
      )
      .attr('fill', '#4169E1')
      .attr('opacity', 0.7);

    // Add legend
    const legend = svg
      .append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'start')
      .selectAll('g')
      .data(['Total Snow Depth', '24h Snow Depth'])
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(0,${i * 20})`);

    legend
      .append('rect')
      .attr('x', width - 19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', (d, i) => (i === 0 ? 'blue' : '#4169E1'))
      .attr('opacity', (d, i) => (i === 0 ? 1 : 0.7));

    legend
      .append('text')
      .attr('x', width - 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text((d) => d);
  }, [hourAverages]);

  return (
    <div className="graph-container">
      <h3>{hourAverages.title}</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default HourWxSnowGraph;
