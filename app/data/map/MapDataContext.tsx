'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import forecastZonesData from './forecastZones.json';
import { map_weatherToGeoJSON } from '../../map/map';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties } from '../../map/map';
import wxTableDataDayFromDB from '../dayWxTableDataDayFromDB';
import { WxTableOptions, DayRangeType } from '../../types';
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
    forecastZones: { name: string; contour: number[][] }[];
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
  //console.log('MapDataProvider station_data:', station_data);

  // Initialize with empty map data
  const [mapData, setMapData] = useState<MapDataContextType['mapData']>({
    stationData: {
      type: 'FeatureCollection',
      features: [],
    },
    forecastZones: forecastZonesData.forecastZones,
  });

  // These will be populated when we merge with the data page
  const [weatherData, setWeatherData] = useState({
    observationsDataDay: [],
    observationsDataHour: [],
    filteredObservationsDataHour: [],
  });

  // Initialize with empty stations
  const [stations, setStations] = useState<{ id: string; name: string }[]>([]);
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
  
  // State to store the formatted daily data
  const [formattedDailyData, setFormattedDailyData] = useState<any[]>([]);
  
  // Flag to track if we've started fetching data
  const dataFetchStarted = useRef(false);

  // Fetch the data once on component mount
  useEffect(() => {
    if (dataFetchStarted.current) return;
    dataFetchStarted.current = true;
    
    const fetchData = async () => {
      try {
        const options = {
          mode: 'summary' as 'summary' | 'daily',
          startHour: 0,
          endHour: 24,
          start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
          dayRangeType: 'all' as DayRangeType
        };
        
        const units: Array<Record<string, string>> = [];
        const observations = {};
        
        // Call the function and store the result
        const result = wxTableDataDayFromDB(
          observations, 
          units, 
          options, 
          false // isMetric
        );
        
        console.log('Initial result:', result);
        
        // Set up a function to monitor the console for the specific log message
        const originalConsoleLog = console.log;
        console.log = function(...args) {
          originalConsoleLog.apply(console, args);
          
          // Check if this is the log message we're looking for
          if (args.length > 0 && 
              typeof args[0] === 'string' && 
              args[0].includes('🚀 formattedDailyData') && 
              args[1] && 
              Array.isArray(args[1]) && 
              args[1].length > 0) {
            
            console.log('Detected data update in console log:', args[1]);
            setFormattedDailyData(args[1]);
          }
        };
        
        // Restore original console.log after 20 seconds
        setTimeout(() => {
          console.log = originalConsoleLog;
        }, 20000);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);
  
  // Process the formatted data once it's available
  useEffect(() => {
    if (!formattedDailyData || formattedDailyData.length === 0) {
      console.log('No formatted data yet');
      return;
    }
    
    console.log('Processing formattedDailyData:', formattedDailyData);
    
    // Transform the data for the map
    const transformedData = formattedDailyData.map(station => ({
      Stid: station.Stid,
      Station: station.Station,
      Latitude: station.Latitude,
      Longitude: station.Longitude,
      Elevation: station.Elevation,
      'Air Temp Max': station['Air Temp Max'],
      'Cur Air Temp': station['Cur Air Temp'],
      'Cur Wind Speed': station['Cur Wind Speed'],
      'Wind Direction': station['Wind Direction'],
      'Total Snow Depth Change': station['Total Snow Depth Change'],
      'Total Snow Depth': station['Total Snow Depth'],
      '24h Snow Accumulation': station['24h Snow Accumulation'],
      'Max Wind Gust': station['Max Wind Gust'] || 'N/A',
      'Wind Speed Avg': station['Wind Speed Avg'] || 'N/A',
      'Relative Humidity': station['Relative Humidity'] || 'N/A',
      'Api Fetch Time': station['Api Fetch Time'] || new Date().toISOString()
    }));
    
    console.log('Transformed data ready:', transformedData);
    
    // Update the map data with the transformed data
    setMapData({
      stationData: map_weatherToGeoJSON(transformedData),
      forecastZones: forecastZonesData.forecastZones,
    });
    
    // Also update stations list
    const stationList = transformedData.map((station) => ({
      id: String(station.Stid),
      name: String(station.Station),
    }));
    
    setStations(stationList);
    setStationIds(stationList.map((s) => s.id));
    
  }, [formattedDailyData]);

  // Function to update map data
  const updateMapData = useCallback(() => {
    setIsLoading(true);
    const options = {
      mode: 'summary' as 'summary' | 'daily',
      startHour: 0,
      endHour: 24,
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
      dayRangeType: 'all' as DayRangeType
    };
    
    const units: Array<Record<string, string>> = [];
    const observations = {};
    
    wxTableDataDayFromDB(observations, units, options, isMetric);
    setIsLoading(false);
  }, [isMetric]);

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
