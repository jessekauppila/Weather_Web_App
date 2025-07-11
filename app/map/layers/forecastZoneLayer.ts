import { GeoJsonLayer } from '@deck.gl/layers';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import type { FeatureCollection, LineString } from 'geojson';

/**
 * Creates a GeoJSON layer to display forecast zones on the map
 */
export function createForecastZoneLayer(
  data: FeatureCollection<LineString>
) {

  // Build layer configuration
  const layerConfig: any = {
    id: 'forecast-zones',
    data: data,
    
    getLineColor: [255, 0, 255, 255], // Bright magenta for visibility
    getLineWidth: 4, // Extra thick for testing
    lineWidthMinPixels: 10,
    pickable: true
  };


    layerConfig.parameters = {
      depthTest: false,
      depthMask: false
    };
    // layerConfig.extensions = [new TerrainExtension()];
    layerConfig.terrainDrawMode = 'drape';
  
  
  const layer = new GeoJsonLayer(layerConfig);
  
  return layer;
} 