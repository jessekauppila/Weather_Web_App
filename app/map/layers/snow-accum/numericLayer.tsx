import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../../map';

function getSnowDepthIcon(depth: number | null): string {
  // Handle negative or null values
  if (depth === null || depth < 0) {
    return 'snow-depth-0.0';
  }

  // Handle values greater than 60
  if (depth > 60) {
    return 'snow-depth-60';
  }

  // Handle values between 0 and 0.9
  if (depth < 1) {
    // Round to nearest 0.1
    const roundedDepth = Math.round(depth * 10) / 10;
    return `snow-depth-${roundedDepth.toFixed(1)}`;
  }

  // Handle values between 1 and 60
  return `snow-depth-${Math.round(depth)}`;
}

export function createSnowDepthNumericLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  return new IconLayer({
    id: 'snowDepthNumeric',
    data: data.features.filter(f => f.properties.snowAccumulation24h !== null),
    billboard: false,
    autoHighlight: true,
    getIcon: (f) => {
      const snowDepth = f.properties.snowAccumulation24h;
      return getSnowDepthIcon(snowDepth);
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getElevation: () => 5000, 
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/snowDepthAtlasRedo/snowDepth_num_icon_atlas.png',
    iconMapping: '/snowDepthAtlasRedo/num-icon-mapping.json',
    pickable: true,
    onClick,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
} 