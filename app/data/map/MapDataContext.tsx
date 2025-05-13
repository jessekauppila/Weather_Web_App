'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import forecastZonesData from './forecastZones.json';
import { map_weatherToGeoJSON } from './geoUtils';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../../map/map';
import wxTableDataDayFromDB from '../dayWxTableDataDayFromDB';
import { WxTableOptions } from '../../types';
import { LayerId, LayerState } from '../../types/layers';
import { DayRangeType, TimeRangeData } from '../../types/time';
//import moment from 'moment-timezone';

interface Station {
  id: string;
  name: string;
}

// Define types for station data and observation data
interface StationData {
  Stid: string;
  Station: string;
  Latitude: number;
  Longitude: number;
  Elevation: number;
  'Air Temp Max': string | number;
  'Air Temp Min': string | number;
  'Cur Air Temp': string | number;
  'Cur Wind Speed': string | number;
  'Wind Direction': string | number;
  'Total Snow Depth Change': string | number;
  'Total Snow Depth': string | number;
  '24h Snow Accumulation': string | number;
  'Max Wind Gust'?: string | number;
  'Wind Speed Avg'?: string | number;
  'Relative Humidity'?: string | number;
  'Precip Accum One Hour'?: string | number;
  'Api Fetch Time'?: string;
  hourlyData?: any[];
  filteredHourlyData?: any[];
  dailyData?: any[];
}

interface ObservationData {
  Station: string;
  Day?: string;
  Hour?: string;
  'Snow Depth'?: string;
  'New Snow'?: string;
  'Air Temp'?: string | number;
  'Precip'?: string;
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

  // Weather data
  weatherData: {
    observationsDataDay: Record<string, unknown>[];
    observationsDataHour: Record<string, unknown>[];
    filteredObservationsDataHour: Record<string, unknown>[];
  };

  // Direct data access
  observationsDataDay: { data: any[]; title: string; } | null;
  observationsDataHour: { data: any[]; title: string; } | null;
  filteredObservationsDataHour: { data: any[]; title: string; } | null;

  // Station data
  stations: Station[];
  selectedStation: string | null;
  stationIds: string[];

  // Time-related data
  timeRange: number;
  selectedDate: Date;
  endDate: Date;
  dayRangeType: DayRangeType;
  customTime: string;
  timeRangeData: TimeRangeData;

  // UI states
  isLoading: boolean;
  isMetric: boolean;
  tableMode: 'summary' | 'daily';
  activeLayerState: LayerState;

  // Functions
  handleStationChange: (stid: string) => void;
  handleStationClick: (stid: string) => void;
  handleRefresh: () => void;
  setIsMetric: (value: boolean) => void;
  updateMapData: () => void;
  onLayerToggle: (layerId: LayerId) => void;
  calculateCurrentTimeRange: () => string;
}

// Create context with default values
const MapDataContext = createContext<MapDataContextType | undefined>(undefined);

// Utility function to round numeric values
function roundValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '' || value === '-') return '-';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(numValue) ? '-' : numValue.toFixed(1);
}

interface MapDataProviderProps {
  children: ReactNode;
  observationsDataDay: { data: any[]; title: string; } | null;
  observationsDataHour: { data: any[]; title: string; } | null;
  filteredObservationsDataHour: { data: any[]; title: string; } | null;
  isMetric: boolean;
  tableMode: 'summary' | 'daily';
  dayRangeType: DayRangeType;
  customTime: string;
  calculateCurrentTimeRange: () => string;
  timeRangeData: TimeRangeData;
  activeLayerState: LayerState;
  onLayerToggle: (layerId: LayerId) => void;
  updateMapData: () => void;
  handleStationChange: (stationId: string) => void;
  handleStationClick: (stationId: string) => void;
  handleRefresh: () => void;
  setIsMetric: (isMetric: boolean) => void;
}

export function MapDataProvider({
  children,
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
  updateMapData,
  handleStationChange,
  handleStationClick,
  handleRefresh,
  setIsMetric
}: MapDataProviderProps) {
  // Initialize with empty map data
  const [mapData, setMapData] = useState<MapDataContextType['mapData']>({
    stationData: {
      type: 'FeatureCollection',
      features: [],
    },
    forecastZones: forecastZonesData.forecastZones,
    observationsDataHour: {
      data: [],
      title: '',
    },
    filteredObservationsDataHour: {
      data: [],
      title: '',
    },
    observationsDataDay: observationsDataDay || {
      data: [],
      title: '',
    },
  });

  // These will be populated when we merge with the data page
  const [weatherData, setWeatherData] = useState({
    observationsDataDay: [],
    observationsDataHour: [],
    filteredObservationsDataHour: [],
  });

  // Initialize with empty stations
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [stationIds, setStationIds] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const value = {
    mapData,
    weatherData,
    stations,
    selectedStation,
    stationIds,
    timeRange,
    selectedDate,
    endDate,
    dayRangeType,
    customTime,
    timeRangeData,
    isLoading,
    isMetric,
    tableMode,
    activeLayerState,
    handleStationChange,
    handleStationClick,
    handleRefresh,
    setIsMetric,
    updateMapData,
    onLayerToggle,
    calculateCurrentTimeRange,
    observationsDataDay,
    observationsDataHour,
    filteredObservationsDataHour
  };

  return (
    <MapDataContext.Provider value={value}>
      {children}
    </MapDataContext.Provider>
  );
}

export function useMapData() {
  const context = useContext(MapDataContext);
  if (context === undefined) {
    throw new Error('useMapData must be used within a MapDataProvider');
  }
  return context;
}
