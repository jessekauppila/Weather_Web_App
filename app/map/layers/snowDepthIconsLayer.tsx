import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';
import { createSnowDepthBoundaryLayer } from './snow-depth/boundaryLayer';
import { createSnowDepthNumericLayer } from './snow-depth/numericLayer';

/**
 * Creates a composite layer combining snow depth boundary and numeric icons
 */
export function createCombinedSnowDepthIcons(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  console.log('Creating combined snow depth icons with data:', {
    featureCount: data.features.length,
    firstFeature: data.features[0]?.properties
  });

  // Create both layers
  const snowDepthBoundaryLayer = createSnowDepthBoundaryLayer(data);
  const snowDepthNumLayer = createSnowDepthNumericLayer(data, onClick);

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

  // Return layers in correct order: boundary first, then numeric
  return [snowDepthBoundaryLayer, snowDepthNumLayer];
} 