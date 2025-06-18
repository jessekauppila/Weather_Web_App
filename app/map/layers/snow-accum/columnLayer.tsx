import { GeoJsonLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../../map';

function absValueSnowDepthChange(f: Feature<Geometry, Map_BlockProperties>) {
  return Math.abs(f.properties.totalSnowDepthChange ?? 0);
}

export function createSnowAccumColumnLayer(
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
      const change = f.properties.snowAccumulation24h;
      if (change === 0 || isNaN(change)) return 0;
      return (change ?? 0) * 2500;
    },
    getFillColor: (f: Feature<Geometry, Map_BlockProperties>) => {
        //return [255, 255, 255];
        return f.properties.snowAccumulation24h ? (f.properties.snowAccumulation24h < 0.5 ? [255, 255, 255, 0] : [255, 255, 255, 255]) : [255, 255, 255, 255];
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