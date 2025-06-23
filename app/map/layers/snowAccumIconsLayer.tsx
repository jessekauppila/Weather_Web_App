import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';
import { createSnowDepthBoundaryLayer } from './snow-accum/boundaryLayer';
import { createSnowDepthNumericLayer } from './snow-accum/numericLayer';

/**
 * Creates a composite layer combining snow depth boundary and numeric icons
 */
export function createCombinedSnowAccum(
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

  // Create both layers with updated icon mappings
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
};

// const getIcon = (depth: number) => {
//   // Handle negative or null values
//   if (depth < 0 || depth === null) {
//     return 'snow-depth-0.0';
//   }

//   // Handle values greater than 60
//   if (depth > 60) {
//     return 'snow-depth-60+';
//   }

//   // Handle values between 0 and 0.9
//   if (depth < 1) {
//     // Round to nearest 0.1
//     const roundedDepth = Math.round(depth * 10) / 10;
//     return `snow-depth-${roundedDepth.toFixed(1)}`;
//   }

//   // Handle values between 1 and 60
//   return `snow-depth-${Math.round(depth)}`;
// }; 