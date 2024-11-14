import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import moment from 'moment-timezone';

interface DayAverage {
  [key: string]: string | number;
}

interface DayAveragesProps {
  dayAverages: {
    data: DayAverage[];
    title: string;
  };
}

function DayWxSnowGraph({ dayAverages }: DayAveragesProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Clear the entire SVG before drawing new data
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll('*').remove();
    }

    if (!dayAverages.data.length || !svgRef.current) return;

    // Process data with validation and logging
    const data = dayAverages.data
      .map((d) => {
        const date = new Date(d.Date);
        const totalSnowDepth = parseFloat(String(d['Total Snow Depth']).replace(' in', ''));
        const snowDepth24h = parseFloat(String(d['24h Snow Accumulation']).replace(' in', ''));
        const precipHour = parseFloat(String(d['Precip Accum One Hour']).replace(' in', ''));
        const tempMin = parseFloat(String(d['Air Temp Min']).replace(' °F', ''));
        const tempMax = parseFloat(String(d['Air Temp Max']).replace(' °F', ''));

        return {
          date,
          totalSnowDepth: isNaN(totalSnowDepth) ? 0 : totalSnowDepth,
          snowDepth24h: isNaN(snowDepth24h) ? 0 : snowDepth24h,
          precipHour: isNaN(precipHour) ? 0 : precipHour,
          tempMin: isNaN(tempMin) ? 0 : tempMin,
          tempMax: isNaN(tempMax) ? 0 : tempMax
        };
      })
      .filter(d => d.date && !isNaN(d.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date

    // Adjust dimensions to ensure graph fits within bounds
    const containerWidth = svgRef.current?.parentElement?.clientWidth || 800;
    const margin = { top: 30, right: 60, bottom: 50, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = 300; // Reduced from 400 to 300

    // Update scales with padding
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width])
      .nice();

    // Add padding to temperature scale
    const yScaleTemp = d3.scaleLinear()
      .domain([
        Math.min(10, d3.min(data, d => d.tempMin) || 10),
        Math.max(80, d3.max(data, d => d.tempMax) || 80)
      ])
      .range([height, 0])
      .nice();

    // Create SVG first
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add white background
    svg.append('rect')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('x', -margin.left)
      .attr('y', -margin.top)
      .attr('fill', 'white');

    // Now add temperature axis and label
    svg.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(yScaleTemp))
      .selectAll('text')
      .style('fill', 'black');

    // Add temperature label
    svg.append('text')
      .attr('transform', `rotate(-90) translate(${-height/2},${width + 45})`)
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .text('Temperature (°F)');

    // Create scales with separate domains for line and bars
    const yScaleLine = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.totalSnowDepth) || 0])
      .range([height, 0]);

    const yScaleBars = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.snowDepth24h, d.precipHour)) || 0])
      .range([height, 0]);

    // Add grid lines
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScaleLine)
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')
      .style('stroke', '#ccc');

    // Add axes with black text
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((d) => moment(d as Date).format('MM/DD')))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .style('fill', 'black');

    // Add y-axis for total snow depth (left)
    svg.append('g')
      .call(d3.axisLeft(yScaleLine))
      .selectAll('text')
      .style('fill', 'black');

    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left)
      .attr('x', -height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .text('Snow Depth (inches)');

    // Add x-axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 5)
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .text('');

    // Create line for total snow depth
    const line = d3.line<(typeof data)[0]>()
      .x(d => xScale(d.date))
      .y(d => yScaleLine(d.totalSnowDepth))
      .curve(d3.curveMonotoneX); // Add curve interpolation

    // Add the line
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'blue')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Adjust bar dimensions
    const totalBarWidth = width / data.length * 0.8; // 80% of available space per date
    const individualBarWidth = totalBarWidth * 0.4; // 40% of total bar space
    const pairGap = totalBarWidth * 0.2; // 20% gap between pairs
    const barGap = totalBarWidth * 0.05; // 5% gap between bars in a pair

    // Position bars
    svg.selectAll<SVGRectElement, (typeof data)[0]>('.snow-depth-bars')
      .data(data.slice(-1)) // Only use the last day
      .attr('x', d => xScale(d.date) - (individualBarWidth + barGap/2))
      .attr('width', individualBarWidth);

    svg.selectAll<SVGRectElement, (typeof data)[0]>('.snow-accum-bars')
      .data(data.slice(-1)) // Only use the last day
      .attr('x', d => xScale(d.date) + barGap/2)
      .attr('width', individualBarWidth);

    // Add value labels
    const addValueLabels = (selection: d3.Selection<any, any, any, any>) => {
      selection.append('text')
        .attr('x', d => parseFloat(d3.select(selection.node()).attr('x')) + individualBarWidth/2)
        .attr('y', d => yScaleBars(d.value) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(0,0,0,0.6)')
        .text(d => d.value.toFixed(1));
    };

    // Add freezing line
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScaleTemp(32))
      .attr('y2', yScaleTemp(32))
      .attr('stroke', '#A0A0A0')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.7);

    // Then add your bars code here (it will layer on top)
    svg.selectAll('.snow-bars')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'snow-bars')
      .attr('x', d => xScale(d.date) - (individualBarWidth + barGap/2))
      .attr('y', d => yScaleBars(d.snowDepth24h))
      .attr('width', individualBarWidth)
      .attr('height', d => height - yScaleBars(d.snowDepth24h))
      .attr('fill', '#4169E1')
      .attr('opacity', 0.7);

    svg.selectAll('.precip-bars')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'precip-bars')
      .attr('x', d => xScale(d.date) + barGap/2)
      .attr('y', d => yScaleBars(d.precipHour))
      .attr('width', individualBarWidth)
      .attr('height', d => height - yScaleBars(d.precipHour))
      .attr('fill', '#82EEFD')
      .attr('opacity', 0.7);

    // Update legend to single line
    const legendWidth = width;
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 12)
      .attr('text-anchor', 'start')
      .attr('transform', `translate(0,${height + 30})`);

    const legendItems = [
      'Total Snow Depth',
      'Snow Accumulation',
      'Hourly Precipitation (SWE)',
      'Temperature Range'
    ];

    const itemWidth = legendWidth / legendItems.length;

    legendItems.forEach((text, i) => {
      const g = legend.append('g')
        .attr('transform', `translate(${i * itemWidth + itemWidth/2 - 40},0)`);
      
      g.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', i === 0 ? 'blue' : i === 1 ? '#4169E1' : i === 2 ? '#82EEFD' : 'rgba(128, 128, 128, 0.1)')
        .attr('opacity', i === 0 ? 1 : 0.7);

      g.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('fill', 'black')
        .text(text);
    });

    // Update container height
    d3.select(svgRef.current)
      .attr('height', height + margin.top + margin.bottom); // Removed the +40 that was adding extra space

    // Define the temperature area generator
    const tempArea = d3.area<(typeof data)[0]>()
      .x(d => xScale(d.date))
      .y0(d => yScaleTemp(d.tempMin))
      .y1(d => yScaleTemp(d.tempMax))
      .curve(d3.curveMonotoneX);

    // Add the temperature range area
    svg.append('path')
      .datum(data)
      .attr('fill', 'rgba(128, 128, 128, 0.1)')
      .attr('stroke', 'none')
      .attr('d', tempArea);

    // Add the min temperature line
    const tempMinLine = d3.line<(typeof data)[0]>()
      .x(d => xScale(d.date))
      .y(d => yScaleTemp(d.tempMin))
      .curve(d3.curveMonotoneX);

    // Add the max temperature line
    const tempMaxLine = d3.line<(typeof data)[0]>()
      .x(d => xScale(d.date))
      .y(d => yScaleTemp(d.tempMax))
      .curve(d3.curveMonotoneX);

    // Add both temperature lines
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#808080') // Lighter gray
      .attr('stroke-width', 0.5) // Thinner line
      .attr('stroke-dasharray', '2,2')
      .attr('d', tempMinLine);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#808080') // Lighter gray
      .attr('stroke-width', 0.5) // Thinner line
      .attr('stroke-dasharray', '2,2')
      .attr('d', tempMaxLine);

    // Add tooltip elements
    const tooltip = d3.select(svgRef.current?.parentNode as Element)
      .append('div')
      .attr('class', 'snow-accum-tooltip')
      .style('opacity', 0);

    // Add vertical line for tooltip
    const verticalLine = svg.append('line')
      .attr('class', 'tooltip-line')
      .style('stroke', '#999')
      .style('stroke-width', '1px')
      .style('opacity', 0);

    // Add mouse move handlers
    svg.append('rect')
      .attr('class', 'overlay')
      .attr('width', width)
      .attr('height', height)
      .style('opacity', 0)
      .on('mousemove', function(event) {
        const [xPos] = d3.pointer(event);
        const date = xScale.invert(xPos);
        const bisect = d3.bisector((d: any) => d.date).left;
        const index = bisect(data, date);
        const d = data[index];

        verticalLine
          .attr('x1', xScale(d.date))
          .attr('x2', xScale(d.date))
          .attr('y1', 0)
          .attr('y2', height)
          .style('opacity', 1);

        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div class="tooltip-content">
              <strong>${d3.timeFormat('%B %d')(d.date)}</strong><br/>
              <span>Snow Accumulation: ${d.snowDepth24h}″</span><br/>
              <span>Hourly Precip (SWE): ${d.precipHour}″</span><br/>
              <span>Temperature: ${d.tempMin}°F - ${d.tempMax}°F</span>
            </div>
          `);
      })
      .on('mouseleave', function() {
        verticalLine.style('opacity', 0);
        tooltip.style('opacity', 0);
      });

  }, [dayAverages]); // This ensures the graph updates when dayAverages changes

  return (
    <div className="graph-container bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-center font-bold mb-4">{dayAverages.title}</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default DayWxSnowGraph;