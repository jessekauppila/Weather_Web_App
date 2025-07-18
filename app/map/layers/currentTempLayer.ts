import { IconLayer } from '@deck.gl/layers';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';

/**
 * Creates an icon layer to display current temperature on the map
 */
export function createCurrentTempLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  return new IconLayer({
    id: 'currentTemp',
    data: data.features,

    billboard: false,   //true for 3d, false for 2d
    
    autoHighlight: true,
    getIcon: (f) => {
      if (!f?.properties?.curAirTemp) {
        return 'default-icon';
      }
      const curTemp = parseInt(f.properties.curAirTemp);
      let icon_num = 'minus-9';
      if (curTemp <= -9) icon_num = 'minus-9';
      else if (curTemp <= -1) icon_num = `minus${curTemp}`;
      else if (curTemp <= 119) icon_num = `${curTemp}`;
      else icon_num = '120';
      return `temp-${icon_num}`;
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getElevation: () => 5000, // Fixed height above terrain in meters
    // getElevation: (f: Feature<Geometry, Map_BlockProperties>) => {
    //   return 100 - f.properties.latitude;
    // },
    getSize: 100,
    getAngle: 0,
    iconAtlas:'/currentTempAtlas/currentTemp_location_icon_atlas.png',
    iconMapping: '/currentTempAtlas/location-icon-mapping.json',
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
