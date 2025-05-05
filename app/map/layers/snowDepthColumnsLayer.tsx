import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';
import { createSnowDepthColumnLayer } from './snow-depth/columnLayer';

/**
 * Creates a layer for snow depth columns
 */
export function createCombinedSnowDepthColumns(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  console.log('Creating snow depth columns with data:', {
    featureCount: data.features.length,
    firstFeature: data.features[0]?.properties
  });

  // Create column layer
  const snowDepthColLayer = createSnowDepthColumnLayer(data, onClick);

  // Add detailed layer debugging
  console.log('Layer configuration:', {
    columnLayer: {
      id: snowDepthColLayer.id,
      dataLength: data.features.length,
      firstFeature: data.features[0]?.properties
    }
  });

  return [snowDepthColLayer];
} 