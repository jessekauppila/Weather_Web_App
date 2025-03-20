import {
  Color,
  Position,
  PickingInfo,
  MapViewState,
} from '@deck.gl/core';
import React, { useState } from 'react';
import type { Feature, Geometry } from 'geojson';
import { scaleThreshold } from 'd3-scale';
import {
  LightingEffect,
  AmbientLight,
  // Remove: PointLight,
  _SunLight as SunLight,
} from '@deck.gl/core';
import { getMapTooltip } from './UI/MapTooltip';
import StationDrawer from '../components/mapStationCards/StationDrawer';

////////////////////////

export type Map_BlockProperties = {
  stationName: string;
  latitude: number;
  longitude: number;
  totalSnowDepth: number | null;
  totalSnowDepthChange: number | null;
  snowAccumulation24h: number | null;
  curAirTemp: number | null;
  airTempMin: number | null;
  airTempMax: number | null;
  curWindSpeed: string;
  maxWindGust: string;
  windDirection: string;
  windSpeedAvg: string;
  elevation: number | null;
  relativeHumidity: number | null;
  precipAccumOneHour: string | null;
  fetchTime: string;
};

export const map_COLOR_SCALE = scaleThreshold<number, Color>()
  .domain([31, 34])
  .range([
    [255, 255, 255], // White (below 31°F)
    [30, 144, 255], // DodgerBlue (31-34°F)
    [150, 255, 150], // Pastel green (above 34°F)
  ] as Color[]);

export const map_INITIAL_VIEW_STATE: MapViewState = {
  latitude: 48.863017,
  longitude: -121.67785,
  zoom: 6,
  maxZoom: 16,
  pitch: 35,
  bearing: 0,
};

export const map_MAP_STYLE =
  //dark
  //'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';
  //light
  //'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
  //for use with
  'mapbox://styles/mapbox/dark-v11'; //for use with terrain!

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0,
});

const dirLight = new SunLight({
  timestamp: Date.UTC(2019, 7, 1, 22),
  color: [255, 255, 255],
  intensity: 1.0, // Increase light brightness
  _shadow: true,
});

export const map_lightingEffect = new LightingEffect({
  ambientLight,
  dirLight,
});

// Set shadow color
map_lightingEffect.shadowColor = [0, 0, 0, 0.3];

// set plane for shadow
export const map_landCover: Position[][] = [
  [
    [-125.0, 42.0], // Southwest (Southern Oregon)
    [-125.0, 55.0], // Northwest (Northern BC)
    [-115.0, 55.0], // Northeast (Northern BC)
    [-115.0, 42.0], // Southeast (Southern Oregon)
    [-125.0, 42.0], // Close the polygon
  ],
];

export const map_getTooltip = getMapTooltip;

interface MapProps {
  weatherData: WeatherStation[];
  observationsDataDay: any;
  observationsDataHour: any;
  filteredObservationsDataHour: any;
  isMetric: boolean;
  tableMode: 'summary' | 'daily';
}

// Update WeatherStation interface to match StationDrawer's station prop type
export interface WeatherStation {
  Station: string;
  'Cur Air Temp': string;
  '24h Snow Accumulation': string;
  'Cur Wind Speed': string;
  'Elevation': string;
  'Stid': string;
  'Air Temp Min': string;
  'Air Temp Max': string;
  'Wind Speed Avg': string;
  'Max Wind Gust': string;
  'Wind Direction': string;
  'Total Snow Depth Change': string;
  'Precip Accum One Hour': string;
  'Total Snow Depth': string;
  'Latitude': string;
  'Longitude': string;
  'Relative Humidity': string;
  'Api Fetch Time': string;
  [key: string]: string;
}

export function Map({ 
  weatherData,
  observationsDataDay,
  observationsDataHour,
  filteredObservationsDataHour,
  isMetric,
  tableMode
}: MapProps) {
  const [hoverInfo, setHoverInfo] = useState<PickingInfo | null>(null);
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleStationClick = (info: PickingInfo) => {
    if (info.object) {
      const feature = info.object as Feature<Geometry, Map_BlockProperties>;
      const station = weatherData.find(s => s.Station === feature.properties.stationName);
      if (station) {
        setSelectedStation(station);
        setIsDrawerOpen(true);
      }
    }
  };

  return (
    <>
      {/* Your existing map rendering code here */}
      {hoverInfo && <div dangerouslySetInnerHTML={{ __html: getMapTooltip(hoverInfo)?.html || '' }} />}
      
      <StationDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedStation(null);
        }}
        station={selectedStation}
        observationsDataDay={observationsDataDay}
        observationsDataHour={observationsDataHour}
        filteredObservationsDataHour={filteredObservationsDataHour}
        isMetric={isMetric}
        tableMode={tableMode}
      />
    </>
  );
}

export function map_weatherToGeoJSON(weatherData: WeatherStation[]): {
  type: 'FeatureCollection';
  features: Feature<Geometry, Map_BlockProperties>[];
} {
  const parseValue = (value: string) => {
    if (!value || value === '-') return null;
    const num = parseFloat(value.split(' ')[0]);
    return isNaN(num) ? null : num;
  };

  // Function to create a circular polygon
  const createCircle = (
    longitude: number,
    latitude: number,
    radius: number,
    numPoints: number = 32
  ) => {
    const coordinates = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI; // Distribute points evenly
      const dx = radius * Math.cos(angle);
      const dy = radius * Math.sin(angle);
      coordinates.push([longitude + dx, latitude + dy]);
    }
    coordinates.push(coordinates[0]); // Close the polygon
    return [coordinates]; // GeoJSON expects an array of rings
  };

  return {
    type: 'FeatureCollection' as const,
    features: weatherData.map((station) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: createCircle(
          parseFloat(station['Longitude']),
          parseFloat(station['Latitude']),
          0.03, // Adjust radius as needed
          8 // Adjust number of points as needed
        ),
      },
      properties: {
        stationName: station['Station'],
        latitude: parseFloat(station['Latitude']),
        longitude: parseFloat(station['Longitude']),
        totalSnowDepth: parseValue(station['Total Snow Depth']),
        totalSnowDepthChange: parseValue(
          station['Total Snow Depth Change']
        ),
        snowAccumulation24h: parseValue(
          station['24h Snow Accumulation']
        ),
        curAirTemp: parseValue(station['Cur Air Temp']),
        airTempMin: parseValue(station['Air Temp Min']),
        airTempMax: parseValue(station['Air Temp Max']),
        curWindSpeed: station['Cur Wind Speed'],
        maxWindGust: station['Max Wind Gust'],
        windDirection: station['Wind Direction'],
        windSpeedAvg: station['Wind Speed Avg'],
        elevation: parseValue(station['Elevation']),
        relativeHumidity: parseValue(station['Relative Humidity']),
        precipAccumOneHour: station['Precip Accum One Hour'] === '-' ? null : station['Precip Accum One Hour'],
        fetchTime: station['Api Fetch Time'],
      },
    })),
  };
}
