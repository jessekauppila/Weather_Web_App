import { PickingInfo } from '@deck.gl/core';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../map';
import { LayerId } from '@/app/types/layers';

// Import individual layer creators
import { createForecastZoneLayer } from './forecastZoneLayer';
import { createCurrentTempLayer } from './currentTempLayer';
import { createTerrainLayer } from './terrainLayer';
import { createCombinedMaxMinLayer } from './combinedMaxMinLayer';
import { createCombinedAvgMaxWindLayer } from './combinedAvgMaxWind';
import { createCombinedSnowDepthIcons } from '@/app/map/layers/snowDepthIconsLayer';
import { createCombinedSnowAccum } from '@/app/map/layers/snowAccumIconsLayer';
import { createCombinedSnowDepthColumns } from '@/app/map/layers/snowDepthColumnsLayer';
import { createCombinedSnowAccumColumns } from '@/app/map/layers/snowAccumColumnsLayer';
import { createCombinedLiquidPrecipColumns } from '@/app/map/layers/liquidPrecipColumnsLayer';
import { createMaxTempColLayer } from './temperatureWithColumns/maxTempColLayer';
import { createMinTempColLayer } from './temperatureWithColumns/minTempColLayer';
import { createCurrentTempColLayer } from './temperatureWithColumns/currentTempColLayer';
import { createCombinedLiquidPrecipIcons } from '@/app/map/layers/liquidPrecipIcons';
import { createCombinedPrecipIcons } from '@/app/map/layers/combinedPrecipIconsLayer';

// Re-export the layer creators for direct usage if needed
export { 
  createForecastZoneLayer,
  createCurrentTempLayer,
  createTerrainLayer,
  createCombinedMaxMinLayer,
  createCombinedAvgMaxWindLayer,
  createCombinedSnowDepthIcons,
  createCombinedSnowAccum,
  createCombinedSnowDepthColumns,
  createCombinedLiquidPrecipColumns,
  createCombinedSnowAccumColumns,
  createMaxTempColLayer,
  createMinTempColLayer,
  createCurrentTempColLayer,
  createCombinedLiquidPrecipIcons,
  createCombinedPrecipIcons,
};

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
  // console.log('createMapLayers called with visibility:', visibility);
  // console.log('stationData features count:', data.stationData?.features.length ?? 0);

  const layers = [

    visibility.terrain && createTerrainLayer(),
    
    visibility.forecastZones &&
      createForecastZoneLayer(data.forecastZones ?? []),

   
    
    visibility.currentTemp &&
      createCurrentTempLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
    visibility.currentTempCol &&
      createCurrentTempColLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
    visibility.minMaxTemp &&
      createCombinedMaxMinLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
    visibility.maxTempCol &&
      createMaxTempColLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
    visibility.minTempCol &&
      createMinTempColLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
    visibility.avgMaxWind &&
      createCombinedAvgMaxWindLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
    visibility.snowDepthIcons &&
      createCombinedSnowDepthIcons(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
    visibility.snowDepthIconsRedo &&
    createCombinedSnowAccum(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
    visibility.snowDepthColumns &&
        createCombinedSnowDepthColumns(
          data.stationData ?? {
            type: 'FeatureCollection',
            features: [],
          },
          onStationClick
        ),
    visibility.snowAccumColumns &&
        createCombinedSnowAccumColumns(
          data.stationData ?? {
            type: 'FeatureCollection',
            features: [],
          },
          onStationClick
        ),
    visibility.liquidPrecipColumns &&
        createCombinedLiquidPrecipColumns(
          data.stationData ?? {
            type: 'FeatureCollection',
            features: [],
          },
          onStationClick
        ),
    visibility.liquidPrecipIcons &&
      createCombinedLiquidPrecipIcons(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
    visibility.combinedPrecipIcons &&
      createCombinedPrecipIcons(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        },
        onStationClick
      ),
  ].filter(Boolean);

  return layers;
}

