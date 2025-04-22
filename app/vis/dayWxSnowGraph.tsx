import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import moment from 'moment-timezone';
import { UnitType } from "@/app/utils/units";
import { formatValueWithUnit } from "@/app/utils/formatValueWithUnit";

interface DayAverage {
  [key: string]: string | number;
}

interface DayAveragesProps {
  dayAverages: {
    data: DayAverage[];
    title: string;
  };
  isHourly?: boolean;
  isMetric?: boolean;
}

// This is the core graph component without the accordion
function DayWxSnowGraph({ dayAverages, isHourly = false, isMetric}: DayAveragesProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const spacing = {
    dateAxisOffset: 15,
    legendOffset: 30
  };

  // Prevent React from re-rendering the SVG
  const shouldComponentUpdate = () => false;

  useEffect(() => {
    if (!expanded) return; // Don't draw if accordion is collapsed
    
    // Clear any existing content
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll('*').remove();
    }

    if (!dayAverages?.data?.length || !svgRef.current || !containerRef.current) {
      return;
    }

    // Process data first
    const data = dayAverages.data
      .map((d) => {
        // Handle date parsing for both date ranges and single dates
        let date;
        
        // First try parsing from Start Date Time or End Date Time which are more reliable
        if (d['End Date Time'] && typeof d['End Date Time'] === 'string') {
          // Use the end date as that's the more recent one
          const dateStr = d['End Date Time'].split(',')[0]; // Get just the date part
          date = moment(dateStr, 'MMM DD YYYY').toDate();
        } else if (d['Start Date Time'] && typeof d['Start Date Time'] === 'string') {
          const dateStr = d['Start Date Time'].split(',')[0]; // Get just the date part
          date = moment(dateStr, 'MMM DD YYYY').toDate();
        } else if (typeof d.Date === 'string') {
          // More reliable parsing for various date formats
          if (d.Date.includes(' - ')) {
            // For date ranges like "Mar 30 - Mar 31", use the end date
            const endDateStr = d.Date.split(' - ')[1];
            
            // Try with YYYY appended if not present
            const currentYear = new Date().getFullYear();
            const dateWithYear = endDateStr.includes(currentYear.toString()) ? 
              endDateStr : `${endDateStr} ${currentYear}`;
            
            date = moment(dateWithYear, 'MMM DD YYYY').toDate();
          } else {
            // For single dates
            // Try with YYYY appended if not present
            const currentYear = new Date().getFullYear(); 
            const dateWithYear = d.Date.includes(currentYear.toString()) ? 
              d.Date : `${d.Date} ${currentYear}`;
            
            date = moment(dateWithYear, 'MMM DD YYYY').toDate();
          }
        } else if (d.Date && typeof d.Date === 'object' && 'getTime' in (d.Date as any)) {
          // Check if it's a Date object by checking for getTime method
          date = d.Date as Date;
        } else {
          // If all else fails, try to extract date from DateTime field
          if (d['Date Time'] && typeof d['Date Time'] === 'string') {
            const datePart = d['Date Time'].split(',')[1]?.trim(); // Get the date part after comma
            if (datePart) {
              // Try to find MMM DD format in the string
              const dateMatch = datePart.match(/([A-Za-z]{3})\s+(\d{1,2})/);
              if (dateMatch) {
                const month = dateMatch[1];
                const day = dateMatch[2];
                const currentYear = new Date().getFullYear();
                date = moment(`${month} ${day} ${currentYear}`, 'MMM D YYYY').toDate();
              }
            }
          }
          
          // If still not parsed, use current date
          if (!date) {
            date = new Date();
          }
        }
        
        // Helper function to parse numeric values from strings with units
        const parseValue = (value: string | number) => {
          if (typeof value === 'string') {
            // Extract number from string like "147.20 in" -> 147.20
            const match = value.match(/^(-?\d+(\.\d+)?)/);
            return match ? Number(match[0]) : 0;
          }
          return Number(value) || 0;
        };

        return {
          date,
          totalSnowDepth: parseValue(d['Total Snow Depth']),
          snowDepth24h: parseValue(d['24h Snow Accumulation']),
          precipHour: parseValue(d['Precip Accum One Hour']),
          tempMin: parseValue(d['Air Temp Min']),
          tempMax: parseValue(d['Air Temp Max'])
        };
      })
      .filter(d => d.date && !isNaN(d.date.getTime()));

    // Safety check for empty data after processing
    if (!data.length) {
      return;
    }

    // Get container dimensions and set margins
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = 400; // Fixed height
    const margin = { 
      top: 30, 
      right: 122, 
      bottom: 50, 
      left: 60 
    };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Create SVG first
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', containerHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add white background like WxSnowGraph does
    svg.append('rect')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('x', -margin.left)
      .attr('y', -margin.top)
      .attr('fill', 'white');

    // Update scales with padding
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width])
      .nice();

    // Calculate snow depth statistics and scales
    const avgSnowDepth = d3.mean(data, d => d.totalSnowDepth) || 0;
    const minSnowDepth = d3.min(data, d => d.totalSnowDepth) || 0;
    const maxSnowDepth = d3.max(data, d => d.totalSnowDepth) || 0;

    // Calculate the range centered on the average
    const rangeMin = Math.min(minSnowDepth, avgSnowDepth - 12);
    const rangeMax = Math.max(maxSnowDepth, avgSnowDepth + 12);

    // Update snow depth scale
    const yScaleLine = d3.scaleLinear()
      .domain([rangeMin, rangeMax])
      .range([height, 0])
      .nice();

    // Update temperature scale
    const yScaleTemp = d3.scaleLinear()
      .domain([
        Math.min(10, d3.min(data, d => d.tempMin) || 10),
        Math.max(50, d3.max(data, d => d.tempMax) || 50)
      ])
      .range([height, 0])
      .nice();

    // Create scales with separate domains for line and bars
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

    // Add y-axis for total snow depth (left)
    svg.append('g')
      .call(d3.axisLeft(yScaleLine)
        .tickFormat(d => formatValueWithUnit(d, UnitType.PRECIPITATION, isMetric)))
      .selectAll('text')
      .style('fill', 'blue');

    // Update snow depth label to blue and position at first data point
    const firstDataPoint = data[0];
    svg.append('text')
      .attr('x', xScale(firstDataPoint.date))  // Position at first data point's x coordinate
      .attr('y', yScaleLine(firstDataPoint.totalSnowDepth) - 10)  // Position above the line (-10 for padding)
      .attr('text-anchor', 'start')  // Align text to start from this point
      .style('fill', 'blue')  // Match the line color
      .style('font-size', '12px')
      .text('Snow Depth');

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
    const totalBarWidth = width / data.length * 0.9; // Increase from 0.8 to 0.9 for wider bars
    const individualBarWidth = totalBarWidth * 0.45; // Increase from 0.4 to 0.45
    const pairGap = totalBarWidth * 0.1; // Decrease from 0.2 to 0.1 for less gap between pairs
    const barGap = totalBarWidth * 0.025; // Decrease from 0.05 to 0.025 for less gap between bars in a pair

    // Define bar area margins
    const barMargin = { left: 50, right: 50 };  // This will shrink the bar area by 50px on each side
    
    // Create bar-specific scale with reduced width
    const barAreaWidth = width - (barMargin.left + barMargin.right);
    const xScaleBars = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([barMargin.left, barMargin.left + barAreaWidth])
      .nice();

    // Create custom ticks for dates - only show first occurrence of each date
    const getDateTicks = () => {
      const seenDates = new Set();
      return data
        .filter(d => {
          const dateStr = moment(d.date).format('MM/DD');
          if (!seenDates.has(dateStr)) {
            seenDates.add(dateStr);
            return true;
          }
          return false;
        })
        .map(d => d.date);
    };

    // Add date x-axis below
    svg.append('g')
      .attr('class', 'x-axis-date')
      .attr('transform', `translate(0,${height + spacing.dateAxisOffset})`)
      .call(d3.axisBottom(xScaleBars)
        .tickValues(getDateTicks())
        .tickFormat((d) => moment(d as Date).format('MM/DD')))
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .attr('dy', '-.5em');  // Added this line to move text up closer to ticks

    // Add just vertical ticks for date ranges
    const dateRanges = getDateTicks();
    dateRanges.forEach((date) => {
      // Add horizontal line extending 10px left and right of tick
      svg.append('path')
        .attr('d', `
          M ${xScaleBars(date) - individualBarWidth} ${height + spacing.dateAxisOffset - 5}
          L ${xScaleBars(date) + individualBarWidth} ${height + spacing.dateAxisOffset - 5}
        `)
        .attr('stroke', 'black')
        .attr('fill', 'none');

      // Add vertical tick to left of bar
      svg.append('path')
        .attr('d', `
          M ${xScaleBars(date) - individualBarWidth} ${height + spacing.dateAxisOffset - 5}  
          L ${xScaleBars(date) - individualBarWidth} ${height + spacing.dateAxisOffset - 10}
        `)
        .attr('stroke', 'black')
        .attr('fill', 'none');

        // Add vertical tick to left of bar
      svg.append('path')
      .attr('d', `
        M ${xScaleBars(date) + individualBarWidth} ${height + spacing.dateAxisOffset - 5}  
        L ${xScaleBars(date) + individualBarWidth} ${height + spacing.dateAxisOffset - 10}
      `)
      .attr('stroke', 'black')
      .attr('fill', 'none');
    });

    // Create snow bars
    const snowData = data.filter(d => d.snowDepth24h > 0);
    svg.selectAll('.snow-bars')
      .data(snowData)
      .enter()
      .append('rect')
      .attr('class', 'snow-bars')
      .attr('x', d => xScaleBars(d.date) - (individualBarWidth + barGap/2))
      .attr('y', d => yScaleBars(d.snowDepth24h))
      .attr('width', individualBarWidth)
      .attr('height', d => height - yScaleBars(d.snowDepth24h))
      .attr('fill', '#4169E1')
      .attr('opacity', 0.7);

    // Create precipitation bars
    const precipData = data.filter(d => d.precipHour > 0);
    svg.selectAll('.precip-bars')
      .data(precipData)
      .enter()
      .append('rect')
      .attr('class', 'precip-bars')
      .attr('x', d => xScaleBars(d.date) + barGap/2)
      .attr('y', d => yScaleBars(d.precipHour))
      .attr('width', individualBarWidth)
      .attr('height', d => height - yScaleBars(d.precipHour))
      .attr('fill', '#82EEFD')
      .attr('opacity', 0.7);

    // Just add the labels
    svg.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => xScale(d.date))
      .attr('y', d => yScaleLine(d.snowDepth24h) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', '#666')
      .style('font-size', '10px')
      .text(d => d.snowDepth24h > 0 ? d.snowDepth24h.toFixed(1) : '');

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
      .attr('y1', yScaleTemp(isMetric ? 0 : 32))  // Use 0 for Celsius, 32 for Fahrenheit
      .attr('y2', yScaleTemp(isMetric ? 0 : 32))
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
        .attr('fill', i === 0 ? 'blue' : 
                      i === 1 ? '#4169E1' : 
                      i === 2 ? '#82EEFD' : 
                      '#808080')
        .attr('opacity', i === 0 ? 1 : 0.7);

      g.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('fill', 'black')
        .text(text);
    });

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

    // Add the tooltip code here, after all SVG elements are created
    // Remove any existing tooltips first
    d3.selectAll('.day-wx-tooltip').remove();

    // Add temperature range label using the last data point
    const lastDataPoint = data[data.length - 1];  // Get the last data point
    svg.append('text')
      .attr('x', xScale(lastDataPoint.date) - 120)  // Position at last data point's x coordinate
      .attr('y', yScaleTemp((lastDataPoint.tempMin + lastDataPoint.tempMax) / 2) - 10)  // Position between min and max temperature
      .attr('dy', '0.3em')
      .style('fill', '#808080')  // Match the temperature line color
      .style('font-size', '12px')
      .text('Temperature Range');

    // Add labels above the snow bars
    svg.selectAll('.snow-bar-label')
      .data(snowData)
      .enter()
      .append('text')
      .attr('class', 'snow-bar-label')
      .attr('x', d => xScaleBars(d.date) - (individualBarWidth/2))
      .attr('y', d => yScaleBars(d.snowDepth24h) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', '#4169E1')
      .style('font-size', '10px')
      .text(d => formatValueWithUnit(d.snowDepth24h, UnitType.PRECIPITATION, isMetric));
      
    // Add labels above the precip bars
    svg.selectAll('.liquid-bar-label')
      .data(precipData)
      .enter()
      .append('text')
      .attr('class', 'liquid-bar-label')
      .attr('x', d => xScaleBars(d.date) + (individualBarWidth/2))
      .attr('y', d => yScaleBars(d.precipHour) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', '#4169E1')
      .style('font-size', '10px')
      .text(d => formatValueWithUnit(d.precipHour, UnitType.PRECIPITATION, isMetric));

    // Update container height at the end
    d3.select(svgRef.current)
      .attr('height', height + margin.top + margin.bottom + 40); // Adjusted for single-line legend

    // After adding the left y-axis for snow depth, add the temperature y-axis on the right
    svg.append('g')
      .attr('class', 'y-axis-temp')
      .attr('transform', `translate(${width},0)`)  // Position it on the right side
      .call(d3.axisRight(yScaleTemp)
        .tickFormat(d => formatValueWithUnit(d, UnitType.TEMPERATURE, isMetric)))
      .selectAll('text')
      .style('fill', '#808080');  // Gray color to match temperature lines

    // Add temperature axis label
    svg.append('text')
      .attr('transform', `translate(${width + 40},${height/2}) rotate(90)`)  // Position label
      .style('text-anchor', 'middle')
      .style('fill', '#808080')
      //.text('Temperature (°F)');

    // Add tooltip div if it doesn't exist
    const tooltip = d3.select('body')
      .selectAll('.graph-tooltip')
      .data([null])
      .join('div')
      .attr('class', 'graph-tooltip snow-accum-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'white')
      .style('padding', '5px')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('z-index', '10');

    // Add hover area
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [xPos] = d3.pointer(event);
        const bisect = d3.bisector((d: any) => d.date).left;
        const x0 = xScale.invert(xPos);
        const i = bisect(data, x0);
        const d = data[i];

        if (d) {
          tooltip
            .style('visibility', 'visible')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`)
            .html(`
              <div class="tooltip-content">
                <strong>${moment(d.date).format('MM/DD/YYYY')}</strong><br/>
                <span>Snow Depth: ${formatValueWithUnit(d.totalSnowDepth, UnitType.PRECIPITATION, isMetric)}</span><br/>
                <span>24h Snow: ${formatValueWithUnit(d.snowDepth24h, UnitType.PRECIPITATION, isMetric)}</span><br/>
                <span>Temp Range: ${formatValueWithUnit(d.tempMin, UnitType.TEMPERATURE, isMetric)} - ${formatValueWithUnit(d.tempMax, UnitType.TEMPERATURE, isMetric)}</span>
              </div>
            `);
        }
      })
      .on('mouseout', function() {
        tooltip.style('visibility', 'hidden');
      });

    // Set loaded state after graph is created
    setIsLoaded(true);

  }, [dayAverages, isHourly, expanded, spacing.dateAxisOffset, isMetric]); // Add isMetric here

  return (
    <div 
      ref={containerRef}
      className={`graph-container bg-white p-4 rounded-xl shadow-md transition-opacity duration-500 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <svg
        ref={svgRef}
        style={{
          display: 'block',
          width: '100%',
          height: '400px'
        }}
      />
    </div>
  );
}

export default DayWxSnowGraph;

