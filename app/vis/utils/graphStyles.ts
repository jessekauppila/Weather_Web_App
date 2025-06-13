import { UnitType } from "@/app/utils/units";
import * as d3 from 'd3';
import moment from 'moment-timezone';
import { formatValueWithUnit } from "@/app/utils/formatValueWithUnit";

// Common graph dimensions and spacing
export const graphDimensions = {
  containerHeight: 400,
  margin: { 
    top: 30, 
    right: 60, 
    bottom: 50, 
    left: 60 
  },
  spacing: {
    dateAxisOffset: 20,
    legendOffset: 40
  }
};

// Common colors
export const graphColors = {
  snowDepth: 'blue',
  hourlySnow: '#4169E1',
  precipitation: '#82EEFD',
  temperature: '#808080',
  grid: '#ccc',
  freezingLine: '#A0A0A0',
  tooltip: {
    background: 'white',
    border: '#ddd'
  }
};

// Common styles for SVG elements
export const svgStyles = {
  container: {
    width: '100%',
    height: '500px',
    overflow: 'hidden'
  },
  svg: {
    display: 'block',
    width: '100%',
    height: 'calc(100% - 2rem)'
  },
  tooltip: {
    opacity: 0,
    position: 'absolute',
    pointerEvents: 'none',
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '8px',
    zIndex: 1000
  }
};

// Common legend configuration
export const legendConfig = {
  items: [
    { label: 'Snow Depth', color: graphColors.snowDepth, opacity: 1 },
    { label: 'Hourly Snow', color: graphColors.hourlySnow, opacity: 0.7 },
    { label: 'Liquid Precipitation (SWE)', color: graphColors.precipitation, opacity: 0.7 },
    { label: 'Temperature', color: graphColors.temperature, opacity: 0.7 }
  ]
};

// Common bar dimensions
export const barDimensions = {
  totalBarWidth: 0.9, // percentage of available space
  individualBarWidth: 0.45, // percentage of totalBarWidth
  pairGap: 0.1, // percentage of totalBarWidth
  barGap: 0.025 // percentage of totalBarWidth
};

// Common axis configurations
export const axisConfig = {
  temperature: {
    domain: {
      min: 10,
      max: 50
    },
    format: (d: number, isMetric: boolean) => 
      formatValueWithUnit(d, UnitType.TEMPERATURE, isMetric)
  },
  snowDepth: {
    format: (d: number, isMetric: boolean) => 
      formatValueWithUnit(d, UnitType.PRECIPITATION, isMetric)
  }
};

// Common tooltip configuration
export const tooltipConfig = {
  format: (d: any, isHourly: boolean, isMetric: boolean) => `
    <div class="tooltip-content">
      <strong>${d3.timeFormat(isHourly ? '%B %d %H:%M' : '%B %d')(d.date)}</strong><br/>
      <span>Snow Depth: ${formatValueWithUnit(d.totalSnowDepth, UnitType.PRECIPITATION, isMetric)}</span><br/>
      <span>Hourly Snow: ${formatValueWithUnit(d.snowDepth24h, UnitType.PRECIPITATION, isMetric)}</span><br/>
      <span>Liquid Precip: ${formatValueWithUnit(d.precipAccum, UnitType.PRECIPITATION, isMetric)}</span><br/>
      <span>Temperature: ${formatValueWithUnit(d.temp, UnitType.TEMPERATURE, isMetric)}</span>
    </div>
  `
};

// Common date formatting utilities
export const dateFormatting = {
  getDateTicks: (data: any[]) => {
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
  },
  formatDate: (date: Date, isHourly: boolean) => 
    moment(date).format(isHourly ? 'h a' : 'MM/DD')
};

// Common D3 scale creation utilities
export const createScales = {
  temperature: (data: any[], height: number, isMetric: boolean) => 
    d3.scaleLinear()
      .domain([
        Math.min(10, d3.min(data, d => d.temp) || 10),
        Math.max(50, d3.max(data, d => d.temp) || 50)
      ])
      .range([height, 0])
      .nice(),
  
  snowDepth: (data: any[], height: number, avgSnowDepth: number) => 
    d3.scaleLinear()
      .domain([
        Math.min(d3.min(data, d => d.totalSnowDepth) || 0, avgSnowDepth - 6),
        Math.max(d3.max(data, d => d.totalSnowDepth) || 0, avgSnowDepth + 6)
      ])
      .range([height, 0])
      .nice()
}; 