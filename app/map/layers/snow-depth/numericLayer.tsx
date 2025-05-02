import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../../map';

export function createSnowDepthNumericLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  return new IconLayer({
    id: 'snow-depth-num-layer',
    data: data.features.filter(f => f.properties.totalSnowDepthChange !== null),
    billboard: false,
    autoHighlight: true,
    getIcon: (d) => {
      const snowDepth = d.properties.totalSnowDepthChange;
      console.log('Processing numeric feature:', {
        station: d.properties.stationName,
        snowDepth,
        hasValue: snowDepth !== null
      });
      
      if (snowDepth === null) {
        console.log('Skipping numeric icon for null snow depth');
        return 'default-icon';
      }

      const snowDepthRounded = Math.round(snowDepth);
      console.log('Rounded snow depth:', snowDepthRounded);

      let icon_num = 'minus-19';
      if (snowDepthRounded <= -19) {
        icon_num = 'minus-19';
        console.log('Using minimum icon for snow depth <= -19');
      }
      else if (snowDepthRounded < 0) {
        icon_num = `minus-${Math.abs(snowDepthRounded)}`;
        console.log('Using negative icon:', icon_num);
      }
      else if (snowDepthRounded <= 49) {
        icon_num = `${snowDepthRounded}`;
        console.log('Using positive icon:', icon_num);
      }
      else {
        icon_num = '50';
        console.log('Using maximum icon for snow depth > 49');
      }

      const icon = `snow-depth-${icon_num}`;
      console.log('Final icon name:', icon);
      return icon;
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/snowDepthAtlas/snowDepth_num_icon_atlas.png',
    iconMapping: '/snowDepthAtlas/num-icon-mapping.json',
    pickable: true,
    onClick,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
} 