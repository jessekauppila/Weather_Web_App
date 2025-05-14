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
import StationDrawer from './StationDrawer';
import type { WeatherStation } from '../map/map';
import type { PickingInfo } from '@deck.gl/core';
import type { Feature, Geometry } from 'geojson';
import type { Map_BlockProperties } from '../map/map';
import { DayRangeType } from '../types';
import { Switch } from '@mui/material';
import { LayerId, LayerState, getLayerVisibility } from '@/app/types/layers';
import useStationDrawer from '@/app/hooks/useStationDrawer';
//import LayerToolbar from './LayerToolbar';

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
  dayRangeType?: DayRangeType;
  customTime?: string;
  calculateCurrentTimeRange?: () => string;
  timeRangeData: any;
  activeLayerState: LayerState;
  onLayerToggle: (layerId: LayerId) => void;
  selectedStationId: string | null;

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
  dayRangeType,
  customTime,
  calculateCurrentTimeRange,
  timeRangeData,
  activeLayerState,
  onLayerToggle,
  selectedStationId,

}: MapComponentProps) => {
  const { mapData, isLoading } = useMapData();
  const { 
    selectedStation, 
    isDrawerOpen, 
    handleStationSelect,
    closeDrawer 
  } = useStationDrawer();

  // Helper to convert Map_BlockProperties to WeatherStation
  const mapPropertiesToWeatherStation = (properties: Map_BlockProperties): WeatherStation => ({
    Station: properties.stationName,
    'Cur Air Temp': properties.curAirTemp?.toString() ?? '-',
    '24h Snow Accumulation': properties.snowAccumulation24h?.toString() ?? '-',
    'Cur Wind Speed': properties.curWindSpeed ?? '-',
    'Elevation': properties.elevation?.toString() ?? '-',
    'Stid': properties.Stid ?? '-',
    'Air Temp Min': properties.airTempMin?.toString() ?? '-',
    'Air Temp Max': properties.airTempMax?.toString() ?? '-',
    'Wind Speed Avg': properties.windSpeedAvg ?? '-',
    'Max Wind Gust': properties.maxWindGust ?? '-',
    'Wind Direction': properties.windDirection ?? '-',
    'Total Snow Depth Change': properties.totalSnowDepthChange?.toString() ?? '-',
    'Precip Accum One Hour': properties.precipAccumOneHour ?? '-',
    'Total Snow Depth': properties.totalSnowDepth?.toString() ?? '-',
    'Latitude': properties.latitude?.toString() ?? '-',
    'Longitude': properties.longitude?.toString() ?? '-',
    'Relative Humidity': properties.relativeHumidity?.toString() ?? '-',
    'Api Fetch Time': properties.fetchTime ?? new Date().toISOString()
  });

  // This function can be used for both map clicks and dropdown selection
  const selectStationById = useCallback((stationIdentifier: string | number) => {
    const stationIdString = String(stationIdentifier);
    const feature = mapData.stationData.features.find(
      f =>
        f.properties.stationName === stationIdString ||
        f.properties.Stid === stationIdString
    );
    if (!feature) {
      console.log('❌ MapComponent: Station not found:', stationIdString);
      return;
    }

    console.log('✅ MapComponent: Found station:', feature.properties.stationName);
    console.log('📋 Station Properties:', {
      stationName: feature.properties.stationName,
      Stid: feature.properties.Stid,
      latitude: feature.properties.latitude,
      longitude: feature.properties.longitude,
      curAirTemp: feature.properties.curAirTemp,
      totalSnowDepth: feature.properties.totalSnowDepth,
      totalSnowDepthChange: feature.properties.totalSnowDepthChange,
      snowAccumulation24h: feature.properties.snowAccumulation24h,
      curWindSpeed: feature.properties.curWindSpeed,
      maxWindGust: feature.properties.maxWindGust,
      windDirection: feature.properties.windDirection,
      windSpeedAvg: feature.properties.windSpeedAvg,
      elevation: feature.properties.elevation,
      relativeHumidity: feature.properties.relativeHumidity,
      precipAccumOneHour: feature.properties.precipAccumOneHour,
      fetchTime: feature.properties.fetchTime
    });
    const station = mapPropertiesToWeatherStation(feature.properties);
    handleStationSelect(station);
  }, [mapData, handleStationSelect]);

  // For map click:
  const handleMapClick = useCallback((info: PickingInfo) => {
    if (info.object && 'properties' in info.object) {
      const properties = (info.object as { properties: Map_BlockProperties }).properties;
      selectStationById(properties.Stid || properties.stationName);
    }
  }, [selectStationById]);

  // For dropdown:
  const handleDropdownSelect = (stid: string) => {
    selectStationById(stid);
  };

  // Create a ref to track the current observation data
  const observationDataRef = useRef({
    day: null as any,
    hour: null as any,
    filtered: null as any
  });
  
  useEffect(() => {
    if (selectedStationId && mapData) {
      selectStationById(selectedStationId);
    }
  }, [selectedStationId, mapData, selectStationById]);

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
        
        // Set the selected station with fresh data if found
        handleStationSelect(updatedStation);
      }
    }
  }, [observationsDataDay, observationsDataHour, filteredObservationsDataHour, isDrawerOpen, selectedStation, mapData, handleStationSelect]);

  // Effect to manage drawer state
  useEffect(() => {
    // If drawer is open, add a class to prevent scrolling on the body
    if (isDrawerOpen) {
      document.body.classList.add('drawer-open');
      
      // Close drawer when escape key is pressed
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeDrawer();
        }
      };
      
      window.addEventListener('keydown', handleEscape);
      
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.classList.remove('drawer-open');
    }
  }, [isDrawerOpen, closeDrawer]);

  // Create layers based on current visibility and data
  const layers = useMemo(
    () => {
      const layerVisibility = getLayerVisibility(activeLayerState);
      return createMapLayers(layerVisibility, mapData as MapData, handleMapClick);
    },
    [activeLayerState, mapData, handleMapClick]
  );

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
            onClose={closeDrawer}
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

      {/* Layer Controls */}
      {/* Removed LayerToolbar as it's now rendered in page.tsx */}
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