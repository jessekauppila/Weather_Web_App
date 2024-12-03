//No Longer Being Used

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import moment from 'moment-timezone';
import { Tooltip } from 'react-tooltip';

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
    const margin = { top: 20, right: 60, bottom: 30, left: 60 };
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

    const yScaleLeft = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data, (d) =>
          Math.max(d.totalSnowDepth, d.snowDepth24h)
        ) || 0,
      ])
      .range([height, 0]);

    const yScaleRight = yScaleLeft.copy();

    // Create grid lines
    const gridLines = d3
      .axisLeft(yScaleLeft)
      .tickSize(-width)
      .tickFormat(() => '')
      .ticks(10);

    // Add grid lines
    svg
      .append('g')
      .attr('class', 'grid')
      .call(gridLines)
      .style('stroke', '#e0e0e0')
      .style('stroke-opacity', 0.7);

    // Create axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => moment(d as Date).format('MM/DD HH:mm'));
    const yAxisLeft = d3.axisLeft(yScaleLeft);
    const yAxisRight = d3.axisRight(yScaleRight);

    // Add axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    svg
      .append('g')
      .call(yAxisLeft)
      .append('text')
      .attr('fill', '#000')
      .attr('y', -50)
      .attr('x', -height / 2)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .text('Snow Depth (in)');

    svg
      .append('g')
      .attr('transform', `translate(${width},0)`)
      .call(yAxisRight);

    // Create line for Total Snow Depth
    const line = d3
      .line<(typeof data)[0]>()
      .x((d) => xScale(d.date))
      .y((d) => yScaleLeft(d.totalSnowDepth));

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'blue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    // Create bars for 24h Snow Depth
    const bars = svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.date) - 3)
      .attr('y', (d) => yScaleLeft(Math.max(0, d.snowDepth24h)))
      .attr('width', 6)
      .attr(
        'height',
        (d) => height - yScaleLeft(Math.max(0, d.snowDepth24h))
      )
      .attr('fill', '#4169E1')
      .attr('opacity', 0.7);

    // Add tooltip functionality
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'snow-graph-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', '1px solid #ddd')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none');

    // Add invisible overlay for better tooltip interaction
    const bisect = d3.bisector((d: (typeof data)[0]) => d.date).left;

    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function (event) {
        const x0 = xScale.invert(d3.pointer(event, this)[0]);
        const i = bisect(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d =
          x0.getTime() - d0.date.getTime() >
          d1.date.getTime() - x0.getTime()
            ? d1
            : d0;

        tooltip
          .style('opacity', 1)
          .html(
            `
            <div style="font-weight: bold">${moment(d.date).format(
              'MM/DD/YYYY HH:mm'
            )}</div>
            <div>Total Snow Depth: ${d.totalSnowDepth.toFixed(
              1
            )} in</div>
            <div>24h Snow Depth: ${d.snowDepth24h.toFixed(1)} in</div>
          `
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        tooltip.style('opacity', 0);
      });

    // Add legend
    const legend = svg
      .append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(['Total Snow Depth', '24h Snow Depth'])
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(${width},${i * 20})`);

    legend
      .append('rect')
      .attr('x', -19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', (d, i) => (i === 0 ? 'blue' : '#4169E1'))
      .attr('opacity', (d, i) => (i === 0 ? 1 : 0.7));

    legend
      .append('text')
      .attr('x', -24)
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
