import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';

/**
 * Creates an icon layer to display wind direction arrows on the map
 */
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
    onClick,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
}

/**
 * Helper function to determine the appropriate wind icon based on direction and speed
 */
export function getWindStrengthIcon(direction: string, speed: number) {
  let strength = 'calm';
  if (speed <= 0.6) strength = 'calm';
  else if (speed <= 16.2) strength = 'light';
  else if (speed <= 25.5) strength = 'moderate';
  else if (speed <= 37.3) strength = 'strong';
  else strength = 'extreme';

  return `wind-direction-${direction}-${strength}`;
}
