import { GeoJsonLayer } from '@deck.gl/layers';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import type { FeatureCollection, Polygon } from 'geojson';

/**
 * Creates a GeoJSON layer to display forecast zones on the map
 */
export function createForecastZoneLayer(
  data: FeatureCollection<Polygon>
) {
  console.log('🔍 Creating forecast zone layer with data:', data);
  console.log('🔍 Features count:', data?.features?.length || 0);
  
  const layer = new GeoJsonLayer({
    id: 'forecast-zones',
    data: data,
    stroked: true,
    filled: true,
    getFillColor: [100, 0, 100, 25],
    getLineColor: [100, 0, 100, 255],
    getLineWidth: 2000,
    lineWidthMinPixels: 3,
    pickable: true,
    // Temporarily remove TerrainExtension to debug
    // extensions: [new TerrainExtension()]
  });
  
  console.log('🔍 Created forecast zone layer:', layer);
  return layer;
} 