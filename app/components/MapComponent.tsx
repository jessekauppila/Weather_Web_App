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
import StationDrawer from '../components/mapStationCards/StationDrawer';
import type { WeatherStation } from '../map/map';
import type { PickingInfo } from '@deck.gl/core';
import type { Feature, Geometry } from 'geojson';
import type { Map_BlockProperties } from '../map/map';

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

// The actual map component that uses the context
export const MapApp = () => {
  // Get data from context
  const { mapData, updateMapData } = useMapData();

  // Layer visibility state
  const [layerVisibility, setLayerVisibility] = useState({
    forecastZones: true,
    windArrows: true,
    snowDepthChange: false,
    terrain: false,
    currentTemp: true,
  });

  // Drawer state
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Handle station click
  const handleStationClick = (info: PickingInfo) => {
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
  };

  // Create layers based on current visibility and data
  const layers = useMemo(
    () => createMapLayers(layerVisibility, mapData as MapData, handleStationClick),
    [layerVisibility, mapData]
  );

  // Get the filtered data for the selected station
  const stationDataHourFiltered = useMemo(() => {
    if (!selectedStation || !(mapData as MapData).filteredObservationsDataHour?.data) return null;
    return {
      data: (mapData as MapData).filteredObservationsDataHour.data.filter(
        (obs: { Station: string }) => obs.Station === selectedStation.Station
      ),
      title: `Filtered Hourly Data - ${selectedStation.Station}`
    };
  }, [selectedStation, mapData]);

  // Get the unfiltered data for the selected station
  const stationDataHourUnFiltered = useMemo(() => {
    if (!selectedStation || !(mapData as MapData).observationsDataHour?.data) return null;
    return {
      data: (mapData as MapData).observationsDataHour.data.filter(
        (obs: { Station: string }) => obs.Station === selectedStation.Station
      ),
      title: `Raw Hourly Data - ${selectedStation.Station}`
    };
  }, [selectedStation, mapData]);

  // Format data for graphs
  const stationDataForGraph = useMemo(() => {
    if (!selectedStation || !stationDataHourFiltered?.data) return null;
    return {
      data: stationDataHourFiltered.data.map((obs: { 
        Station: string; 
        Day: string; 
        Hour: string; 
        'Snow Depth'?: string; 
        'New Snow'?: string;
        'Air Temp'?: string;
        'Precip'?: string;
      }) => ({
        Date: `${obs.Day} ${obs.Hour}`,
        'Total Snow Depth': obs['Snow Depth'] || '0 in',
        '24h Snow Accumulation': obs['New Snow'] || '0 in',
        'Air Temp Min': obs['Air Temp'],
        'Air Temp Max': obs['Air Temp'],
        'Precip Accum One Hour': obs['Precip'] || '0 in'
      })),
      title: selectedStation.Station
    };
  }, [selectedStation, stationDataHourFiltered]);

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

      <StationDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedStation(null);
        }}
        station={selectedStation}
        observationsDataDay={(mapData as MapData).observationsDataDay}
        observationsDataHour={(mapData as MapData).observationsDataHour}
        filteredObservationsDataHour={(mapData as MapData).filteredObservationsDataHour}
        isMetric={false}
        tableMode="summary"
      />
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