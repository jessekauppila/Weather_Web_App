import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../../map';

export function createLiquidPrecipBoundaryLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  }
) {
  return new IconLayer({
    id: 'liquidPrecipBoundary',
    data: data.features.filter(f => f.properties.totalSnowDepthChange !== null),
    billboard: false,
    autoHighlight: true,
    getIcon: () => 'liquid-precip-boundary',  // This is correct
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/liquidPrecipAtlas/water_boundary_atlas.png',  // Make sure this file exists
    iconMapping: '/liquidPrecipAtlas/boundary-icon-mapping.json',  // This path is correct
    pickable: false,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
} 