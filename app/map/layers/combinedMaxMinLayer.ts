import { GeoJsonLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';
// import { createMinTempColLayer } from './temperatureWithColumns/minTempColLayer';
// import { createMaxTempColLayer } from './temperatureWithColumns/maxTempColLayer';
import { createMinTempLayer } from './temperatureWithColumns/minTempLayer';
import { createMaxTempLayer } from './temperatureWithColumns/maxTempLayer';

/**
 * Creates a composite layer with both min and max temperature icons
 */
export function createCombinedMaxMinLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  console.log('Creating combined max/min temperature layers with data:', data);
  console.log('First feature properties:', data.features[0]?.properties);

  // Check if we have temperature data
  const hasMinTemp = data.features.some(
    (f) => f.properties.airTempMin !== null && !isNaN(f.properties.airTempMin)
  );
  const hasMaxTemp = data.features.some(
    (f) => f.properties.airTempMax !== null && !isNaN(f.properties.airTempMax)
  );

  console.log('Has min temp:', hasMinTemp);
  console.log('Has max temp:', hasMaxTemp);

  // Create all layers
  const minTempLayer = createMinTempLayer(data, onClick);
  const maxTempLayer = createMaxTempLayer(data, onClick);
  // const minTempColLayer = createMinTempColLayer(data, onClick);
  // const maxTempColLayer = createMaxTempColLayer(data, onClick);

  // Return all layers in the correct order
  return [ maxTempLayer, minTempLayer ];
}