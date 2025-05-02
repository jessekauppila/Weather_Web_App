import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../../map';

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
    getIcon: (f) => {
      const snowDepth = f.properties.totalSnowDepthChange;
      console.log('Processing boundary feature:', {
        station: f.properties.stationName,
        snowDepth,
        hasValue: snowDepth !== null
      });

      if (snowDepth === null) {
        console.log('Skipping boundary icon for null snow depth');
        return 'default-icon';
      }

      const icon = snowDepth > 0 
        ? 'snow-depth-boundary-positive'
        : 'snow-depth-boundary-negative';
      console.log('Selected boundary icon:', icon, 'for value:', snowDepth);
      return icon;
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/snowDepthAtlas/snowDepth_boundary_atlas.png',
    iconMapping: '/snowDepthAtlas/boundary-icon-mapping.json',
    pickable: false,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
} 