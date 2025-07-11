const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

console.log('Mapbox Token available:', !!MAPBOX_TOKEN);


export const MapConfig = {
  terrainImage: `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=${MAPBOX_TOKEN}`,
  
  // Original bright satellite imagery
  surfaceImage: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${MAPBOX_TOKEN}`,
  
  // MUTED OPTIONS - choose one:
  
  // Option 1: Light grayscale map (very muted)
  surfaceImageMuted: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
  
  // Option 2: Outdoors style (more natural, less saturated)
  surfaceImageOutdoors: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
  
  // Option 3: Streets style (very minimal)
  surfaceImageStreets: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,

  elevationDecoder: {
    rScaler: 6553.6,
    gScaler: 25.6,
    bScaler: 0.1,
    offset: -10000,
  },
};
