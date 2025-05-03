import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../../map';

export function createMaxTempLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  return new IconLayer({
    id: 'maxTempIcons',
    data: data.features,
    billboard: false,
    autoHighlight: true,
    getIcon: (f) => {
      if (!f?.properties?.airTempMax) {
        return 'default-icon';
      }

      const maxTemp = parseInt(f.properties.airTempMax);

      let icon_num = 'minus-9';
      if (maxTemp <= -9) icon_num = 'minus-9';
      else if (maxTemp <= -1) icon_num = `minus${maxTemp}`;
      else if (maxTemp <= 59) icon_num = `${maxTemp}`;
      else icon_num = '60';

      return `max-temp-${icon_num}`;
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/maxTempAtlas/maxTemp_location_icon_atlas.png',
    iconMapping: '/maxTempAtlas/location-icon-mapping.json',
    pickable: true,
    onClick,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
} 