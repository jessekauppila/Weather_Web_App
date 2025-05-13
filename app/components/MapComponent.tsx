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
import { Switch, SelectChangeEvent } from '@mui/material';
import { LayerId, LayerState, getLayerVisibility } from '@/app/types/layers';
import useStationDrawer from '@/app/hooks/useStationDrawer';
import { StationSelector } from './TimeToolbar/StationSelector';
//import LayerToolbar from './LayerToolbar';
import TimeToolbar from './TimeToolbar';
import LayerToolbar from './LayerToolbar';

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
  isMetric?: boolean;
  tableMode: 'summary' | 'daily';
  dayRangeType: DayRangeType;
  customTime?: string;
  calculateCurrentTimeRange: () => string;
  timeRangeData: any;
  activeLayerState: LayerState;
  onLayerToggle: (layerId: LayerId) => void;
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
  isMetric: initialIsMetric,
  tableMode,
  dayRangeType = DayRangeType.MIDNIGHT,
  customTime: initialCustomTime,
  calculateCurrentTimeRange,
  timeRangeData,
  activeLayerState,
  onLayerToggle,
}: MapComponentProps) => {
  const { mapData, isLoading } = useMapData();
  const stationDrawer = useStationDrawer({ mapData });

  // Add missing state
  const [customTime, setCustomTime] = useState(initialCustomTime || '');
  const [isMetric, setIsMetric] = useState(initialIsMetric || false);

  // State for toolbar visibility
  const [isTimeToolbarOpen, setIsTimeToolbarOpen] = useState(true);
  const [isLayerToolbarOpen, setIsLayerToolbarOpen] = useState(true);

  // Time-related state and handlers
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState('24h');
  const [useCustomEndDate, setUseCustomEndDate] = useState(false);
  const [isOneDay, setIsOneDay] = useState(true);

  // Handlers for time controls
  const handleTimeRangeChange = useCallback((event: SelectChangeEvent<string>) => {
    setTimeRange(event.target.value);
  }, []);

  const handleDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(event.target.value));
  }, []);

  const handleEndDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(new Date(event.target.value));
  }, []);

  const handlePrevDay = useCallback(() => {
    setSelectedDate(prev => new Date(prev.setDate(prev.getDate() - 1)));
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + 1)));
  }, []);

  // Toolbar toggle handlers
  const handleTimeToolbarToggle = useCallback(() => {
    setIsTimeToolbarOpen(prev => !prev);
  }, []);

  const handleLayerToolbarToggle = useCallback(() => {
    setIsLayerToolbarOpen(prev => !prev);
  }, []);

  // Add this with your other handlers
  const handleRefresh = useCallback(async (newIsMetric?: boolean) => {
    // Add your refresh logic here
    console.log('Refreshing data...');
  }, []);

  // Group props for components
  const timeProps = {
    selectedDate,
    endDate,
    dayRangeType,
    customTime,
    timeRange,
    useCustomEndDate,
    handleTimeRangeChange,
    handleDateChange,
    handleEndDateChange,
    handlePrevDay,
    handleNextDay,
    calculateCurrentTimeRange,
    isOneDay,
    setCustomTime,
    handleDayRangeTypeChange: (event: SelectChangeEvent<DayRangeType>) => {
      // Add your day range type change logic here
    },
    startHour: 0,
    endHour: 24,
    setObservationsDataDay: () => {},
    setObservationsDataHour: () => {},
    setFilteredObservationsDataHour: () => {},
    setIsLoading: () => {},
    selectedStation: stationDrawer.selectedStation,
    stations: mapData?.stationData.features.map(f => ({
      id: f.properties.Stid,
      name: f.properties.stationName
    })) || [],
    handleStationChange: (event: SelectChangeEvent<string>) => {
      // Add your station change logic here
    },
    stationIds: mapData?.stationData.features.map(f => f.properties.Stid) || []
  };

  const stationProps = {
    selectedStation: stationDrawer.selectedStation,
    handleStationSelect: stationDrawer.handleStationSelect,
    stationIds: mapData?.stationData?.features.map(f => f.properties.Stid) || []
  };

  const dataProps = {
    filteredObservationsDataHour,
    onRefresh: handleRefresh,
    tableMode,
    isMetric,
    setIsMetric,
    calculateCurrentTimeRange,
    isOneDay,
    setCustomTime
  };

  // Create layers based on current visibility and data
  const layers = useMemo(
    () => {
      const layerVisibility = getLayerVisibility(activeLayerState);
      return createMapLayers(layerVisibility, mapData as MapData, stationDrawer.handleStationClick);
    },
    [activeLayerState, mapData, stationDrawer.handleStationClick]
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

      {/* Toolbars container */}
      <div className="fixed top-4 left-4 right-4 z-10 flex flex-col md:flex-row gap-4 justify-between items-start"
        style={{
          pointerEvents: 'auto',
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto'
        }}
      >
        {/* Time toolbar */}
        <div className="w-full md:flex-grow">
          <TimeToolbar
            {...timeProps}
            {...stationProps}
            {...dataProps}
            isOpen={isTimeToolbarOpen}
            onToggle={handleTimeToolbarToggle}
          />
        </div>

        {/* Layer toolbar */}
        <div className="w-full md:w-auto md:sticky md:top-0"
          style={{
            minWidth: '200px',
            maxWidth: '250px',
            alignSelf: 'flex-start'
          }}
        >
          <LayerToolbar
            activeLayerState={activeLayerState}
            onLayerToggle={onLayerToggle}
            isStationDrawerOpen={!!stationDrawer.selectedStation}
            isOpen={isLayerToolbarOpen}
            onToggle={handleLayerToolbarToggle}
          />
        </div>
      </div>

      {/* Station drawer */}
      <ClientPortal>
        {timeRangeData && (
          <StationDrawer
            isOpen={stationDrawer.isDrawerOpen}
            onClose={stationDrawer.closeDrawer}
            station={stationDrawer.selectedStation}
            observationsDataDay={observationsDataDay}
            observationsDataHour={observationsDataHour}
            filteredObservationsDataHour={filteredObservationsDataHour}
            isMetric={isMetric}
            tableMode={tableMode}
            dayRangeType={dayRangeType}
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