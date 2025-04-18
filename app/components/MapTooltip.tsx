import { PickingInfo } from '@deck.gl/core';
import type { Feature, Geometry } from 'geojson';
import type { Map_BlockProperties } from '../map/map';

interface TooltipProps {
  html: string;
}

// const getWindStrengthColor = (speed: number) => {
//   if (speed <= 0.6) return 'rgb(255, 255, 255)';
//   else if (speed <= 16.2) return 'rgb(255, 255, 180)';
//   else if (speed <= 25.5) return 'rgb(255, 218, 185)';
//   else if (speed <= 37.3) return 'rgb(255, 182, 193)';
//   else return 'rgb(220, 20, 60)';
// };

// const getTempConditionColor = (temp: number) => {
//   if (temp <= 31) return 'rgb(255, 255, 255)';
//   else if (temp <= 34) return 'rgb(135, 206, 235)';
//   else return 'rgb(150, 255, 150)';
// };

const getTempConditionWithRange = (temp: number) => {
  if (temp <= 31) return 'Snow (< 31°F)';
  else if (temp <= 34) return 'Mixed (31-34°F)';
  else return 'Rain (> 34°F)';
};

const getWindStrengthWithRange = (speed: number) => {
  if (speed <= 0.6) return 'Calm (≤ 0.6 mph)';
  else if (speed <= 16.2) return 'Light (0.6-16.2 mph)';
  else if (speed <= 25.5) return 'Moderate (16.2-25.5 mph)';
  else if (speed <= 37.3) return 'Strong (25.5-37.3 mph)';
  else return 'Extreme (> 37.3 mph)';
};

export function getMapTooltip(info: PickingInfo): TooltipProps | null {
  if (!info.object) {
    return null;
  }

  const object = info.object as Feature<Geometry, Map_BlockProperties>;
  if (!object.properties) {
    return null;
  }

  const props = object.properties;
  const airTempMax = parseFloat(props.airTempMax?.toString() ?? '0');
  
  // Update wind value processing to handle string values with units
  const processWindValue = (value: string | null | undefined) => {
    if (!value || value === '-') return null;
    return value.replace(' mph', '');
  };

  const windSpeed = processWindValue(props.curWindSpeed);
  const windSpeedAvg = processWindValue(props.windSpeedAvg);
  const maxWindGust = processWindValue(props.maxWindGust);
  const windDirection = props.windDirection === '-' ? null : props.windDirection;

  const containerStyle = `
    background-color: transparent !important;
    background: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    pointer-events: none !important;
  `;

  const cardStyle = `
    background: rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    padding: 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    width: 280px;
    border: none;
    pointer-events: auto;
    color: var(--app-text-primary, #c6c6c6);
  `;

const headerStyle = `
  margin-bottom: 0.5rem;
`;

const stationNameStyle = `
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--app-text-primary, #c6c6c6);
  margin: 0;
`;

const elevationStyle = `
  font-size: 0.625rem;
  color: var(--app-text-secondary, #757575);
  margin: 0;
`;

const gridStyle = `
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
`;

const sectionStyle = `
  background: rgba(0, 0, 0, 0.15);
  border-radius: 0.375rem;
  padding: 0.5rem;
  box-shadow: inset 0px 0px 2px rgba(255, 255, 255, 0.1);
  transition: box-shadow 0.2s;
`;


  const sectionTitleStyle = `
    font-size: 0.625rem;
    font-weight: 500;
    color: var(--app-text-primary, #c6c6c6);
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.15rem;
  `;

  const measurementStyle = `
    margin-bottom: 0.25rem;
  `;

  const valueStyle = `
    font-size: 1rem;
    font-weight: 700;
    color: var(--app-text-primary, #c6c6c6);
    margin: 0;
    display: inline;
  `;

  const unitStyle = `
    font-size: 0.625rem;
    color: var(--app-text-secondary, #757575);
    margin-left: 2px;
  `;

  const labelStyle = `
    font-size: 0.5rem;
    color: var(--app-text-secondary, #757575);
    margin: 0;
    white-space: nowrap;
  `;

  const conditionStyle = `
    font-size: 0.625rem;
    color: var(--app-text-primary, #c6c6c6);
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.15rem;
  `;

  const swatchStyle = `
    width: 10px;
    height: 10px;
    border: 1px solid #616161;
    border-radius: 2px;
  `;

  const noDataStyle = `
    font-size: 0.625rem;
    color: var(--app-text-secondary, #757575);
  `;

  const renderValue = (value: string | null, unit: string) => {
    if (!value || value === 'no') {
      return `<div style="${noDataStyle}">no data</div>`;
    }
    return `<div style="${valueStyle}">${value}<span style="${unitStyle}">${unit}</span></div>`;
  };

  return {
    html: `
      <div style="${containerStyle}">
        <div style="${cardStyle}">
          <div style="${headerStyle}">
            <div style="${stationNameStyle}">${props.stationName ?? 'Unknown Station'}</div>
            <div style="${elevationStyle}">${props.elevation ? `${props.elevation} ft` : 'N/A'}</div>
          </div>

          <div style="${gridStyle}">
            <!-- Snow Section -->
            <div style="${sectionStyle}">
              <div style="${sectionTitleStyle}">
                Snow
              </div>
              <div style="${measurementStyle}">
                ${renderValue(props.totalSnowDepth?.toString() ?? null, 'in')}
                <div style="${labelStyle}">Snow Depth</div>
              </div>
              <div style="${measurementStyle}">
                ${renderValue(props.totalSnowDepthChange?.toString() ?? null, 'in')}
                <div style="${labelStyle}">Depth Change</div>
              </div>
              <div style="${measurementStyle}">
                ${renderValue(props.precipAccumOneHour ?? null, 'in')}
                <div style="${labelStyle}">Liquid Precip</div>
              </div>
            </div>

            <!-- Temperature Section -->
            <div style="${sectionStyle}">
              <div style="${sectionTitleStyle}">
                Temp
              </div>
              <div style="${measurementStyle}">
                ${renderValue(props.curAirTemp?.toString() ?? null, '°F')}
                <div style="${labelStyle}">Current</div>
              </div>
              <div style="${measurementStyle}">
                ${renderValue(props.airTempMin?.toString() ?? null, '°F')}
                <div style="${labelStyle}">Min</div>
              </div>
              <div style="${measurementStyle}">
                ${renderValue(airTempMax.toString(), '°F')}
                <div style="${labelStyle}">Max</div>
              </div>
            </div>

            <!-- Wind Section -->
            <div style="${sectionStyle}">
              <div style="${sectionTitleStyle}">
                Wind
              </div>
              <div style="${measurementStyle}">
                ${renderValue(windSpeed?.toString() ?? null, 'mph')}
                <div style="${labelStyle}">Current</div>
              </div>
              <div style="${measurementStyle}">
                ${renderValue(windSpeedAvg?.toString() ?? null, 'mph')}
                <div style="${labelStyle}">Average</div>
              </div>
              <div style="${measurementStyle}">
                ${renderValue(maxWindGust?.toString() ?? null, 'mph')}
                <div style="${labelStyle}">Gust</div>
              </div>
              <div style="${measurementStyle}">
                ${renderValue(windDirection ?? null, '')}
                <div style="${labelStyle}">Direction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  };
}