import {
  Color,
  Position,
  PickingInfo,
  MapViewState,
} from '@deck.gl/core';
import React, { useState, useEffect } from 'react';
import {
  LightingEffect,
  AmbientLight,
  // Remove: PointLight,
  _SunLight as SunLight,
} from '@deck.gl/core';
import { getMapTooltip } from '../components/MapTooltip';

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
  Stid: string;
};

// export const map_COLOR_SCALE = scaleThreshold<number, Color>()
  // .domain([31, 34])
  // .range([
  //   [255, 255, 255], // White (below 31°F)
  //   [30, 144, 255], // DodgerBlue (31-34°F)
  //   [150, 255, 150], // Pastel green (above 34°F)
  // ] as Color[]);

export const map_INITIAL_VIEW_STATE: MapViewState = {
  latitude: 47,
  longitude: -121.7,
  zoom: 7.1,
  maxZoom: 15,
  pitch: 45,
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
  _shadow: false,
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

// // Define the MapData interface here to avoid import errors
// interface MapData {
//   stationData: {
//     type: 'FeatureCollection';
//     features: Feature<Geometry, Map_BlockProperties>[];
//   };
//   forecastZones: { name: string; contour: number[][] }[];
//   observationsDataHour: {
//     data: any[];
//     title: string;
//   };
//   filteredObservationsDataHour: {
//     data: any[];
//     title: string;
//   };
//   observationsDataDay: {
//     data: any[];
//     title: string;
//   };
// }

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
  
  // State for local observations data
  const [localObservationsDataDay, setLocalObservationsDataDay] = useState(observationsDataDay || { data: [], title: 'Day Data' });
  const [localObservationsDataHour, setLocalObservationsDataHour] = useState(observationsDataHour || { data: [], title: 'Hour Data' });
  const [localFilteredObservationsDataHour, setLocalFilteredObservationsDataHour] = useState(filteredObservationsDataHour || { data: [], title: 'Filtered Hour Data' });

  // Update local state when props change
  useEffect(() => {
    if (observationsDataDay?.data?.length) {
      console.log("Updating localObservationsDataDay with data length:", observationsDataDay.data.length);
      setLocalObservationsDataDay(observationsDataDay);
    }
    
    if (observationsDataHour?.data?.length) {
      console.log("Updating localObservationsDataHour with data length:", observationsDataHour.data.length);
      setLocalObservationsDataHour(observationsDataHour);
    }
    
    if (filteredObservationsDataHour?.data?.length) {
      console.log("Updating localFilteredObservationsDataHour with data length:", filteredObservationsDataHour.data.length);
      setLocalFilteredObservationsDataHour(filteredObservationsDataHour);
    }
  }, [observationsDataDay, observationsDataHour, filteredObservationsDataHour]);

  // Create test data when component mounts if there's no real data
  useEffect(() => {
    // Check if we need to create test data
    const needsTestData = (
      !localObservationsDataHour?.data?.length || 
      !localFilteredObservationsDataHour?.data?.length ||
      !localObservationsDataDay?.data?.length
    );
    
    if (needsTestData && weatherData && weatherData.length > 0) {
      console.log("Creating test data for observations since none is available");
      
      // Create test data for all stations
      const testHourlyData = weatherData.flatMap(station => 
        Array.from({ length: 24 }, (_, i) => {
          const date = new Date();
          date.setHours(date.getHours() - i);
          return {
            Station: station.Station,
            Day: date.toLocaleDateString(),
            Hour: date.toLocaleTimeString(),
            // Include both naming formats for compatibility
            'Snow Depth': station['Total Snow Depth'] || '0 in',
            'Total Snow Depth': station['Total Snow Depth'] || '0 in',
            'New Snow': station['24h Snow Accumulation'] || '0 in',
            '24h Snow Accumulation': station['24h Snow Accumulation'] || '0 in',
            // Temperature fields in both formats
            'Air Temp': station['Cur Air Temp'] || '0 °F',
            'Cur Air Temp': station['Cur Air Temp'] || '0 °F',
            'Air Temp Min': station['Air Temp Min'] || '0 °F',
            'Air Temp Max': station['Air Temp Max'] || '0 °F',
            // Precipitation fields in both formats
            'Precip': station['Precip Accum One Hour'] || '0 in',
            'Precip Accum One Hour': station['Precip Accum One Hour'] || '0 in',
            // Add any other fields needed by visualizations
            'Wind Direction': station['Wind Direction'] || '0°',
            'Wind Speed Avg': station['Wind Speed Avg'] || '0 mph',
            'Max Wind Gust': station['Max Wind Gust'] || '0 mph',
            'Cur Wind Speed': station['Cur Wind Speed'] || '0 mph',
            'Total Snow Depth Change': station['Total Snow Depth Change'] || '0 in',
            'Relative Humidity': station['Relative Humidity'] || '0%'
          };
        })
      );
      
      // Create the hourly data objects
      const newHourlyData = {
        data: testHourlyData,
        title: 'Test Hourly Data'
      };

      const newFilteredData = {
        data: testHourlyData, // Using the same data for both for simplicity
        title: 'Test Filtered Hourly Data'
      };
      
      // Create daily data with same field format for compatibility
      const newDailyData = {
        data: weatherData.map(station => ({
          Station: station.Station,
          Day: new Date().toLocaleDateString(),
          // Include both naming formats
          'Snow Depth': station['Total Snow Depth'] || '0 in',
          'Total Snow Depth': station['Total Snow Depth'] || '0 in',
          'New Snow': station['24h Snow Accumulation'] || '0 in',
          '24h Snow Accumulation': station['24h Snow Accumulation'] || '0 in',
          'Air Temp': station['Cur Air Temp'] || '0 °F',
          'Cur Air Temp': station['Cur Air Temp'] || '0 °F',
          'Air Temp Min': station['Air Temp Min'] || '0 °F',
          'Air Temp Max': station['Air Temp Max'] || '0 °F',
          'Precip': station['Precip Accum One Hour'] || '0 in',
          'Precip Accum One Hour': station['Precip Accum One Hour'] || '0 in',
          'Wind Direction': station['Wind Direction'] || '0°',
          'Wind Speed Avg': station['Wind Speed Avg'] || '0 mph',
          'Max Wind Gust': station['Max Wind Gust'] || '0 mph',
          'Cur Wind Speed': station['Cur Wind Speed'] || '0 mph',
          'Total Snow Depth Change': station['Total Snow Depth Change'] || '0 in',
          'Relative Humidity': station['Relative Humidity'] || '0%'
        })),
        title: 'Test Daily Data'
      };

      console.log("Setting test data:", {
        hourly: newHourlyData.data.length,
        filtered: newFilteredData.data.length,
        daily: newDailyData.data.length
      });
      
      // Set all the state at once
      setLocalObservationsDataHour(newHourlyData);
      setLocalFilteredObservationsDataHour(newFilteredData);
      setLocalObservationsDataDay(newDailyData);
    }
  }, [weatherData, localObservationsDataHour, localObservationsDataDay, localFilteredObservationsDataHour]);
  
  // Log the data for debugging every time the drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      console.log("StationDrawer props - DATA CHECK:", {
        selectedStation: selectedStation?.Station,
        observationsDataDay: {
          title: localObservationsDataDay?.title,
          length: localObservationsDataDay?.data?.length || 0
        },
        observationsDataHour: {
          title: localObservationsDataHour?.title,
          length: localObservationsDataHour?.data?.length || 0
        },
        filteredObservationsDataHour: {
          title: localFilteredObservationsDataHour?.title,
          length: localFilteredObservationsDataHour?.data?.length || 0
        }
      });

      // Verify the data format is what StationDrawer expects
      if (localFilteredObservationsDataHour?.data && selectedStation) {
        const testFiltered = localFilteredObservationsDataHour.data.filter(
          (obs: any) => obs.Station === selectedStation.Station
        );
        
        console.log(`DATA CHECK: Found ${testFiltered.length} filtered data points for station ${selectedStation.Station}`);
        if (testFiltered.length > 0) {
          console.log("Sample filtered data point:", testFiltered[0]);
        } else {
          console.log("No filtered data found for this station");
        }
      }
    }
  }, [isDrawerOpen, selectedStation, localObservationsDataDay, localObservationsDataHour, localFilteredObservationsDataHour]);


              
              return (
    <>
      {/* Your existing map rendering code here */}
      {hoverInfo && <div dangerouslySetInnerHTML={{ __html: getMapTooltip(hoverInfo)?.html || '' }} />}
    </>
  );
}
