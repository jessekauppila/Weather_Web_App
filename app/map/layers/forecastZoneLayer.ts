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
    
    getLineColor: [100, 0, 100, 200],
    getLineWidth: .5, // Extra thick for testing
    lineWidthMinPixels: 10,
    pickable: false
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