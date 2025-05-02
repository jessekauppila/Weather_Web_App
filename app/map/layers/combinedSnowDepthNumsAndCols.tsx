import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';
import { createSnowDepthBoundaryLayer } from './snow-depth/boundaryLayer';
import { createSnowDepthNumericLayer } from './snow-depth/numericLayer';
import { createSnowDepthColumnLayer } from './snow-depth/columnLayer';

/**
 * Creates a composite layer combining snow depth visualization with boundary and numeric icons
 */
export function createCombinedSnowDepthNumsAndCols(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  console.log('Creating combined snow depth layers with data:', {
    featureCount: data.features.length,
    firstFeature: data.features[0]?.properties
  });

  // Create all three layers
  const snowDepthBoundaryLayer = createSnowDepthBoundaryLayer(data);
  const snowDepthNumLayer = createSnowDepthNumericLayer(data, onClick);
  const snowDepthColLayer = createSnowDepthColumnLayer(data, onClick);

  // Add detailed layer debugging
  console.log('Layer configurations:', {
    boundaryLayer: {
      id: snowDepthBoundaryLayer.id,
      iconAtlas: snowDepthBoundaryLayer.props.iconAtlas,
      iconMapping: snowDepthBoundaryLayer.props.iconMapping,
      dataLength: snowDepthBoundaryLayer.props.data.length,
      firstFeature: snowDepthBoundaryLayer.props.data[0]?.properties
    },
    numLayer: {
      id: snowDepthNumLayer.id,
      iconAtlas: snowDepthNumLayer.props.iconAtlas,
      iconMapping: snowDepthNumLayer.props.iconMapping,
      dataLength: snowDepthNumLayer.props.data.length,
      firstFeature: snowDepthNumLayer.props.data[0]?.properties
    }
  });

  // Return layers in correct order: boundary first, then color, then numeric
  return [snowDepthBoundaryLayer, snowDepthNumLayer, snowDepthColLayer];
}
