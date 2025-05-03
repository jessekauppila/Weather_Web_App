import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../../map';

export function createMaxWindLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  return new IconLayer({
    id: 'maxWindIcons',
    data: data.features,
    billboard: false,
    autoHighlight: true,
    getIcon: (f) => {
      if (!f?.properties?.maxWindGust) {
        return 'default-icon';
      }

      const maxWindGust = parseInt(f.properties.maxWindGust);
      if (isNaN(maxWindGust)) {
        return 'default-icon';
      }

      let icon_num;
      
      if (maxWindGust <= 59) {
        icon_num = `${maxWindGust}`;
      } else {
        icon_num = '60';
      }

      return `max-wind-${icon_num}`;
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getElevation: (f: Feature<Geometry, Map_BlockProperties>) => {
      return 100 - f.properties.latitude;
    },
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/maxWindAtlas/maxWind_location_icon_atlas.png',
    iconMapping: '/maxWindAtlas/location-icon-mapping.json',
    pickable: true,
    onClick,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
} 