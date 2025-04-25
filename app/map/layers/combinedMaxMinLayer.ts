import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';

/**
 * Creates a composite layer with both min and max temperature icons
 */
export function createCombinedMaxMinLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {


    console.log("Data for min/max temp layer:", data.features);
    if (data.features.length > 0) {
      console.log("Sample feature properties:", data.features[0].properties);
      console.log("Has min temp?", !!data.features[0].properties.airTempMin);
      console.log("Has max temp?", !!data.features[0].properties.airTempMax);
    }
    
  // First layer for minimum temperature
  const minTempLayer = new IconLayer({
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
    pickable: false, // Only top layer is pickable
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });

  // Second layer for maximum temperature
  const maxTempLayer = new IconLayer({
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

  // Return array of both layers
  return [minTempLayer, maxTempLayer];
}