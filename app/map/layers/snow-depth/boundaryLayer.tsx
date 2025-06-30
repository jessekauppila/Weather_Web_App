import { IconLayer } from '@deck.gl/layers';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../../map';

export function createSnowDepthBoundaryLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  }
) {
  const validFeatures = data.features.filter(f => f.properties.totalSnowDepthChange !== null);

  const uniqueId = `snowDepthBoundary-${Date.now()}`;

  return new IconLayer({
    id: uniqueId,
    data: validFeatures,
    billboard: false,
    autoHighlight: true,
    getIcon: (f) => {
      const snowDepth = f.properties.totalSnowDepthChange;
      return snowDepth > 0 
        ? 'snow-depth-boundary-positive'
        : 'snow-depth-boundary-negative';
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getElevation: () => 5000, 
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/snowDepthAtlas/snowDepth_boundary_atlas.png',
    iconMapping: '/snowDepthAtlas/boundary-icon-mapping.json', //ICON_MAPPING,
    pickable: false,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
    parameters: {
      depthTest: false,
      depthMask: false
    },
    extensions: [new TerrainExtension()],
  });
} 