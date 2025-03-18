'use client';

import React, { useState, useMemo } from 'react';
import { Map } from 'react-map-gl/mapbox';
import DeckGL from '@deck.gl/react';
import {
  map_INITIAL_VIEW_STATE,
  map_MAP_STYLE,
  map_lightingEffect,
  map_getTooltip,
} from '../map/map';
import { MapLayerSwitchWidget } from '../map/UI/widgets/layer_switches';
import { createMapLayers } from '../map/layers';
import { MapDataProvider, useMapData } from '../data/map/MapDataContext';
import { LayerId } from '../page';

// The actual map component that uses the context
export const MapApp = () => {
  // Get data from context
  const { mapData, isLoading } = useMapData();

  // Layer visibility state
  const [layerVisibility, setLayerVisibility] = useState({
    forecastZones: true,
    windArrows: true,
    snowDepthChange: false,
    terrain: false,
    currentTemp: true,
  });

  // Create layers based on current visibility and data
  const layers = useMemo(
    () => createMapLayers(layerVisibility, mapData),
    [layerVisibility, mapData]
  );

  // Toggle layer visibility
  const toggleLayer = (layerId: LayerId) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  return (
    <div className="w-full h-[600px] relative">
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
      >
        <Map
          reuseMaps
          mapStyle={map_MAP_STYLE}
          mapboxAccessToken={
            process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
          }
        />
        <MapLayerSwitchWidget
          layersState={layerVisibility}
          toggleLayer={toggleLayer}
        />
      </DeckGL>
    </div>
  );
};

// Wrapped component with provider
export default function MapComponent() {
  return (
    <MapDataProvider>
      <MapApp />
    </MapDataProvider>
  );
} 