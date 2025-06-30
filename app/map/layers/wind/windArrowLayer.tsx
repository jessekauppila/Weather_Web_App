import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../../map';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';

function getWindStrengthIcon(direction: string, speed: number) {
  let strength = 'calm';
  if (speed <= 0.6) strength = 'calm';
  else if (speed <= 16.2) strength = 'light';
  else if (speed <= 25.5) strength = 'moderate';
  else if (speed <= 37.3) strength = 'strong';
  else strength = 'extreme';

  return `wind-direction-${direction}-${strength}`;
}

export function createWindArrowLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
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
      if (direction === 'nan' || direction === '') {
        return 'default-icon';
      }

      const speed = f.properties.windSpeedAvg
        ? parseFloat(f.properties.windSpeedAvg.split(' ')[0])
        : 0;
      
      if (isNaN(speed)) {
        return 'default-icon';
      }

      return getWindStrengthIcon(direction, speed);
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 100,
    getAngle: 0,
    getElevation: () => 5000, // Fixed height above terrain in meters

    // angleAlignment: 'viewport',
    iconAtlas: '/windAtlas/wind_arrows_location_icon_atlas.png',
    iconMapping: '/windAtlas/location-icon-mapping.json',
    pickable: true,
    onClick,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,

    angleAlignment: 'viewport', //'viewport' for 3d, 'screen' for 2d
    parameters: {
      depthTest: false,      // Disable depth testing completely
      depthMask: false
    },
    extensions: [new TerrainExtension()],
  });
} 