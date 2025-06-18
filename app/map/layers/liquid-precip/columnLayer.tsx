import { GeoJsonLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../../map';

// function absValueSnowDepthChange(f: Feature<Geometry, Map_BlockProperties>) {
//   return Math.abs(f.properties.totalSnowDepthChange ?? 0);
// }

export function createLiquidPrecipColumnLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  return new GeoJsonLayer({
    id: 'snowAccumChange',
    data,
    opacity: 1,
    stroked: false,
    filled: true,
    extruded: true,
    wireframe: true,
    getElevation: (f) => {
      const change = f.properties.precipAccumOneHour;
      if (change === 0 || isNaN(change)) return 0;
      return (change ?? 0) * 2500;
    },
    getFillColor: (f: Feature<Geometry, Map_BlockProperties>) => {
        const precipValue = parseFloat(f.properties.precipAccumOneHour?.split(' ')[0] || '0');
        return precipValue < 0.5 ? [44, 149, 255, 0] : [44, 149, 255, 255];
    },
    pickable: true,
    onClick,
    material: {
      ambient: 0.64,
      diffuse: 0.6,
      shininess: 32,
      specularColor: [51, 51, 51],
    },
    transitions: {
      geometry: {
        duration: 3000,
        type: 'spring',
      },
    },
  });
} 