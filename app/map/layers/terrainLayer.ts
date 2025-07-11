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
    
    // CHOOSE YOUR PREFERRED MUTED TEXTURE:
    //texture: MapConfig.surfaceImageMuted,        // Very muted grayscale
     texture: MapConfig.surfaceImageOutdoors,  // Natural but less saturated  
    // texture: MapConfig.surfaceImageStreets,   // Minimal streets style
    // texture: MapConfig.surfaceImage,          // Original bright satellite
    
    wireframe: false,
    
    // COLOR TINTING OPTIONS:
    color: [200, 200, 200],        // Gray tint (makes everything more muted)
    // color: [255, 255, 255],     // No tint (original colors)
    // color: [180, 190, 200],     // Cool blue-gray tint
    // color: [200, 195, 180],     // Warm beige tint
    
    operation: 'terrain+draw',
  });
}