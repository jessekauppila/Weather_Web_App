import { GeoJsonLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../../map';

// function absValueSnowDepthChange(f: Feature<Geometry, Map_BlockProperties>) {
//   return Math.abs(f.properties.totalSnowDepthChange ?? 0);
// }

// Function to create a circular polygon
const createCircle = (
  longitude: number,
  latitude: number,
  radius: number = 0.01,
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

export function createSnowAccumColumnLayer(
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
          feature.properties.longitude-.01,
          feature.properties.latitude,
          0.01,
          32
        )
      },
      properties: feature.properties
    }))
  };

  return new GeoJsonLayer({
    id: 'snowAccumChange',
    data: offsetData,
    opacity: ((f: Feature<Geometry, Map_BlockProperties>) => {
      const change = f.properties.snowAccumulation24h;
      return (change === null || change === undefined || typeof change === 'string' || change === 0 || isNaN(change) || change < 0.5) ? 0 : 1;
    }) as any,
    filled: ((f: Feature<Geometry, Map_BlockProperties>) => {
      const change = f.properties.snowAccumulation24h;
      return !(change === null || change === undefined || typeof change === 'string' || change === 0 || isNaN(change) || change < 0.5);
    }) as any,
    extruded: ((f: Feature<Geometry, Map_BlockProperties>) => {
      const change = f.properties.snowAccumulation24h;
      return !(change === null || change === undefined || typeof change === 'string' || change === 0 || isNaN(change) || change < 0.5);
    }) as any,
    wireframe: ((f: Feature<Geometry, Map_BlockProperties>) => {
      const change = f.properties.snowAccumulation24h;
      return !(change === null || change === undefined || typeof change === 'string' || change === 0 || isNaN(change) || change < 0.5);
    }) as any,
    stroked: false,
    getElevation: (f) => {
      const change = f.properties.snowAccumulation24h;
      if (change === 0 || isNaN(change)) return 0;
      return (change ?? 0) * 1200;
    },
    getFillColor: (f: Feature<Geometry, Map_BlockProperties>) => {
        //return [255, 255, 255];
        return f.properties.snowAccumulation24h ? (f.properties.snowAccumulation24h < 0.5 ? [255, 255, 255, 0] : [255, 255, 255, 255]) : [255, 255, 255, 255];
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
    // getPolygonOffset: () => [-10, 0],
    // radiusScale: 0.7,
  });
} 