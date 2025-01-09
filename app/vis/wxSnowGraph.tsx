import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import moment from 'moment-timezone';
import { formatValueWithUnit } from "@/app/utils/formatValueWithUnit";
import { UnitType } from "@/app/utils/units";

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

// Add this helper function before the main component
function interpolateValues(data: any[]) {
  const result = [...data];
  
  // Helper to find next valid value
  const findNextValid = (arr: any[], startIndex: number, property: string) => {
    for (let i = startIndex + 1; i < arr.length; i++) {
      if (!isNaN(arr[i][property])) return { value: arr[i][property], index: i };
    }
    return null;
  };

  // Helper to find last valid value
  const findLastValid = (arr: any[], startIndex: number, property: string) => {
    for (let i = startIndex - 1; i >= 0; i--) {
      if (!isNaN(arr[i][property])) return { value: arr[i][property], index: i };
    }
    return null;
  };

  ['totalSnowDepth', 'snowDepth24h'].forEach(property => {
    for (let i = 0; i < result.length; i++) {
      if (isNaN(result[i][property])) {
        const lastValid = findLastValid(result, i, property);
        const nextValid = findNextValid(result, i, property);

        if (lastValid && nextValid) {
          // Interpolate between last and next valid values
          const range = nextValid.index - lastValid.index;
          const position = i - lastValid.index;
          const ratio = position / range;
          result[i][property] = lastValid.value + (nextValid.value - lastValid.value) * ratio;
        } else if (lastValid) {
          // Use last valid value if no next valid value
          result[i][property] = lastValid.value;
        } else if (nextValid) {
          // Use next valid value if no last valid value
          result[i][property] = nextValid.value;
        }
        // If neither exists, leave as NaN
      }
    }
  });

  return result;
}

function WxSnowGraph({ dayAverages, isHourly = false, isMetric = false }: DayAveragesProps) {
    const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [yScale, setYScale] = useState<d3.ScaleLinear<number, number>>();
  const [data, setData] = useState<Array<{
    date: Date;
    totalSnowDepth: number;
    snowDepth24h: number;
    precipAccum: number;
    temp: number;
  }>>([]);

  // Prevent React from re-rendering the SVG
  const shouldComponentUpdate = () => false;

  //console.log(dayAverages.data)

  useEffect(() => {
    // Clear any existing content and reset loaded state
    setIsLoaded(false);
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

    // Define spacing constants at the top of the useEffect
    const spacing = {
      dateAxisOffset: 20,
      legendOffset: 40  // This includes the dateAxisOffset plus additional space
    };

    // Add console logs to check data
    //console.log('Raw data before processing:', dayAverages.data);

    // At the start of data processing
    //console.log('Raw data:', dayAverages.data);

    // Process data first
    const data = dayAverages.data
      .map((d) => {
        const date = isHourly 
          ? new Date(`${d.Day} ${d.Hour}`) 
          : new Date(d.Day);

        // Helper function to parse numeric values from strings with units
        const parseValue = (value: string | number) => {
          if (typeof value === 'string') {
            return Number(value.split(' ')[0]);
          }
          return Number(value);
        };

        const processed = {
          date,
          totalSnowDepth: parseValue(d['Total Snow Depth']),
          snowDepth24h: parseValue(d['24h Snow Depth']),
          precipAccum: parseValue(d['Precip Accum']),
          temp: parseValue(d['Air Temp'])
        };
        return processed;
      })
      .filter(d => d.date && !isNaN(d.date.getTime()));



    //SNOW DEPTH CHANGES 
    // Calculate snow depth changes with look-back for NaN values
    const rawData = data
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((point, index, arr) => {
        if (index === 0) return { ...point, snowDepth24h: 0 };

        // Look back for the last valid snowDepth24h value
        let lastValidIndex = index - 1;
        while (lastValidIndex >= 0 && isNaN(arr[lastValidIndex].snowDepth24h)) {
          lastValidIndex--;
        }

        if (lastValidIndex >= 0 && !isNaN(point.snowDepth24h)) {
          const lastValid = arr[lastValidIndex].snowDepth24h;
          const change = Number((point.snowDepth24h - lastValid).toFixed(2)); // Round to 2 decimal places
          return {
            ...point,
            snowDepth24h: Math.max(0, change) // Only keep positive changes
          };
        }

        return { ...point, snowDepth24h: 0 }; // Default to 0 if no valid comparison can be made
      });

    //console.log('Data after initial processing:', rawData);

    // Apply interpolation after sorting and change calculation
    const dataInterpolated = interpolateValues(rawData);

    // Keep temperature scale
    const yScaleTemp = d3.scaleLinear()
      .domain([
        Math.min(10, d3.min(dataInterpolated, d => d.temp) || 10),
        Math.max(50, d3.max(dataInterpolated, d => d.temp) || 50)
      ])
      .range([height, 0])
      .nice();

    // Update legend items
    const legendItems = [
      'Snow Depth',
      'Hourly Snow',
      'Liquid Precipitation (SWE)',
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
      .domain(d3.extent(dataInterpolated, d => d.date) as [Date, Date])
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
        .tickFormat(d => formatValueWithUnit(d, UnitType.TEMPERATURE, isMetric)))
      .selectAll('text')
      .style('fill', '#808080');

    // Update temperature label to grey
    svg.append('text')
      .attr('transform', `rotate(-90) translate(${-height/2},${width + 45})`)
      .style('text-anchor', 'middle')
      .style('fill', 'rgb(128, 128, 128)') // Match the grey of the temperature area
      .text('Temperature (°F)');

    // Calculate snow depth statistics and scales
    const avgSnowDepth = d3.mean(dataInterpolated, d => d.totalSnowDepth) || 0;
    const minSnowDepth = d3.min(dataInterpolated, d => d.totalSnowDepth) || 0;
    const maxSnowDepth = d3.max(dataInterpolated, d => d.totalSnowDepth) || 0;

    // Calculate the range centered on the average
    const rangeMin = Math.min(minSnowDepth, avgSnowDepth - 6);
    const rangeMax = Math.max(maxSnowDepth, avgSnowDepth + 6);

    // Create scales with separate domains for line and bars
    const yScaleLine = d3.scaleLinear()
      .domain([rangeMin, rangeMax])
      .range([height, 0])
      .nice();

    const yScaleBars = d3.scaleLinear()
      .domain([0, Math.max(2, d3.max(dataInterpolated, d => Math.max(d.snowDepth24h, d.precipAccum)) || 0)])
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

    // Calculate optimal number of ticks based on data length
    const maxTicks = 24;
    const tickCount = Math.min(dataInterpolated.length, maxTicks);
    const tickInterval = Math.ceil(dataInterpolated.length / tickCount);

    // Generate tick values at regular intervals
    const tickValues = dataInterpolated
      .filter((_, i) => i % tickInterval === 0)
      .map(d => d.date);

    // // Add x-axis with dynamic ticks
    // svg.append('g')
    //   .attr('transform', `translate(0,${height})`)
    //   .call(d3.axisBottom(xScale)
    //     .tickValues(tickValues)
    //     .tickFormat((d) => moment(d as Date).format(isHourly ? 'h a' : 'MM/DD')))
    //   .selectAll('text')
    //   .style('text-anchor', 'middle')
    //   .style('fill', 'black');

    // Create custom ticks for dates - only show first occurrence of each date
    const getDateTicks = () => {
      const seenDates = new Set();
      return dataInterpolated
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
    // svg.append('g')
    //   .attr('class', 'x-axis-date')
    //   .attr('transform', `translate(0,${height + spacing.dateAxisOffset})`)
    //   .call(d3.axisBottom(xScale)
    //     .tickValues(getDateTicks())  // Use our custom ticks
    //     .tickFormat((d) => moment(d as Date).format('MM/DD')))
    //   .selectAll('text')
    //   .style('text-anchor', 'middle')
    //   .style('fill', 'black');

    // Add y-axis for total snow depth (left)
    svg.append('g')
      .call(d3.axisLeft(yScaleLine)
        .tickFormat(d => {
          const formatted = formatValueWithUnit(d, UnitType.PRECIPITATION, isMetric);
          return formatted;
        }))
      .selectAll('text')
      .style('fill', 'blue');

    // Add temperature y-axis on the right
    svg.append('g')
      .attr('class', 'y-axis-temp')
      .attr('transform', `translate(${width},0)`)  // Position it on the right side
      .call(d3.axisRight(yScaleTemp)
        .tickFormat(d => {
          const formatted = formatValueWithUnit(d, UnitType.TEMPERATURE, isMetric);
          return formatted;
        }))
      .selectAll('text')
      .style('fill', '#808080');

    // Update snow depth label to blue
    const firstDataPoint = dataInterpolated[0];
    svg.append('text')
      .attr('x', d => {
        const val = xScale(firstDataPoint.date);
        return isNaN(val) ? 0 : val;
      })
      .attr('y', d => {
        const val = yScaleLine(firstDataPoint.totalSnowDepth);
        return isNaN(val) ? 0 : val - 10;
      })
      .attr('text-anchor', 'start')  // Align text to start from this point
      .style('fill', 'blue')
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
    const line = d3.line<(typeof dataInterpolated)[0]>()
      .x(d => {
        const val = xScale(d.date);
        return isNaN(val) ? 0 : val;
      })
      .y(d => {
        const val = yScaleLine(d.totalSnowDepth);
        return isNaN(val) ? 0 : val;
      })
      .defined(d => !isNaN(d.totalSnowDepth) && !isNaN(d.date.getTime()))  // Skip invalid points
      .curve(d3.curveMonotoneX);

    // Add the line
    svg.append('path')
      .datum(dataInterpolated)
      .attr('fill', 'none')
      .attr('stroke', 'blue')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Adjust bar dimensions
    const totalBarWidth = width / dataInterpolated.length * 0.9; // Increase from 0.8 to 0.9 for wider bars
    const individualBarWidth = totalBarWidth * 0.45; // Increase from 0.4 to 0.45
    const pairGap = totalBarWidth * 0.1; // Decrease from 0.2 to 0.1 for less gap between pairs
    const barGap = totalBarWidth * 0.025; // Decrease from 0.05 to 0.025 for less gap between bars in a pair

    // Define bar area margins
    const barMargin = { left: 0, right: 0 };  // This will shrink the bar area by 500px on each side
    
    // Create bar-specific scale with reduced width
    const barAreaWidth = width - (barMargin.left + barMargin.right);
    const xScaleBars = d3.scaleTime()
      .domain(d3.extent(dataInterpolated, d => d.date) as [Date, Date])
      .range([barMargin.left, barMargin.left + barAreaWidth])
      .nice();

    // Use xScaleBars for the bars
    svg.selectAll('.snow-bars')
      .data(dataInterpolated)
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
      .data(dataInterpolated)
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
      .attr('transform', `translate(0,${height + spacing.legendOffset})`);

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

    // Update container height to account for all elements
    d3.select(svgRef.current)
      .attr('height', height + margin.top + margin.bottom + spacing.legendOffset); 

    // Remove the temperature area and range code and replace with a single line
    const tempLine = d3.line<(typeof dataInterpolated)[0]>()
      .x(d => xScale(d.date))
      .y(d => yScaleTemp(d.temp))
      .curve(d3.curveMonotoneX);

    // Add the temperature line
    svg.append('path')
      .datum(dataInterpolated)
      .attr('fill', 'none')
      .attr('stroke', '#808080')  // Grey color for temperature
      .attr('stroke-width', 1.5)  // Slightly thicker than the grid lines
      .attr('d', tempLine);

    // Keep the D3 tooltip implementation
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'snow-accum-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('z-index', '1000');

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
        const index = bisect(dataInterpolated, date);
        
        // Add safety check
        if (index >= dataInterpolated.length || index < 0) return;
        const d = dataInterpolated[index];

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
              <span>Snow Depth: ${formatValueWithUnit(d.totalSnowDepth, UnitType.PRECIPITATION, isMetric)}</span><br/>
              <span>Hourly Snow: ${formatValueWithUnit(d.snowDepth24h, UnitType.PRECIPITATION, isMetric)}</span><br/>
              <span>Liquid Precip: ${formatValueWithUnit(d.precipAccum, UnitType.PRECIPITATION, isMetric)}</span><br/>
              <span>Temperature: ${formatValueWithUnit(d.temp, UnitType.TEMPERATURE, isMetric)}</span>
            </div>
          `);
      })
      .on('mouseleave', function() {
        verticalLine.style('opacity', 0);
        tooltip.style('opacity', 0);
      });

    // Update temperature label positioning to use last data point
    const lastDataPoint = dataInterpolated[dataInterpolated.length - 1];  // Get the last data point
    svg.append('text')
      .attr('x', xScale(lastDataPoint.date)-70)  // Position at last data point's x coordinate
      .attr('y', yScaleTemp(lastDataPoint.temp) - 10)  // Position above the temperature line
      .attr('text-anchor', 'start')  // Align text to start from this point
      .style('fill', '#808080')  // Match the temperature line color
      .style('font-size', '12px')
      .text('Temperature');

    // Calculate time span in hours and log values
    const timeSpanHours = (d3.max(dataInterpolated, d => d.date.getTime()) - d3.min(dataInterpolated, d => d.date.getTime())) / (1000 * 60 * 60);

    const shouldShowAllTimes = timeSpanHours <= 72;

    // Keep the original time axis but modify it based on time span
    svg.append('g')
      .attr('class', 'x-axis-time')
      .attr('transform', `translate(0,${height + spacing.dateAxisOffset})`)
      .call(d3.axisBottom(xScaleBars)
        .tickValues(dataInterpolated.map(d => {
          // Only show ticks for the first hour of each day
          const hour = d.date.getHours();
          const minute = d.date.getMinutes();
          return (hour === 0 && minute === 0) ? d.date : null;
        }).filter(Boolean))  // Remove null values
        .tickSize(0))
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .remove();  // Remove all text since we'll add our own labels

    // Add date brackets above
    const dateRanges = getDateTicks();
    dateRanges.forEach((date, i) => {
      const nextDate = i < dateRanges.length - 1 ? dateRanges[i + 1] : dataInterpolated[dataInterpolated.length - 1].date;
      
      // Add bracket
      svg.append('path')
        .attr('d', `
          M ${xScaleBars(date)} ${height + spacing.dateAxisOffset - 15}
          L ${xScaleBars(date)} ${height + spacing.dateAxisOffset - 20}
          L ${xScaleBars(nextDate)} ${height + spacing.dateAxisOffset - 20}
          L ${xScaleBars(nextDate)} ${height + spacing.dateAxisOffset - 15}
        `)
        .attr('stroke', 'black')
        .attr('fill', 'none');

      // Add centered date label
      svg.append('text')
        .attr('x', xScaleBars(date) + (xScaleBars(nextDate) - xScaleBars(date))/2)
        .attr('y', height + spacing.dateAxisOffset + 8)
        .attr('text-anchor', 'middle')
        .style('fill', 'black')
        .style('font-size', '12px')
        .text(moment(date).format('MM/DD'));
    });

    // Update bar labels
    svg.selectAll('.snow-bars')
      .data(data.filter(d => d.snowDepth24h > 0))
      .enter()
      .append('text')
      .attr('class', 'snow-bar-label')
      .attr('x', d => xScaleBars(d.date) - (individualBarWidth/2))
      .attr('y', d => yScaleBars(d.snowDepth24h) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', '#4169E1')
      .style('font-size', '10px')
      .text(d => formatValueWithUnit(d.snowDepth24h, UnitType.PRECIPITATION, isMetric));

    // Add snow depth label (left axis)
    svg.append('text')
      .attr('transform', 'rotate(-90)')  // Rotate for vertical text
      .attr('y', -40)  // Adjust position as needed
      .attr('x', -height/2)
      .attr('text-anchor', 'middle')
      .style('fill', 'blue')
      //.text(`Snow Depth (${isMetric ? 'cm' : 'in'})`);

    // Add temperature label (right axis)
    svg.append('text')
      .attr('transform', `translate(${width + 40},${height/2}) rotate(90)`)  // Position label
      .style('text-anchor', 'middle')
      .style('fill', '#808080')
      //.text(`Temperature (${isMetric ? '°C' : '°F'})`);

    // Set loaded state after graph is created
    setIsLoaded(true);

    // Inside your useEffect where the scales are created
    const scale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.totalSnowDepth) || 0])
      .range([height, 0]);
    setYScale(scale);


  }, [dayAverages, isHourly, isMetric]); // This ensures the graph updates when dayAverages changes

  // Add some debug logging to check the values
  useEffect(() => {
    if (!yScale) return;

    
    // Log a sample bar height calculation
    if (data.length > 0) {
      const sampleHeight = yScale(data[0].totalSnowDepth) - yScale(0);
      console.log('Sample bar height:', sampleHeight);
    }
  }, [data, yScale]);

  if (yScale) {

  }

  return (
    <div 
      ref={containerRef} 
      className={`graph-container bg-white p-4 rounded-xl shadow-md transition-opacity duration-500 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        width: '100%',
        height: '500px',
        overflow: 'hidden'
      }}
    >
      {/* <h3 className="text-center font-bold mb-4">{dayAverages.title}</h3> */}
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