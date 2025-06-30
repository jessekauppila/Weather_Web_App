import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../../map';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';

export function createSnowDepthBoundaryLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  }
) {
  return new IconLayer({
    id: 'snowDepthBoundary',
    data: data.features.filter(f => f.properties.totalSnowDepthChange !== null),
    billboard: false,
    autoHighlight: true,
    getIcon: () => 'snow-depth-boundary',  // This is correct
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getElevation: () => 5000, 
    getSize: 100,
    getAngle: 0,
    iconAtlas: '/snowDepthAtlasRedo/snowDepth_boundary_atlas.png',  // Make sure this file exists
    iconMapping: '/snowDepthAtlasRedo/boundary-icon-mapping.json',  // This path is correct
    pickable: false,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
    angleAlignment: 'viewport', //'viewport' for 3d, 'screen' for 2d
    parameters: {
      depthTest: false,      // Disable depth testing completely
      depthMask: false
    },
    extensions: [new TerrainExtension()],
  });
} 