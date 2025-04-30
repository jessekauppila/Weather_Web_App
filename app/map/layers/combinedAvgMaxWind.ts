import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';

/**
 * Creates a composite layer with both average and max wind speed icons
 */
export function createCombinedAvgMaxWindLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  // First layer for average wind speed
  const avgWindLayer = new IconLayer({
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
      // Use latitude for z-indexing (southern stations on top)
      return 100 - f.properties.latitude;
    },
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/avgWindAtlas/avgWind_location_icon_atlas.png',
    iconMapping: '/avgWindAtlas/location-icon-mapping.json',
    pickable: false, // Only top layer is pickable
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });

  // Second layer for maximum wind gust
  const maxWindLayer = new IconLayer({
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
      // Use latitude for z-indexing (southern stations on top)
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

   // Third layer for average wind direction and strength 
  const createWindArrowLayer = new IconLayer({
    id: 'windArrows',
    data: data.features, 
    billboard: false,
    autoHighlight: true,
    getIcon: (f) => {
      if (!f?.properties?.windDirection) {
        return 'default-icon';
      }

      const direction = f.properties.windDirection.toLowerCase();
      if (direction === 'nan' || direction === '') {
        return 'default-icon';
      }

      const speed = f.properties.windSpeedAvg
        ? parseFloat(f.properties.windSpeedAvg.split(' ')[0])
        : 0;
      
      if (isNaN(speed)) {
        return 'default-icon';
      }

      return getWindStrengthIcon(direction, speed);
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 100,
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


/**
 * Helper function to determine the appropriate wind icon based on direction and speed
 */
 function getWindStrengthIcon(direction: string, speed: number) {
  let strength = 'calm';
  if (speed <= 0.6) strength = 'calm';
  else if (speed <= 16.2) strength = 'light';
  else if (speed <= 25.5) strength = 'moderate';
  else if (speed <= 37.3) strength = 'strong';
  else strength = 'extreme';

  return `wind-direction-${direction}-${strength}`;
}


  // Return array of both layers
  return [avgWindLayer, maxWindLayer, createWindArrowLayer];
}

