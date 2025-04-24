import { TerrainLayer } from '@deck.gl/geo-layers';
import { MapConfig } from '../config';

/**
 * Creates a terrain layer to display 3D elevation on the map
 */
export function createTerrainLayer() {
  return new TerrainLayer({
    id: 'terrain',
    minZoom: 0,
    maxZoom: 15,
    strategy: 'no-overlap',
    elevationDecoder: MapConfig.elevationDecoder,
    elevationData: MapConfig.terrainImage,
    texture: MapConfig.surfaceImage,
    wireframe: false,
    color: [255, 255, 255],
    material: {
      diffuse: 1,
    },
    operation: 'terrain+draw',
    loadOptions: {
      fetch: {
        mode: 'cors',
      },
    },
  });
}