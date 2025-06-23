import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';
import { createCombinedSnowAccum } from './snowAccumIconsLayer';
import { createCombinedLiquidPrecipIcons } from './liquidPrecipIcons';
import { createCombinedLiquidPrecipColumns } from './liquidPrecipColumnsLayer';
import { createCombinedSnowAccumColumns } from './snowAccumColumnsLayer';


/**
 * Combines snow accumulation and liquid precipitation icon sets into a single toggleable group.
 */
export function createCombinedPrecipIcons(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  // Each helper returns an array of layers; flatten them into one array
  const snowLayers = createCombinedSnowAccum(data, onClick);
  const liquidLayers = createCombinedLiquidPrecipIcons(data, onClick);
//   const liquidPrecipColumns = createCombinedLiquidPrecipColumns(data, onClick);
//   const snowAccumColumns = createCombinedSnowAccumColumns(data, onClick);

  return [...snowLayers, ...liquidLayers];
} 