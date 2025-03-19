import { PickingInfo } from '@deck.gl/core';
import type { Feature, Geometry } from 'geojson';
import type { Map_BlockProperties } from '../map';

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
  if (speed <= 0.6) return '"<b>Calm</b> (≤ 0.6 mph)"';
  else if (speed <= 16.2) return '<b>Light</b> (0.6-16.2 mph)';
  else if (speed <= 25.5) return '<b>Moderate</b> (16.2-25.5 mph)';
  else if (speed <= 37.3) return '<b>Strong</b> (25.5-37.3 mph)';
  else return '<b>Extreme</b> (> 37.3 mph)';
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
  const windSpeed = parseFloat(props.curWindSpeed ?? '0');

  return {
    html: `\
      <div style="text-decoration: underline; font-size: 1.2em;"><b>${
        props.stationName ?? 'Unknown Station'
      }</b></div>
      <div style="text-decoration: underline;"><b>Snow Depth Change</b></div>
      <div>${props.totalSnowDepthChange ?? 'N/A'} in</div>
      <div style="text-decoration: underline;"><b>Temperature Conditions</b></div>
      <div style="display: flex; align-items: center; gap: 8px;">
        ${getTempConditionWithRange(airTempMax)} 
        <div style="width: 20px; height: 20px; background-color: ${getTempConditionColor(
          airTempMax
        )}; border: 1px solid black; display: inline-block;"></div>
        (<b>${airTempMax} °F</b>)
      </div>
      <div style="text-decoration: underline;"><b>Wind Information</b></div>
      <div style="display: flex; align-items: center; gap: 8px;">
        ${getWindStrengthWithRange(windSpeed)} 
        <div style="width: 20px; height: 20px; background-color: ${getWindStrengthColor(
          windSpeed
        )}; border: 1px solid black; display: inline-block;"></div>
        (<b>${props.curWindSpeed ?? 'N/A'}</b>)
      </div>
      <div style="text-decoration: underline;"><b>Wind Direction</b></div>
      <div>${props.windDirection ?? 'N/A'}</div>
    `,
  };
} 