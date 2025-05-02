import { GeoJsonLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../../map';

function absValueSnowDepthChange(f: Feature<Geometry, Map_BlockProperties>) {
  return Math.abs(f.properties.totalSnowDepthChange ?? 0);
}

export function createSnowDepthColumnLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  return new GeoJsonLayer({
    id: 'snowDepthChange',
    data,
    opacity: 1,
    stroked: false,
    filled: true,
    extruded: true,
    wireframe: true,
    getElevation: (f) => (absValueSnowDepthChange(f) ?? 0) * 2500,
    getFillColor: (f: Feature<Geometry, Map_BlockProperties>) => {
      if ((f.properties.totalSnowDepthChange ?? 0) > 0) {
        return [255, 255, 255];
      } else {
        return [250, 171, 13];
      }
    },
    getLineColor: (f: Feature<Geometry, Map_BlockProperties>) => {
      if ((f.properties.totalSnowDepthChange ?? 0) > 0) {
        return [255, 255, 255];
      } else {
        return [250, 171, 13];
      }
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