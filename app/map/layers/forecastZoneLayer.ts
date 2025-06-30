import { PolygonLayer } from '@deck.gl/layers';

// I still have to make this float above the terrain layer or on top ofit 

/**
 * Creates a polygon layer to display forecast zones on the map
 */
export function createForecastZoneLayer(
  data: { name: string; contour: [number, number][] }[]
) {
  return new PolygonLayer({
    id: 'forecast-zones',
    data,
    stroked: true,
    filled: false,
    getPolygon: (d) => d.contour,
    getLineColor: [100, 0, 100, 200],
    getLineWidth: 2000,
    pickable: true,
  });
} 