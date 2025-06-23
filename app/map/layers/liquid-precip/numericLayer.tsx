import { IconLayer } from '@deck.gl/layers';
import type { Feature, Geometry } from 'geojson';
import { PickingInfo } from '@deck.gl/core';
import { Map_BlockProperties } from '../../map';

function getprecipAccumIcon(depth: number | null): string {
  // Handle negative or null values
  if (depth === null || depth < 0) {
    return 'liquid-precip-0.0';
  }

  // Handle values greater than 60
  if (depth > 60) {
    return 'liquid-precip-60+';
  }

  // Handle values between 0 and 0.9
  if (depth < 1) {
    // Round to nearest 0.1
    const roundedDepth = Math.round(depth * 10) / 10;
    return `liquid-precip-${roundedDepth.toFixed(1)}`;
  }

  // Handle values between 1 and 60
  return `liquid-precip-${Math.round(depth)}`;
}

// Remove the unit (" in") and convert to number
const parseValue = (value: string): number => {
  if (!value) return 0;
  // Extract just the number part before " in"
  const numStr = value.split(' ')[0];
  // Convert to float
  return parseFloat(numStr);
};

export function createLiquidPrecipNumericLayer(
  data: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  },
  onClick?: (info: PickingInfo) => void
) 

{


  return new IconLayer({
    id: 'liquidPrecipNumeric',
    data: data.features.filter(f => {
      // Skip if value is null, "-", or would parse to NaN
      const value = f.properties.precipAccumOneHour;
      if (!value || value === "-") return false;
      
      const parsed = parseValue(value);
      return !isNaN(parsed);
    }),
    billboard: false,
    autoHighlight: true,
    getIcon: (f) => {
      const precipAccumOneHour = f.properties.precipAccumOneHour;
      // console.log('🔧 Liquid Precip Numeric Layer: Precip Accum One Hour:', precipAccumOneHour);
      const parsedValue = parseValue(precipAccumOneHour);
      // console.log('🔧 Parsed Liquid Precip: Precip Accum One Hour:', precipAccumOneHour);
      return getprecipAccumIcon(parsedValue);
    },
    getPosition: (f) => [
      f.properties.longitude,
      f.properties.latitude,
    ],
    getSize: 100,
    getAngle: 0,
    angleAlignment: 'viewport',
    iconAtlas: '/liquidPrecipAtlas/water_num_icon_atlas.png',
    iconMapping: '/liquidPrecipAtlas/num-icon-mapping.json',
    pickable: true,
    onClick,
    shadowEnabled: false,
    alphaCutoff: 0.05,
    sizeScale: 1,
  });
} 