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
  isHourly?: boolean;
}

function WxSnowGraph({ dayAverages, isHourly = false }: DayAveragesProps) {
    const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent React from re-rendering the SVG
  const shouldComponentUpdate = () => false;

  useEffect(() => {
    // Clear any existing content
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll('*').remove();
    }

    if (!dayAverages.data.length || !svgRef.current || !containerRef.current) return;

    // Get container dimensions and set margins
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = 400; // Fixed height
    const margin = { top: 30, right: 60, bottom: 50, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;


    // Process data with validation and logging
    const data = dayAverages.data
      .map((d) => {
        const date = isHourly 
          ? new Date(`${d.Day} ${d.Hour}`) 
          : new Date(d.Day);
        const totalSnowDepth = parseFloat(String(d['Total Snow Depth']).replace(' in', ''));
        const snowDepth24h = parseFloat(String(d['24h Snow Depth']).replace(' in', ''));
        const precipAccum = parseFloat(String(d['Precip Accum']).replace(' in', ''));
        const temp = parseFloat(String(d['Air Temp']).replace(' °F', ''));

        return {
          date,
          totalSnowDepth: isNaN(totalSnowDepth) ? 0 : totalSnowDepth,
          snowDepth24h: isNaN(snowDepth24h) ? 0 : snowDepth24h,
          precipAccum: isNaN(precipAccum) ? 0 : precipAccum,
          temp: isNaN(temp) ? 0 : temp
        };
      })
      .filter(d => d.date && !isNaN(d.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Keep temperature scale
    const yScaleTemp = d3.scaleLinear()
      .domain([
        Math.min(10, d3.min(data, d => d.temp) || 10),
        Math.max(80, d3.max(data, d => d.temp) || 80)
      ])
      .range([height, 0])
      .nice();

    // Update legend items to include temperature
    const legendItems = [
      'Total Snow Depth',
      '24h Snow Depth',
      'Precip Accum',
      'Temperature'
    ];

    // // Create tooltip first
    // const tooltip = d3.select('body')
    //   .append('div')
    //   .attr('class', 'snow-accum-tooltip')
    //   .style('opacity', 0)
    //   .style('position', 'absolute')
    //   .style('pointer-events', 'none')
    //   .style('background', 'white')
    //   .style('border', '1px solid #ddd')
    //   .style('border-radius', '4px')
    //   .style('padding', '8px')
    //   .style('z-index', '1000');

    // Update tooltip content
    // tooltip
    //   .html(`
    //     <div class="tooltip-content">
    //       <strong>${d3.timeFormat(isHourly ? '%B %d %H:%M' : '%B %d')(d.date)}</strong><br/>
    //       <span>Total Snow Depth: ${d.totalSnowDepth}″</span><br/>
    //       <span>24h Snow Depth: ${d.snowDepth24h}″</span><br/>
    //       <span>Precip Accum: ${d.precipAccum}″</span><br/>
    //       <span>Temperature: ${d.temp}°F</span>
    //     </div>
    //   `);

    // Update scales with padding
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width])
      .nice();

    // Create SVG first
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      //.attr('height', height + margin.top + margin.bottom)
      .attr('height', containerHeight)
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
      .call(d3.axisRight(yScaleTemp)
        .tickFormat(d => `${d}°F`))  // Add °F to temperature labels
      .selectAll('text')
      .style('fill', '#808080');

    // Update temperature label to grey
    svg.append('text')
      .attr('transform', `rotate(-90) translate(${-height/2},${width + 45})`)
      .style('text-anchor', 'middle')
      .style('fill', 'rgb(128, 128, 128)') // Match the grey of the temperature area
      .text('Temperature (°F)');

    // Create scales with separate domains for line and bars
    const maxSnowDepth = d3.max(data, d => d.totalSnowDepth) || 0;
    const yScaleLine = d3.scaleLinear()
      .domain([0, Math.max(12, maxSnowDepth)])  // Use 12in or data max, whichever is larger
      .range([height, 0]);

    const yScaleBars = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.snowDepth24h, d.precipAccum)) || 0])
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
        .tickValues(data.map(d => d.date))
        .tickFormat((d) => moment(d as Date).format(isHourly ? 'HH:mm' : 'MM/DD')))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .style('fill', 'black');

    // Add y-axis for total snow depth (left)
    svg.append('g')
      .call(d3.axisLeft(yScaleLine)
        .tickFormat(d => d + ' in'))  // Add this line to format the actual axis ticks
      .selectAll('text')
      .style('fill', 'blue');

    // Update snow depth label to blue
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left)
      .attr('x', -height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', 'blue') // Match the blue of the snow depth line
      //.text('Snow Depth');

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

    // Define bar area margins
    const barMargin = { left: 50, right: 50 };  // This will shrink the bar area by 500px on each side
    
    // Create bar-specific scale with reduced width
    const barAreaWidth = width - (barMargin.left + barMargin.right);
    const xScaleBars = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([barMargin.left, barMargin.left + barAreaWidth])
      .nice();

    // Use xScaleBars for the bars
    svg.selectAll('.snow-bars')
      .data(data.filter(d => d.snowDepth24h > 0))
      .enter()
      .append('rect')
      .attr('class', 'snow-bars')
      .attr('x', d => xScaleBars(d.date) - (individualBarWidth + barGap/2))
      .attr('y', d => yScaleBars(d.snowDepth24h))
      .attr('width', individualBarWidth)
      .attr('height', d => height - yScaleBars(d.snowDepth24h))
      .attr('fill', '#4169E1')
      .attr('opacity', 0.7);

    svg.selectAll('.precip-bars')
      .data(data.filter(d => d.precipAccum > 0))
      .enter()
      .append('rect')
      .attr('class', 'precip-bars')
      .attr('x', d => xScaleBars(d.date) + barGap/2)
      .attr('y', d => yScaleBars(d.precipAccum))
      .attr('width', individualBarWidth)
      .attr('height', d => height - yScaleBars(d.precipAccum))
      .attr('fill', '#82EEFD')
      .attr('opacity', 0.7);

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

    // Update legend to single line
    const legendWidth = width;
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 12)
      .attr('text-anchor', 'start')
      .attr('transform', `translate(0,${height + 30})`);

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
      .attr('height', height + margin.top + margin.bottom + 40); // Adjusted for single-line legend

    // Define the temperature area generator
    const tempArea = d3.area<(typeof data)[0]>()
      .x(d => xScale(d.date))
      .y0(d => yScaleTemp(d.temp))
      .y1(d => yScaleTemp(d.temp))
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
      .y(d => yScaleTemp(d.temp))
      .curve(d3.curveMonotoneX);

    // Add the max temperature line
    const tempMaxLine = d3.line<(typeof data)[0]>()
      .x(d => xScale(d.date))
      .y(d => yScaleTemp(d.temp))
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

    // Remove any existing tooltips first
    d3.selectAll('.snow-accum-tooltip').remove();

    // Add tooltip elements
    const tooltip = d3.select('body') // Attach to body instead of SVG parent
      .append('div')
      .attr('class', 'snow-accum-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('z-index', '1000'); // Ensure tooltip appears above other elements

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
        
        // Add safety check
        if (index >= data.length || index < 0) return;
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
          .style('top', `${event.pageY - 100}px`)
          .html(`
            <div class="tooltip-content">
              <strong>${d3.timeFormat(isHourly ? '%B %d %H:%M' : '%B %d')(d.date)}</strong><br/>
              <span>Total Snow Depth: ${d.totalSnowDepth}″</span><br/>
              <span>24h Snow Depth: ${d.snowDepth24h}″</span><br/>
              <span>Precip Accum: ${d.precipAccum}″</span><br/>
              <span>Temperature: ${d.temp}°F</span>
            </div>
          `);
      })
      .on('mouseleave', function() {
        verticalLine.style('opacity', 0);
        tooltip.style('opacity', 0);
      });

    // Add snow depth label along the line
    svg.append('text')
      .attr('x', width - width)  // Position it just after the end of the line
      .attr('y', (height / 2) -20)  // Center it vertically with the snow depth line
      .attr('dy', '0.3em')  // Small vertical adjustment
      .style('fill', 'blue')  // Match the line color
      .style('font-size', '12px')
      .text('Snow Depth');

    // Add temperature range label
    svg.append('text')
      .attr('x', width - 120)  // Position it just after the end of the area
      .attr('y', yScaleTemp(d3.mean([
        d3.min(data, d => d.temp) ?? 0,
        d3.max(data, d => d.temp) ?? 0
      ]) ?? 0))  // Use nullish coalescing to provide fallback
      .attr('dy', '0.3em')
      .style('fill', '#808080')  // Match the temperature line color
      .style('font-size', '12px')
      .text('Temperature Range');

  }, [dayAverages, isHourly]); // This ensures the graph updates when dayAverages changes

  return (
    <div 
      ref={containerRef} 
      className="graph-container bg-white p-4 rounded-xl shadow-md"
      style={{ 
        width: '100%',
        height: '500px',//was 300
        overflow: 'hidden'
      }}
    >
      <h3 className="text-center font-bold mb-4">{dayAverages.title}</h3>
      <svg 
        ref={svgRef}
        style={{
          display: 'block',
          width: '100%',
          height: 'calc(100% - 2rem)'
        }}
      />
    </div>
  );
}

export default WxSnowGraph;