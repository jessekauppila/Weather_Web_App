'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import forecastZonesData from './forecastZones.json';
import { map_weatherToGeoJSON } from '../../map/map';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../../map/map';
//import wxTableDataDayFromDB from '../dayWxTableDataDayFromDB';
import { WxTableOptions, DayRangeType } from '../../types';
//import moment from 'moment-timezone';

interface Station {
  id: string;
  name: string;
}

interface MapData {
  stationData: {
    type: 'FeatureCollection';
    features: Feature<Geometry, Map_BlockProperties>[];
  };
  forecastZones: { name: string; contour: [number, number][] }[];
  observationsDataDay: { data: any[]; title: string } | null;
  observationsDataHour: { data: any[]; title: string } | null;
  filteredObservationsDataHour: { data: any[]; title: string } | null;
  isMetric: boolean;
}

// Create context with comprehensive type definitions
interface MapDataContextType {
  // Current map data
  mapData: {
    stationData: {
      type: 'FeatureCollection';
      features: Feature<Geometry, Map_BlockProperties>[];
    };
    forecastZones: { name: string; contour: number[][] }[];
    observationsDataHour: {
      data: any[];
      title: string;
    };
    filteredObservationsDataHour: {
      data: any[];
      title: string;
    };
    observationsDataDay: {
      data: any[];
      title: string;
    };
  };

  // Weather data (will be used when merging)
  weatherData: {
    observationsDataDay: Record<string, unknown>[];
    observationsDataHour: Record<string, unknown>[];
    filteredObservationsDataHour: Record<string, unknown>[];
  };

  // Station data
  stations: Station[];
  selectedStation: string | null;
  stationIds: string[];

  // Time-related data
  timeRange: number;
  selectedDate: Date;
  endDate: Date;
  dayRangeType: string;

  // UI states
  isLoading: boolean;
  isMetric: boolean;

  // Functions that will be implemented when merging
  handleStationChange: (stid: string) => void;
  handleStationClick: (stid: string) => void;
  handleRefresh: () => void;
  setIsMetric: (value: boolean) => void;

  // Map specific functions
  updateMapData: () => void;
}

// Create context with default values
const MapDataContext = createContext<MapDataContextType>({
  mapData: {
    stationData: {
      type: 'FeatureCollection',
      features: [],
    },
    forecastZones: [],
    observationsDataHour: {
      data: [],
      title: '',
    },
    filteredObservationsDataHour: {
      data: [],
      title: '',
    },
    observationsDataDay: {
      data: [],
      title: '',
    },
  },
  weatherData: {
    observationsDataDay: [],
    observationsDataHour: [],
    filteredObservationsDataHour: [],
  },
  stations: [],
  selectedStation: null,
  stationIds: [],
  timeRange: 1,
  selectedDate: new Date(),
  endDate: new Date(),
  dayRangeType: 'all',
  isLoading: false,
  isMetric: false,
  handleStationChange: () => {},
  handleStationClick: () => {},
  handleRefresh: () => {},
  setIsMetric: () => {},
  updateMapData: () => {},
});

export function MapDataProvider({
  observationsDataDay,
  observationsDataHour,
  filteredObservationsDataHour,
  isMetric,
  children
}: {
  observationsDataDay: { data: any[]; title: string } | null;
  observationsDataHour: { data: any[]; title: string } | null;
  filteredObservationsDataHour: { data: any[]; title: string } | null;
  isMetric: boolean;
  children: React.ReactNode;
}) {
  // Process the incoming data into the format needed for the map
  const processedMapData = useMemo(() => ({
    stationData: {
      type: 'FeatureCollection' as const,
      features: map_weatherToGeoJSON(observationsDataDay?.data || []).features
    },
    forecastZones: forecastZonesData.forecastZones,
    observationsDataDay: observationsDataDay || { data: [], title: '' },
    observationsDataHour: observationsDataHour || { data: [], title: '' },
    filteredObservationsDataHour: filteredObservationsDataHour || { data: [], title: '' },
    isMetric
  }), [observationsDataDay, observationsDataHour, filteredObservationsDataHour, isMetric]);

  // Provide the processed data to children
  return (
    <MapDataContext.Provider value={{ 
      mapData: processedMapData,
      isLoading: false,
      weatherData: {
        observationsDataDay: [],
        observationsDataHour: [],
        filteredObservationsDataHour: []
      },
      stations: [],
      selectedStation: null,
      stationIds: [],
      timeRange: 1,
      selectedDate: new Date(),
      endDate: new Date(),
      dayRangeType: 'all',
      isMetric,
      handleStationChange: () => {},
      handleStationClick: () => {},
      handleRefresh: () => {},
      setIsMetric: () => {},
      updateMapData: () => {}
    }}>
      {children}
    </MapDataContext.Provider>
  );
}

export const useMapData = () => useContext(MapDataContext);
