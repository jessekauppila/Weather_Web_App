'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Map } from 'react-map-gl/mapbox';
import DeckGL from '@deck.gl/react';
import {
  map_INITIAL_VIEW_STATE,
  map_MAP_STYLE,
  map_lightingEffect,
  map_getTooltip,
} from '../map/map';
import { createMapLayers } from '../map/layers';
import { MapDataProvider, useMapData } from '../data/map/MapDataContext';
import { LayerId } from '../page';
import StationDrawer from './StationDrawer';
import type { WeatherStation } from '../map/map';
import type { PickingInfo } from '@deck.gl/core';
import type { Feature, Geometry } from 'geojson';
import type { Map_BlockProperties } from '../map/map';
import { DayRangeType } from '../types';

interface MapData {
  stationData: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  };
  forecastZones: { name: string; contour: [number, number][] }[];
  observationsDataDay: any;
  observationsDataHour: any;
  filteredObservationsDataHour: any;
}

interface MapComponentProps {
  observationsDataDay: any;
  observationsDataHour: any;
  filteredObservationsDataHour: any;
  isMetric: boolean;
  tableMode: 'summary' | 'daily';
  layerVisibility?: {
    forecastZones: boolean;
    windArrows: boolean;
    snowDepthChange: boolean;
    terrain: boolean;
    currentTemp: boolean;
    minMaxTemp: boolean;
    avgMaxWind: boolean;
  };
  onToggleLayer?: (id: LayerId) => void;
  dayRangeType?: DayRangeType;
  customTime?: string;
  calculateCurrentTimeRange?: () => string;
  timeRangeData: any;
}

// Client-side portal component for Next.js
const ClientPortal = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Find existing portal root or create it
    ref.current = document.querySelector('#drawer-portal-root');
    if (!ref.current) {
      // Create container if it doesn't exist
      const div = document.createElement('div');
      div.id = 'drawer-portal-root';
      
      // Critical styles for proper drawer behavior
      div.style.position = 'fixed';
      div.style.top = '0';
      div.style.left = '0';
      div.style.width = '100%';
      div.style.height = '100%';
      div.style.zIndex = '9999';
      div.style.pointerEvents = 'none'; // Initially pass pointer events through
      div.style.userSelect = 'none'; // Prevent text selection issues during drag
      div.style.touchAction = 'manipulation'; // Better touch handling
      div.style.overflow = 'visible'; // Allow drawer to overflow
      
      document.body.appendChild(div);
      ref.current = div;
    }
    setMounted(true);
    
    // Cleanup function
    return () => {
      // Don't remove the div as other instances might use it
    };
  }, []);

  return mounted && ref.current ? createPortal(children, ref.current) : null;
};

// The actual map component that uses the context
export const MapApp = ({ 
  observationsDataDay,
  observationsDataHour,
  filteredObservationsDataHour,
  isMetric,
  tableMode,
  layerVisibility: externalLayerVisibility,
  onToggleLayer,
  dayRangeType,
  customTime,
  calculateCurrentTimeRange,
  timeRangeData
}: MapComponentProps) => {
  // Get data from context
  const { mapData, isLoading } = useMapData();

  // Layer visibility state - use external if provided, or local state if not
  const [internalLayerVisibility, setInternalLayerVisibility] = useState({
    forecastZones: true,
    windArrows: true,
    snowDepthChange: false,
    terrain: false,
    currentTemp: true,
    minMaxTemp: false,
    avgMaxWind: false,
  });

  // Use either external or internal state
  const layerVisibility = externalLayerVisibility || internalLayerVisibility;

  // Drawer state
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Create a ref to track the current observation data
  const observationDataRef = useRef({
    day: null as any,
    hour: null as any,
    filtered: null as any
  });
  
  // Effect to react to observation data changes
  useEffect(() => {
    // First, check if the observation data has actually changed 
    // to avoid unnecessary updates
    const dataChanged = 
      observationDataRef.current.day !== observationsDataDay ||
      observationDataRef.current.hour !== observationsDataHour ||
      observationDataRef.current.filtered !== filteredObservationsDataHour;
    
    // Only update if data has changed and drawer is open
    if (dataChanged && isDrawerOpen && selectedStation) {
      //console.log('Observation data changed, updating station drawer');
      
      // Update our reference to current data
      observationDataRef.current = {
        day: observationsDataDay,
        hour: observationsDataHour,
        filtered: filteredObservationsDataHour
      };
      
      // If the drawer is open, we should refresh the selected station data
      // to reflect the new time range
      const stationName = selectedStation.Station;
      
      // Find the station in the mapData
      const updatedStationData = (mapData as MapData)?.stationData?.features?.find(
        f => f.properties.stationName === stationName
      );
      
      // Update the selected station with fresh data if found
      if (updatedStationData) {
        const properties = updatedStationData.properties;
        
        // Helper function to format values with units
        const formatValue = (value: number | string | null | undefined, unit: string) => {
          if (value === null || value === undefined || value === '-') return '-';
          return `${value} ${unit}`;
        };
        
        const updatedStation: WeatherStation = {
          ...selectedStation,
          'Cur Air Temp': formatValue(properties.curAirTemp, '°F'),
          '24h Snow Accumulation': formatValue(properties.snowAccumulation24h, 'in'),
          'Air Temp Min': formatValue(properties.airTempMin, '°F'),
          'Air Temp Max': formatValue(properties.airTempMax, '°F'),
          'Total Snow Depth Change': formatValue(properties.totalSnowDepthChange, 'in'),
          'Total Snow Depth': formatValue(properties.totalSnowDepth, 'in'),
          'Api Fetch Time': properties.fetchTime || new Date().toISOString()
        };
        
        setSelectedStation(updatedStation);
      }
    }
  }, [observationsDataDay, observationsDataHour, filteredObservationsDataHour, isDrawerOpen, selectedStation, mapData]);

  // Effect to manage drawer state
  useEffect(() => {
    // If drawer is open, add a class to prevent scrolling on the body
    if (isDrawerOpen) {
      document.body.classList.add('drawer-open');
      
      // Close drawer when escape key is pressed
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsDrawerOpen(false);
          setSelectedStation(null);
        }
      };
      
      window.addEventListener('keydown', handleEscape);
      
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.classList.remove('drawer-open');
    }
  }, [isDrawerOpen, setIsDrawerOpen, setSelectedStation]);

  // Handle station click
  const handleStationClick = useCallback((info: PickingInfo) => {
    if (info.object && 'properties' in info.object) {
      const properties = (info.object as { properties: Map_BlockProperties }).properties;
      
      // Find the full station data from the mapData context
      const fullStationData = (mapData as MapData).stationData.features.find(
        f => f.properties.stationName === properties.stationName
      );

      if (fullStationData) {
        // Helper function to format values with units
        const formatValue = (value: number | string | null | undefined, unit: string) => {
          if (value === null || value === undefined || value === '-') return '-';
          return `${value} ${unit}`;
        };

        const station: WeatherStation = {
          Station: properties.stationName,
          'Cur Air Temp': formatValue(properties.curAirTemp, '°F'),
          '24h Snow Accumulation': formatValue(properties.snowAccumulation24h, 'in'),
          'Cur Wind Speed': properties.curWindSpeed || '-',
          'Elevation': formatValue(properties.elevation, 'ft'),
          'Stid': fullStationData.properties.stationName,
          'Air Temp Min': formatValue(properties.airTempMin, '°F'),
          'Air Temp Max': formatValue(properties.airTempMax, '°F'),
          'Wind Speed Avg': properties.windSpeedAvg || '-',
          'Max Wind Gust': properties.maxWindGust || '-',
          'Wind Direction': properties.windDirection || '-',
          'Total Snow Depth Change': formatValue(properties.totalSnowDepthChange, 'in'),
          'Precip Accum One Hour': properties.precipAccumOneHour || '-',
          'Total Snow Depth': formatValue(properties.totalSnowDepth, 'in'),
          'Latitude': properties.latitude.toString(),
          'Longitude': properties.longitude.toString(),
          'Relative Humidity': formatValue(properties.relativeHumidity, '%'),
          'Api Fetch Time': properties.fetchTime || new Date().toISOString()
        };

        // Set the selected station and open the drawer
        setSelectedStation(station);
        setIsDrawerOpen(true);
      }
    }
  }, [mapData, setSelectedStation, setIsDrawerOpen]);

  // Create layers based on current visibility and data
  const layers = useMemo(
    () => createMapLayers(layerVisibility, mapData as MapData, handleStationClick),
    [layerVisibility, mapData, handleStationClick]
  );

  // // Toggle layer visibility - use external handler if provided, or internal state if not
  // const toggleLayer = (layerId: LayerId) => {
  //   if (onToggleLayer) {
  //     onToggleLayer(layerId);
  //   } else {
  //     setInternalLayerVisibility((prev) => ({
  //       ...prev,
  //       [layerId]: !prev[layerId],
  //     }));
  //   }
  // };

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-30 z-10">
          <div className="bg-white p-4 rounded shadow">
            Loading map data...
          </div>
        </div>
      )}

      <DeckGL
        layers={layers}
        effects={[map_lightingEffect]}
        initialViewState={map_INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={map_getTooltip}
        style={{ width: '100%', height: '100%' }}
      >
        <Map
          reuseMaps
          mapStyle={map_MAP_STYLE}
          mapboxAccessToken={
            process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
          }
        />
      </DeckGL>

      {/* Render StationDrawer using our custom portal */}
      <ClientPortal>
        {timeRangeData && (
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
            dayRangeType={dayRangeType || DayRangeType.MIDNIGHT}
            customTime={customTime || ''}
            calculateCurrentTimeRange={calculateCurrentTimeRange || (() => '1')}
            timeRangeData={timeRangeData}
          />
        )}
      </ClientPortal>
    </div>
  );
};

// Wrapped component with provider
export default function MapComponent(props: MapComponentProps) {
  return (
    <MapDataProvider observationsDataDay={props.observationsDataDay}>
      <MapApp {...props} />
    </MapDataProvider>
  );
} 