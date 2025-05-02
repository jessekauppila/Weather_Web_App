import { IconLayer, GeoJsonLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../map';

/**
 * Creates a composite layer combining snow depth visualization with boundary and numeric icons
 */
export function createCombinedSnowDepthNumsAndCols(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) {
  // First layer for boundary icons
  const snowDepthBoundaryLayer = new IconLayer({
    id: 'snowDepthBoundary',
    data: data.features,
    billboard: false,
    autoHighlight: false,
    getIcon: (f) => {
      if (!f?.properties?.totalSnowDepthChange) {
        return 'default-icon';
      }

      return f.properties.totalSnowDepthChange > 0 
        ? 'snow-depth-boundary-positive'
        : 'snow-depth-boundary-negative';
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/snowDepthAtlas/snowDepth_boundary_atlas.png',
    iconMapping: '/snowDepthAtlas/boundary-icon-mapping.json',
    pickable: false, // Only top layer is pickable
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });

  // Second layer for numeric icons
  const snowDepthNumLayer = new IconLayer({
    id: 'snowDepthIcons',
    data: data.features,
    billboard: false,
    autoHighlight: true,
    getIcon: (f) => {
      if (!f?.properties?.totalSnowDepthChange) {
        return 'default-icon';
      }

      const snowDepth = Math.round(f.properties.totalSnowDepthChange);

      let icon_num = 'minus-19';
      if (snowDepth <= -19) icon_num = 'minus-19';
      else if (snowDepth <= -10) icon_num = `minus${snowDepth}`;
      else if (snowDepth <= 49) icon_num = `${snowDepth}`;
      else icon_num = '50';

      return `snow-depth-${icon_num}`;
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/snowDepthAtlas/snowDepthNum_icon_atlas.png',
    iconMapping: '/snowDepthAtlas/location-icon-mapping.json',
    pickable: true,
    onClick,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });

  function absValueSnowDepthChange(f: Feature<Geometry, Map_BlockProperties>) {
    return Math.abs(f.properties.totalSnowDepthChange ?? 0);
  }

  function createSnowDepthColLayer(
    data: {
      type: 'FeatureCollection';
      features: Feature<Geometry, Map_BlockProperties>[];
    },
    onClick?: (info: PickingInfo) => void
  ) {
    return new GeoJsonLayer({
      id: 'snowDepthChange',
      data,
      opacity: 0.8,
      stroked: false,
      filled: true,
      extruded: true,
      wireframe: true,
      getElevation: (f) => (absValueSnowDepthChange(f) ?? 0) * 2500,
      getFillColor: (f: Feature<Geometry, Map_BlockProperties>) => {
        if ((f.properties.totalSnowDepthChange ?? 0) > 0) {
          return [255, 255, 255];
        } else {
          return [250, 171, 13];
        }
      },
      getLineColor: (f: Feature<Geometry, Map_BlockProperties>) => {
        if ((f.properties.totalSnowDepthChange ?? 0) > 0) {
          return [255, 255, 255];
        } else {
          return [250, 171, 13];
        }
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

  // Create the base snow depth layer
  const snowDepthColLayer = createSnowDepthColLayer(data, onClick);

  // Return array of all layers
  return [snowDepthNumLayer, snowDepthColLayer, snowDepthBoundaryLayer];
}
