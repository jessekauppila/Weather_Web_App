import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';
import { createAvgWindLayer } from './wind/avgWindLayer';
import { createMaxWindLayer } from './wind/maxWindLayer';
import { createWindArrowLayer } from './wind/windArrowLayer';

/**
 * Creates a composite layer with both average and max wind speed icons
 */
export function createCombinedAvgMaxWindLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {

  console.log('Creating combined avg/max wind layer with data:', data);
  const avgWindLayer = createAvgWindLayer(data);
  const maxWindLayer = createMaxWindLayer(data, onClick);
  const windArrowLayer = createWindArrowLayer(data, onClick);

  return [avgWindLayer, maxWindLayer, windArrowLayer];
}

