const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

console.log('Mapbox Token available:', !!MAPBOX_TOKEN);


export const MapConfig = {
  terrainImage: `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=${MAPBOX_TOKEN}`,
  surfaceImage: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${MAPBOX_TOKEN}`,

  elevationDecoder: {
    rScaler: 6553.6,
    gScaler: 25.6,
    bScaler: 0.1,
    offset: -10000,
  },

  // Adjust the elevation decoder to be less extreme



};
