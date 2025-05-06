import { GeoJsonLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../../map';
import { getTemperatureColor } from './tempColorUtils';

// Function to create a circular polygon
const createCircle = (
  longitude: number,
  latitude: number,
  radius: number = 0.03,
  numPoints: number = 32
) => {
  const coordinates = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const dx = radius * Math.cos(angle);
    const dy = radius * Math.sin(angle);
    coordinates.push([longitude + dx, latitude + dy]);
  }
  coordinates.push(coordinates[0]); // Close the polygon
  return [coordinates];
};

export function createCurrentTempColLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  // Create new features with offset circles
  const offsetData = {
    type: 'FeatureCollection' as const,
    features: data.features.map(feature => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: createCircle(
          feature.properties.longitude,
          feature.properties.latitude,
          0.03,
          32
        )
      },
      properties: feature.properties
    }))
  };

  return new GeoJsonLayer({
    id: 'currentTempCol',
    data: offsetData,
    opacity: 1,
    stroked: false,
    filled: true,
    extruded: true,
    wireframe: true,
    getElevation: (f) => {
      const temp = f.properties.curAirTemp;
      if (temp === null || isNaN(temp)) return 0;
      return Math.abs(temp) * 1000; // Scale factor for visualization
    },
    getFillColor: (f: Feature<Geometry, Map_BlockProperties>) => {
      return getTemperatureColor(f.properties.curAirTemp);
    },
    getLineColor: (f: Feature<Geometry, Map_BlockProperties>) => {
      return getTemperatureColor(f.properties.curAirTemp);
    },
    pickable: true,
    onClick,
    material: {
      ambient: 0.64,
      diffuse: 0.6,
      shininess: 32,
      specularColor: [51, 51, 51],
    },
    transitions: {
      geometry: {
        duration: 3000,
        type: 'spring',
      },
    },
  });
} 