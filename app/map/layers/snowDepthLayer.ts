// import {
  
//   Position,
//   PickingInfo,
//   MapViewState,
// } from '@deck.gl/core';
import { scaleThreshold } from 'd3-scale';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { Color,PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';
//import { map_COLOR_SCALE } from '../map';

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

 const map_COLOR_SCALE = scaleThreshold<number, Color>()
  .domain([31, 34])
  .range([
    [255, 255, 255], // White (below 31°F)
    [30, 144, 255], // DodgerBlue (31-34°F)
    [150, 255, 150], // Pastel green (above 34°F)
  ] as Color[]);