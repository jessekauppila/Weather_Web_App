import { PickingInfo } from '@deck.gl/core';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../map';

// Import individual layer creators
import { createForecastZoneLayer } from './forecastZoneLayer';
import { createWindArrowLayer } from './windArrowLayer';
import { createCurrentTempLayer } from './currentTempLayer';
import { createSnowDepthLayer } from './snowDepthLayer';
import { createTerrainLayer } from './terrainLayer';
import { createCombinedMaxMinLayer } from './combinedMaxMinLayer';

// Re-export the layer creators for direct usage if needed
export { 
  createForecastZoneLayer,
  createWindArrowLayer,
  createCurrentTempLayer,
  createSnowDepthLayer,
  createTerrainLayer
};

// Define LayerId type
export type LayerId =
  | 'forecastZones'
  | 'windArrows'
  | 'snowDepthChange'
  | 'terrain'
  | 'currentTemp'
  | 'airTempMin'
  | 'airTempMax';

type LayerVisibility = {
  [key in LayerId]: boolean;
};

/**
 * Creates all map layers based on visibility settings
 */
export function createMapLayers(
  visibility: LayerVisibility,
  data: {
    forecastZones?: { name: string; contour: [number, number][] }[];
    stationData?: {
      type: 'FeatureCollection';
      features: Feature<Geometry, Map_BlockProperties>[];
    };
  },
  onStationClick?: (info: PickingInfo) => void
) {
  return [
    visibility.forecastZones &&
      createForecastZoneLayer(data.forecastZones ?? []),
    visibility.windArrows &&
      createWindArrowLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
    visibility.snowDepthChange &&
      createSnowDepthLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
    visibility.terrain && createTerrainLayer(),
    visibility.currentTemp &&
      createCurrentTempLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
      visibility.airTempMin && visibility.airTempMax &&
      createCombinedMaxMinLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
  ].filter(Boolean);
}

