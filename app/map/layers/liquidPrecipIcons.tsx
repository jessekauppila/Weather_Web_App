import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';
import { createLiquidPrecipBoundaryLayer } from './liquid-precip/boundaryLayer';
import { createLiquidPrecipNumericLayer } from './liquid-precip/numericLayer';

/**
 * Creates a composite layer combining snow depth boundary and numeric icons
 */
export function createCombinedLiquidPrecipIcons(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  console.log('🌊 Creating Liquid Precip Layers:', {
    featureCount: data.features.length,
    sampleFeatures: data.features.slice(0, 3).map(f => ({
      station: f.properties.stationName || f.properties.stationName,
      precip: f.properties.precipAccumOneHour,
      allProps: f.properties
    }))
  });

  // Create both layers with updated icon mappings
  const liquidPrecipBoundaryLayer = createLiquidPrecipBoundaryLayer(data);
  const liquidPrecipNumLayer = createLiquidPrecipNumericLayer(data, onClick);

  // Add detailed layer debugging
  console.log('Layer configurations:', {
    boundaryLayer: {
      id: liquidPrecipBoundaryLayer.id,
      iconAtlas: liquidPrecipBoundaryLayer.props.iconAtlas,
      iconMapping: liquidPrecipBoundaryLayer.props.iconMapping,
      dataLength: liquidPrecipBoundaryLayer.props.data.length,
      firstFeature: liquidPrecipBoundaryLayer.props.data[0]?.properties
    },
    numLayer: {
      id: liquidPrecipNumLayer.id,
      iconAtlas: liquidPrecipNumLayer.props.iconAtlas,
      iconMapping: liquidPrecipNumLayer.props.iconMapping,
      dataLength: liquidPrecipNumLayer.props.data.length,
      firstFeature: liquidPrecipNumLayer.props.data[0]?.properties
    }
  });

  // Return layers in correct order: boundary first, then numeric
  return [liquidPrecipBoundaryLayer, liquidPrecipNumLayer];
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