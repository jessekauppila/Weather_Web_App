import { GeoJsonLayer } from '@deck.gl/layers';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import type { FeatureCollection, LineString } from 'geojson';

/**
 * Creates a GeoJSON layer to display forecast zones on the map
 */
export function createForecastZoneLayer(
  data: FeatureCollection<LineString>
) {
  // Detailed data validation logging
  console.log('🔍 Creating forecast zone layer with data:', {
    type: data?.type,
    featureCount: data?.features?.length,
    isValidGeoJSON: data?.type === 'FeatureCollection' && Array.isArray(data?.features),
    firstFeature: data?.features?.[0]
  });
  
  const layer = new GeoJsonLayer({
    id: 'forecast-zones',
    data,
    
    // Styling for LineStrings
    getLineColor: [100, 0, 100, 255], // Solid purple lines
    getLineWidth: 2000,
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: 3,
    pickable: false,

    // // Remove polygon-specific properties
    // stroked: false,  // Not needed for LineStrings
    // wireframe: false, // Not needed for LineStrings

    //extensions: [new TerrainExtension()],

  });
  
  console.log('🔍 Created forecast zone layer:', {
    id: layer.id,
    props: layer.props,
    hasData: Boolean(layer.props.data)
  });
  
  return layer;
} 