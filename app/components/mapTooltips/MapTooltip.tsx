import { PickingInfo } from '@deck.gl/core';
import type { Feature, Geometry } from 'geojson';
import type { Map_BlockProperties } from '../../map/map';

interface TooltipProps {
  html: string;
}

const getWindStrengthColor = (speed: number) => {
  if (speed <= 0.6) return 'rgb(255, 255, 255)';
  else if (speed <= 16.2) return 'rgb(255, 255, 180)';
  else if (speed <= 25.5) return 'rgb(255, 218, 185)';
  else if (speed <= 37.3) return 'rgb(255, 182, 193)';
  else return 'rgb(220, 20, 60)';
};

const getTempConditionColor = (temp: number) => {
  if (temp <= 31) return 'rgb(255, 255, 255)';
  else if (temp <= 34) return 'rgb(135, 206, 235)';
  else return 'rgb(150, 255, 150)';
};

const getTempConditionWithRange = (temp: number) => {
  if (temp <= 31) return '<b>Snow</b> (< 31°F)';
  else if (temp <= 34) return '<b>Mixed Precipitation</b> (31-34°F)';
  else return '<b>Rain</b> (> 34°F)';
};

const getWindStrengthWithRange = (speed: number) => {
  if (speed <= 0.6) return '<b>Calm</b> (≤ 0.6 mph)';
  else if (speed <= 16.2) return '<b>Light</b> (0.6-16.2 mph)';
  else if (speed <= 25.5) return '<b>Moderate</b> (16.2-25.5 mph)';
  else if (speed <= 37.3) return '<b>Strong</b> (25.5-37.3 mph)';
  else return '<b>Extreme</b> (> 37.3 mph)';
};

export function getMapTooltip(info: PickingInfo): TooltipProps | null {
  console.log('getMapTooltip called with:', info);
  
  if (!info.object || !info.object.properties) {
    console.log('No object or properties found');
    return null;
  }

  const props = info.object.properties as Map_BlockProperties;
  console.log('Properties:', props);
  
  const airTempMax = props.airTempMax ?? 0;
  const windSpeed = parseFloat(props.curWindSpeed);

  return {
    html: `
      <div style="padding: 8px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">${props.stationName}</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
          ${props.elevation ? `${props.elevation} ft` : 'N/A'} | 
          ${props.latitude.toFixed(2)}, ${props.longitude.toFixed(2)}
        </div>
        <div style="margin-bottom: 4px;">
          <div style="font-weight: bold;">Snow Depth Change</div>
          <div>${props.totalSnowDepthChange ?? 'N/A'} in</div>
        </div>
        <div style="margin-bottom: 4px;">
          <div style="font-weight: bold;">Temperature Conditions</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${getTempConditionWithRange(airTempMax)}
            <div style="width: 16px; height: 16px; background-color: ${getTempConditionColor(airTempMax)}; border: 1px solid #ccc;"></div>
            <span>(${airTempMax}°F)</span>
          </div>
        </div>
        <div style="margin-bottom: 4px;">
          <div style="font-weight: bold;">Wind Information</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${getWindStrengthWithRange(windSpeed)}
            <div style="width: 16px; height: 16px; background-color: ${getWindStrengthColor(windSpeed)}; border: 1px solid #ccc;"></div>
            <span>(${props.curWindSpeed})</span>
          </div>
        </div>
        <div>
          <div style="font-weight: bold;">Wind Direction</div>
          <div>${props.windDirection}</div>
        </div>
      </div>
    `
  };
} 