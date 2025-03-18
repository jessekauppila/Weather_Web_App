import {
  IconLayer,
  GeoJsonLayer,
  PolygonLayer,
} from '@deck.gl/layers';
import { TerrainLayer } from '@deck.gl/geo-layers';
import { map_COLOR_SCALE } from './map';
import { MapConfig } from './config';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from './map';

// Define LayerId directly in this file
export type LayerId =
  | 'forecastZones'
  | 'windArrows'
  | 'snowDepthChange'
  | 'terrain'
  | 'currentTemp';

type LayerVisibility = {
  [key in LayerId]: boolean;
};

export function createMapLayers(
  visibility: LayerVisibility,
  data: {
    forecastZones?: { name: string; contour: [number, number][] }[];
    stationData?: {
      type: 'FeatureCollection';
      features: Feature<Geometry, Map_BlockProperties>[];
    };
  }
) {
  return [
    visibility.forecastZones &&
      createForecastZoneLayer(data.forecastZones ?? []),
    visibility.windArrows &&
      createWindArrowLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        }
      ),
    visibility.snowDepthChange &&
      createSnowDepthLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        }
      ),
    visibility.terrain && createTerrainLayer(),
    visibility.currentTemp &&
      createCurrentTempLayer(
        data.stationData ?? {
          type: 'FeatureCollection',
          features: [],
        }
      ),
  ].filter(Boolean);
}

// Implement each layer function based on your original code
function createForecastZoneLayer(
  data: { name: string; contour: [number, number][] }[]
) {
  return new PolygonLayer({
    id: 'forecast-zones',
    data,
    stroked: true,
    filled: false,
    getPolygon: (d) => d.contour,
    getLineColor: [100, 0, 100, 200],
    getLineWidth: 2000,
    pickable: true,
  });
}

function createWindArrowLayer(data: {
  type: 'FeatureCollection';
  features: Feature<Geometry, Map_BlockProperties>[];
}) {
  return new IconLayer({
    id: 'windArrows',
    data: data.features,
    billboard: false,
    autoHighlight: true,
    getIcon: (f) => {
      if (!f?.properties?.windDirection) {
        return 'default-icon';
      }

      const direction = f.properties.windDirection.toLowerCase();
      const speed = f.properties.windSpeedAvg
        ? parseFloat(f.properties.windSpeedAvg.split(' ')[0])
        : 0;

      return getWindStrengthIcon(direction, speed);
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 125,
    getAngle: 0,
    angleAlignment: 'map',
    iconAtlas: '/windAtlas/wind_arrows_location_icon_atlas.png',
    iconMapping: '/windAtlas/location-icon-mapping.json',
    pickable: true,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
}

function createCurrentTempLayer(data: {
  type: 'FeatureCollection';
  features: Feature<Geometry, Map_BlockProperties>[];
}) {
  return new IconLayer({
    id: 'currentTemp',
    data: data.features,
    billboard: false,
    autoHighlight: true,
    getIcon: (f) => {
      if (!f?.properties?.curAirTemp) {
        return 'default-icon';
      }

      const curTemp = parseInt(f.properties.curAirTemp);

      let icon_num = 'minus-9';
      if (curTemp <= -9) icon_num = 'minus-9';
      else if (curTemp <= -1) icon_num = `minus${curTemp}`;
      else if (curTemp <= 59) icon_num = `${curTemp}`;
      else icon_num = '60';

      return `temp-${icon_num}`;
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas:
      '/currentTempAtlas/currentTemp_location_icon_atlas.png',
    iconMapping: '/currentTempAtlas/location-icon-mapping.json',
    pickable: true,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
}

function createSnowDepthLayer(data: {
  type: 'FeatureCollection';
  features: Feature<Geometry, Map_BlockProperties>[];
}) {
  return new GeoJsonLayer({
    id: 'snowDepthChange',
    data,
    opacity: 0.8,
    stroked: false,
    filled: true,
    extruded: true,
    wireframe: true,
    getElevation: (f) =>
      (f.properties.totalSnowDepthChange ?? 0) * 2500,
    getFillColor: (f) =>
      map_COLOR_SCALE(f.properties.airTempMax ?? 0),
    getLineColor: (f) =>
      map_COLOR_SCALE(f.properties.airTempMax ?? 0),
    pickable: true,
    material: {
      ambient: 0.64,
      diffuse: 0.6,
      shininess: 32,
      specularColor: [51, 51, 51],
    },
    transitions: {
      geometry: {
        duration: 3000,
        type: 'spring',
      },
    },
  });
}

function createTerrainLayer() {
  return new TerrainLayer({
    id: 'terrain',
    minZoom: 0,
    maxZoom: 15,
    strategy: 'no-overlap',
    elevationDecoder: MapConfig.elevationDecoder,
    elevationData: MapConfig.terrainImage,
    texture: MapConfig.surfaceImage,
    wireframe: false,
    color: [255, 255, 255],
    material: {
      diffuse: 1,
    },
    operation: 'terrain+draw',
    loadOptions: {
      fetch: {
        mode: 'cors',
      },
    },
  });
}

// Helper function for wind icons
function getWindStrengthIcon(direction: string, speed: number) {
  let strength = 'calm';
  if (speed <= 0.6) strength = 'calm';
  else if (speed <= 16.2) strength = 'light';
  else if (speed <= 25.5) strength = 'moderate';
  else if (speed <= 37.3) strength = 'strong';
  else strength = 'extreme';

  return `wind-direction-${direction}-${strength}`;
}

// const landCover: Position[][] = [
//   [
//     [-139.848974, 30.543541], // Southwest corner (1000 miles SW)
//     [-139.848974, 64.002494], // Northwest corner (1000 miles NW)
//     [-101.916071, 64.002494], // Northeast corner (1000 miles NE)
//     [-101.916071, 30.543541], // Southeast corner (1000 miles SE)
//     [-139.848974, 30.543541], // Close the polygon by repeating first point
//   ],
// ];
