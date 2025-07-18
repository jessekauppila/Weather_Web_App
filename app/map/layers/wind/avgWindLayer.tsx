import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../../map';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';

export function createAvgWindLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  }
) {
  return new IconLayer({
    id: 'avgWindIcons',
    data: data.features,
    billboard: false,
    autoHighlight: false,
    getIcon: (f) => {
      if (!f?.properties?.windSpeedAvg) {
        return 'default-icon';
      }

      const avgWind = parseInt(f.properties.windSpeedAvg);
      if (isNaN(avgWind)) {
        return 'default-icon';
      }

      let icon_num;
      
      if (avgWind <= 59) {
        icon_num = `${avgWind}`;
      } else {
        icon_num = '60';
      }

      return `avg-wind-${icon_num}`;
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
    iconAtlas: '/avgWindAtlas/avgWind_location_icon_atlas.png',
    iconMapping: '/avgWindAtlas/location-icon-mapping.json',
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