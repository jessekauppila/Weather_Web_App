import { GeoJsonLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';
import { map_COLOR_SCALE } from '../map';

/**
 * Creates a GeoJSON layer to display snow depth changes on the map
 */
export function createSnowDepthLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  return new GeoJsonLayer({
    id: 'snowDepthChange',
    data,
    opacity: 0.8,
    stroked: false,
    filled: true,
    extruded: true,
    wireframe: true,
    getElevation: (f) =>
      (f.properties.totalSnowDepthChange ?? 0) * 2500,
    getFillColor: (f) =>
      map_COLOR_SCALE(f.properties.airTempMax ?? 0),
    getLineColor: (f) =>
      map_COLOR_SCALE(f.properties.airTempMax ?? 0),
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