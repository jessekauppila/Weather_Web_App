import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../../map';
import { PickingInfo } from '@deck.gl/core';

export function createMinTempLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  return new IconLayer({
    id: 'minTempIcons',
    data: data.features,
    billboard: false,
    autoHighlight: false,
    getIcon: (f) => {
      if (!f?.properties?.airTempMin) {
        return 'default-icon';
      }

      const minTemp = parseInt(f.properties.airTempMin);

      let icon_num = 'minus-9';
      if (minTemp <= -9) icon_num = 'minus-9';
      else if (minTemp <= -1) icon_num = `minus${minTemp}`;
      else if (minTemp <= 119) icon_num = `${minTemp}`;
      else icon_num = '120';

      return `min-temp-${icon_num}`;
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/minTempAtlas/minTemp_location_icon_atlas.png',
    iconMapping: '/minTempAtlas/location-icon-mapping.json',
    pickable: false,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
} 