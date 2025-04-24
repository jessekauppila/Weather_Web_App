import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';

/**
 * Creates an icon layer to display minimum temperature on the map
 */
export function createMinTempLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  return new IconLayer({
    id: 'minTemp',
    data: data.features,
    billboard: false,
    autoHighlight: true,
    getIcon: (f) => {
      if (!f?.properties?.airTempMin) {
        return 'default-icon';
      }

      const minTemp = parseInt(f.properties.airTempMin);

      let icon_num = 'minus-9';
      if (minTemp <= -9) icon_num = 'minus-9';
      else if (minTemp <= -1) icon_num = `minus${minTemp}`;
      else if (minTemp <= 59) icon_num = `${minTemp}`;
      else icon_num = '60';

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
    pickable: true,
    onClick,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
}
