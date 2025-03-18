'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { station_data } from './test_station_data';
import forecastZonesData from './forecastZones.json';
import { map_weatherToGeoJSON } from '../../map/map';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../../map/map';
//import moment from 'moment-timezone';

interface Station {
  id: string;
  name: string;
}

// Create context with comprehensive type definitions
interface MapDataContextType {
  // Current map data
  mapData: {
    stationData: {
      type: 'FeatureCollection';
      features: Feature<Geometry, Map_BlockProperties>[];
    };
    forecastZones: { name: string; contour: [number, number][] }[];
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
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('MapDataProvider station_data:', station_data);

  // Initialize with map data
  const [mapData, setMapData] = useState({
    stationData: map_weatherToGeoJSON(station_data),
    forecastZones: forecastZonesData.forecastZones,
  });

  // These will be populated when we merge with the data page
  const [weatherData, setWeatherData] = useState({
    observationsDataDay: [],
    observationsDataHour: [],
    filteredObservationsDataHour: [],
  });

  // Minimal station state (can be expanded later)
  const [stations, setStations] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedStation, setSelectedStation] = useState<
    string | null
  >(null);
  const [stationIds, setStationIds] = useState<string[]>([]);

  // Time-related state (placeholders for now)
  const [timeRange, setTimeRange] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [dayRangeType, setDayRangeType] = useState('all');

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isMetric, setIsMetric] = useState(false);

  // Initialize station data from the station_data
  useEffect(() => {
    // Extract station information from your existing data
    const stationList = station_data.map((station) => ({
      id: station.Stid,
      name: station.Station || station.name,
    }));

    setStations(stationList);
    setStationIds(stationList.map((s) => s.id));
  }, []);

  // Function to update map data (can be triggered when time range changes)
  const updateMapData = useCallback(() => {
    setIsLoading(true);

    // Here we'd make API calls if needed
    // For now, just re-transform the static data
    setTimeout(() => {
      setMapData({
        stationData: map_weatherToGeoJSON(station_data),
        forecastZones: forecastZonesData.forecastZones,
      });
      setIsLoading(false);
    }, 500);
  }, []);

  // These functions are placeholders until we merge with the data page
  const handleStationChange = useCallback((stid: string) => {
    setSelectedStation(stid);
  }, []);

  const handleStationClick = useCallback((stid: string) => {
    setSelectedStation(stid);
  }, []);

  const handleRefresh = useCallback(() => {
    updateMapData();
  }, [updateMapData]);

  // Provide all values
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
    isLoading,
    isMetric,
    handleStationChange,
    handleStationClick,
    handleRefresh,
    setIsMetric,
    updateMapData,
  };

  return (
    <MapDataContext.Provider value={value}>
      {children}
    </MapDataContext.Provider>
  );
}

export const useMapData = () => useContext(MapDataContext);
