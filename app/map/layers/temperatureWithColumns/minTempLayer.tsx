import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../../map';
import { PickingInfo } from '@deck.gl/core';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';

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

      // Parse temperature value, handling both string with units and number
      let minTemp: number;
      if (typeof f.properties.airTempMin === 'string') {
        // Extract number from string like "32 °F" -> 32
        const match = f.properties.airTempMin.match(/^(-?\d+(\.\d+)?)/);
        minTemp = match ? Number(match[0]) : 0;
      } else {
        minTemp = Number(f.properties.airTempMin);
      }

      if (isNaN(minTemp)) {
        return 'default-icon';
      }

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
    getElevation: () => 5000, 
    iconAtlas: '/minTempAtlas/minTemp_location_icon_atlas.png',
    iconMapping: '/minTempAtlas/location-icon-mapping.json',
    pickable: false,
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