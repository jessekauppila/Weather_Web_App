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

    // Process data and filter out invalid values
    const data = dayAverages.data
      .map((d) => ({
        date: moment(d.Day, 'MMM D').toDate(),
        totalSnowDepth: parseFloat(String(d['Total Snow Depth']).replace(' in', '')) || 0,
        snowDepth24h: parseFloat(String(d['24h Snow Depth']).replace(' in', '')) || 0,
        precipHour: parseFloat(String(d['Precip Accum One Hour']).replace(' in', '')) || 0
      }))
      .filter(d => d.totalSnowDepth >= 0 || d.snowDepth24h >= 0 || d.precipHour >= 0);

    // Don't render if no valid data
    if (data.length === 0) return;

    // Setup dimensions
    const margin = { top: 40, right: 80, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales with separate domains for line and bars
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yScaleSnowDepth = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.totalSnowDepth) || 0])
      .range([height, 0]);

    const yScaleAccum = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.snowDepth24h, d.precipHour)) || 0])
      .range([height, 0]);

    // Add grid lines
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScaleSnowDepth)
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')
      .style('stroke-opacity', 0.2);

    // Add X axis with more frequent ticks
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .ticks(d3.timeDay.every(1))
        .tickFormat(d => moment(d as Date).format('MM/DD')))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    // Add Y axis for snow depth (left)
    svg.append('g')
      .call(d3.axisLeft(yScaleSnowDepth))
      .append('text')
      .attr('fill', 'black')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .text('Total Snow Depth (in)');

    // Add Y axis for accumulation (right)
    svg.append('g')
      .attr('transform', `translate(${width},0)`)
      .call(d3.axisRight(yScaleAccum))
      .append('text')
      .attr('fill', 'black')
      .attr('y', -40)
      .attr('x', height / 2)
      .attr('transform', `rotate(90,0,0)`)
      .attr('text-anchor', 'middle')
      .text('24h Accumulation (in)');

    // Create line for Total Snow Depth
    const line = d3.line<(typeof data)[0]>()
      .x(d => xScale(d.date))
      .y(d => yScaleSnowDepth(d.totalSnowDepth));

    // Add total snow depth line
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'blue')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add bars
    const barWidth = Math.min(30, width / data.length / 3);

    // Add 24h snow depth bars
    svg.selectAll('.snow-bars')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'snow-bars')
      .attr('x', d => xScale(d.date) - barWidth - 2)
      .attr('y', d => yScaleAccum(d.snowDepth24h))
      .attr('width', barWidth)
      .attr('height', d => height - yScaleAccum(d.snowDepth24h))
      .attr('fill', '#4169E1')
      .attr('opacity', 0.7);

    // Add hourly precip bars
    svg.selectAll('.precip-bars')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'precip-bars')
      .attr('x', d => xScale(d.date) + 2)
      .attr('y', d => yScaleAccum(d.precipHour))
      .attr('width', barWidth)
      .attr('height', d => height - yScaleAccum(d.precipHour))
      .attr('fill', '#82EEFD')
      .attr('opacity', 0.7);

    // Add tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', '1px solid #ddd')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none');

    // Add invisible overlay for tooltip
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event, this);
        const x0 = xScale.invert(mouseX);
        const bisect = d3.bisector((d: (typeof data)[0]) => d.date).left;
        const i = bisect(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        if (!d0 || !d1) return;
        const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;

        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        tooltip.html(`
          <div style="font-weight: bold">${moment(d.date).format('MM/DD/YYYY')}</div>
          <div>Total Snow Depth: ${d.totalSnowDepth.toFixed(1)} in</div>
          <div>24h Snow: ${d.snowDepth24h.toFixed(1)} in</div>
          <div>Hourly Precip: ${d.precipHour.toFixed(2)} in</div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add legend
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(['Total Snow Depth', '24h Snow', 'Hourly Precip'])
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(${width + 60},${i * 20})`);

    legend.append('rect')
      .attr('x', -19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', (d, i) => i === 0 ? 'blue' : i === 1 ? '#4169E1' : '#82EEFD')
      .attr('opacity', d => d === 'Total Snow Depth' ? 1 : 0.7);

    legend.append('text')
      .attr('x', -24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(d => d);

  }, [dayAverages]);

  return (
    <div className="graph-container bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-center font-bold mb-4">{dayAverages.title}</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default DayWxSnowGraph;