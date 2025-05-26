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
import { map_weatherToGeoJSON } from './geoUtils';
import type { Feature, Geometry } from 'geojson';
import { Map_BlockProperties, map_INITIAL_VIEW_STATE, WeatherStation } from '../../map/map';
// import wxTableDataDayFromDB from '../dayWxTableDataDayFromDB';
// import { WxTableOptions, DayRangeType } from '../../types';
import moment from 'moment-timezone';
import { DayRangeType } from '../../types';
import { LayerId, LayerState, DEFAULT_LAYER_STATE } from '../../types/layers';
import {
  FlyToInterpolator,
  MapViewState,
} from '@deck.gl/core';


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
  mapData: any;
  isLoading: boolean;
  observationsDataDay: any;
  observationsDataHour: any;
  filteredObservationsDataHour: any;
  isMetric: boolean;
  selectedStation: any;
  isDrawerOpen: boolean;
  handleStationSelect: (station: any) => void;
  closeDrawer: () => void;
  activeLayerState: LayerState;
  timeRangeData: {
    start_time_pdt: moment.Moment;
    end_time_pdt: moment.Moment;
  };
  tableMode: 'summary' | 'daily';
  dayRangeType: DayRangeType;
  customTime: string;
  calculateCurrentTimeRange: () => string;
  onLayerToggle: (layerId: LayerId) => void;
  viewState: MapViewState;
  setViewState: (viewState: MapViewState) => void;
}

export const MapDataContext = createContext<MapDataContextType | undefined>(undefined);

export const MapDataProvider: React.FC<{
  children: React.ReactNode;
  observationsDataDay: any;
  observationsDataHour: any;
  filteredObservationsDataHour: any;
  isMetric: boolean;
  tableMode: 'summary' | 'daily';
  dayRangeType: DayRangeType;
  customTime: string;
  calculateCurrentTimeRange: () => string;
  timeRangeData: {
    start_time_pdt: moment.Moment;
    end_time_pdt: moment.Moment;
  };
  selectedStationId: string | null;
  onLayerToggle: (layerId: LayerId) => void;
  activeLayerState: LayerState;
}> = ({
  children,
  observationsDataDay,
  observationsDataHour,
  filteredObservationsDataHour,
  isMetric: initialIsMetric,
  tableMode,
  dayRangeType: initialDayRangeType,
  customTime,
  calculateCurrentTimeRange,
  timeRangeData,
  selectedStationId,
  onLayerToggle,
  activeLayerState
}) => {
  //console.log('observationsDataDay:', observationsDataDay);

  // Debugging function to inspect coordinate transformation
  function inspectCoordinateTransformation(data: any) {
    if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      // console.log('❌ Data is empty or invalid');
      return;
    }

    // Log the original data structure
    const firstStation = data.data[0];
    // console.log('🔍 COORDINATE INSPECTION:');
    // console.log('Original station data structure:', 
    //   {
    //   station: firstStation.Station,
    //   stid: firstStation.Stid,
    //   coordinates: {
    //     latitude: {
    //       value: firstStation.Latitude,
    //       type: typeof firstStation.Latitude
    //     },
    //     longitude: {
    //       value: firstStation.Longitude,
    //       type: typeof firstStation.Longitude
    //     }
    //   }
    // });

    // Track the transformation steps
    const afterParsing = {
      ...firstStation,
      Latitude: typeof firstStation.Latitude === 'number' 
        ? firstStation.Latitude 
        : parseFloat(String(firstStation.Latitude)),
      Longitude: typeof firstStation.Longitude === 'number' 
        ? firstStation.Longitude 
        : parseFloat(String(firstStation.Longitude))
    };

    // console.log('After parsing:', {
    //   latitude: {
    //     value: afterParsing.Latitude,
    //     type: typeof afterParsing.Latitude,
    //     isNaN: isNaN(afterParsing.Latitude)
    //   },
    //   longitude: {
    //     value: afterParsing.Longitude,
    //     type: typeof afterParsing.Longitude,
    //     isNaN: isNaN(afterParsing.Longitude)
    //   }
    // });

    // Check for stringification
    const stringified = {
      Latitude: String(afterParsing.Latitude),
      Longitude: String(afterParsing.Longitude)
    };


    // Check the source entries looking for stations with valid coordinates

  }

  // Initialize with empty map data
  const [mapData, setMapData] = useState<MapDataContextType['mapData']>({
    stationData: {
      type: 'FeatureCollection',
      features: [],
    },
    forecastZones: forecastZonesData.forecastZones.map(zone => ({
      name: zone.name,
      contour: zone.contour.map(point => [point[0], point[1]] as [number, number])
    })),
  });

  // These will be populated when we merge with the data page
  const [weatherData, setWeatherData] = useState({
    observationsDataDay: [],
    observationsDataHour: [],
    filteredObservationsDataHour: [],
  });

  // Initialize with empty stations
  const [stations, setStations] = useState<{ id: string; name: string }[]>([]);
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [stationIds, setStationIds] = useState<string[]>([]);

  // Time-related state (placeholders for now)
  const [timeRange, setTimeRange] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [dayRangeType, setDayRangeType] = useState(initialDayRangeType);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isMetric, setIsMetric] = useState(initialIsMetric);
  
  // State to store the formatted daily data
  const [formattedDailyData, setFormattedDailyData] = useState<any[]>([]);
  
  // Flag to track if we've started fetching data
  const dataFetchStarted = useRef(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Redundat this is in page.tsx!!!
  //const [activeLayerState, setActiveLayerState] = useState<LayerState>(DEFAULT_LAYER_STATE);

  // Fetch the data once on component mount
  useEffect(() => {
    // Skip fetching if observationsDataDay is provided as a prop
    if (observationsDataDay?.data?.length > 0) {
      //console.log('Using provided observationsDataDay, skipping fetch');
      inspectCoordinateTransformation(observationsDataDay);
      setFormattedDailyData(observationsDataDay.data);
      return;
    }
    
    if (dataFetchStarted.current) return;
    dataFetchStarted.current = true;
    
  }, [observationsDataDay]);

  ////////////////////////////////////////////////////////////

  
  // Process the formatted data once it's available
  useEffect(() => {
    if (!formattedDailyData || formattedDailyData.length === 0) {
      return;
    }
    
    //console.log('Processing formattedDailyData:', formattedDailyData);
    
    // Transform the data for the map
    const transformedData = formattedDailyData.map((station: StationData) => ({
      Stid: station.Stid,
      Station: station.Station,
      Latitude: typeof station.Latitude === 'number' ? station.Latitude : parseFloat(String(station.Latitude)),
      Longitude: typeof station.Longitude === 'number' ? station.Longitude : parseFloat(String(station.Longitude)),
      Elevation: station.Elevation,
      'Air Temp Max': station['Air Temp Max'],
      'Air Temp Min': station['Air Temp Min'] || '-',
      'Cur Air Temp': station['Cur Air Temp'],
      'Cur Wind Speed': station['Cur Wind Speed'],
      'Wind Direction': station['Wind Direction'],
      'Total Snow Depth Change': station['Total Snow Depth Change'],
      'Total Snow Depth': station['Total Snow Depth'],
      '24h Snow Accumulation': station['24h Snow Accumulation'],
      'Max Wind Gust': station['Max Wind Gust'] || 'N/A',
      'Wind Speed Avg': station['Wind Speed Avg'] || 'N/A',
      'Relative Humidity': station['Relative Humidity'] || 'N/A',
      'Precip Accum One Hour': station['Precip Accum One Hour'] || '-',
      'Api Fetch Time': station['Api Fetch Time'] || new Date().toISOString()
    }));

    // Format observations data
    const formatObservation = (obs: ObservationData) => ({
      Station: obs.Station,
      Day: obs.Day || new Date().toLocaleDateString(),
      Hour: obs.Hour || new Date().toLocaleTimeString(),
      'Snow Depth': obs['Snow Depth'] || '0 in',
      'New Snow': obs['New Snow'] || '0 in',
      'Air Temp': obs['Air Temp'] || '-',
      'Precip': obs['Precip'] || '0 in'
    });

    // Process observations data or create dummy data if none exists
    let observationsData: StationData[] = [];
    
    if (formattedDailyData.some((station: StationData) => station.hourlyData?.length || station.filteredHourlyData?.length || station.dailyData?.length)) {
      // console.log('Using real observations data');
      observationsData = formattedDailyData.map((station: StationData) => ({
        ...station,
        hourlyData: station.hourlyData?.map(formatObservation) || [],
        filteredHourlyData: station.filteredHourlyData?.map(formatObservation) || [],
        dailyData: station.dailyData?.map(formatObservation) || []
      }));
    } else {
      // console.log('No observations data found');
      // Create minimal empty structure for each station
      observationsData = transformedData.map((station: StationData) => ({
        ...station,
        hourlyData: [],
        filteredHourlyData: [],
        dailyData: []
      }));
    }
    
    // console.log('Processed observations data:', observationsData);
    
    // Convert data to match WeatherStation type (all fields as strings)
    const stationsForMap = transformedData.map(station => ({
      Stid: String(station.Stid),
      Station: String(station.Station),
      Latitude: String(station.Latitude),
      Longitude: String(station.Longitude),
      Elevation: String(station.Elevation),
      'Air Temp Max': String(station['Air Temp Max']),
      'Air Temp Min': String(station['Air Temp Min']),
      'Cur Air Temp': String(station['Cur Air Temp']),
      'Cur Wind Speed': String(station['Cur Wind Speed']),
      'Wind Direction': String(station['Wind Direction']),
      'Total Snow Depth Change': String(station['Total Snow Depth Change']),
      'Total Snow Depth': String(station['Total Snow Depth']),
      '24h Snow Accumulation': String(station['24h Snow Accumulation']),
      'Max Wind Gust': String(station['Max Wind Gust']),
      'Wind Speed Avg': String(station['Wind Speed Avg']),
      'Relative Humidity': String(station['Relative Humidity']),
      'Precip Accum One Hour': String(station['Precip Accum One Hour']),
      'Api Fetch Time': String(station['Api Fetch Time'])
    }));
    
    // Update the map data with all processed data
    setMapData({
      stationData: map_weatherToGeoJSON(stationsForMap),
      forecastZones: forecastZonesData.forecastZones.map(zone => ({
        name: zone.name,
        contour: zone.contour.map(point => [point[0], point[1]] as [number, number])
      })),
    });
    
    // console.log('Updated map data with observations');
    
    // Also update stations list
    const stationList = transformedData.map((station: StationData) => ({
      id: String(station.Stid),
      name: String(station.Station),
    }));
    
    setStations(stationList);
    setStationIds(stationList.map((s: {id: string}) => s.id));
    
  }, [formattedDailyData]);

  // Function to update map data
  const updateMapData = useCallback(() => {
    // For now, just log that update was called
    console.log('Update map data called');
  }, []);

  // These functions are placeholders until we merge with the data page
  const handleStationChange = useCallback((stid: string) => {
    const station = stations.find(s => s.id === stid);
    if (station) {
      const weatherStation: WeatherStation = {
        Station: station.name,
        'Cur Air Temp': '-',
        '24h Snow Accumulation': '-',
        'Cur Wind Speed': '-',
        'Elevation': '-',
        'Stid': station.id,
        'Air Temp Min': '-',
        'Air Temp Max': '-',
        'Wind Speed Avg': '-',
        'Max Wind Gust': '-',
        'Wind Direction': '-',
        'Total Snow Depth Change': '-',
        'Precip Accum One Hour': '-',
        'Total Snow Depth': '-',
        'Latitude': '-',
        'Longitude': '-',
        'Relative Humidity': '-',
        'Api Fetch Time': new Date().toISOString()
      };
      setSelectedStation(weatherStation);
    }
  }, [stations]);

  const handleStationClick = useCallback((stid: string) => {
    const station = stations.find(s => s.id === stid);
    if (station) {
      const weatherStation: WeatherStation = {
        Station: station.name,
        'Cur Air Temp': '-',
        '24h Snow Accumulation': '-',
        'Cur Wind Speed': '-',
        'Elevation': '-',
        'Stid': station.id,
        'Air Temp Min': '-',
        'Air Temp Max': '-',
        'Wind Speed Avg': '-',
        'Max Wind Gust': '-',
        'Wind Direction': '-',
        'Total Snow Depth Change': '-',
        'Precip Accum One Hour': '-',
        'Total Snow Depth': '-',
        'Latitude': '-',
        'Longitude': '-',
        'Relative Humidity': '-',
        'Api Fetch Time': new Date().toISOString()
      };
      setSelectedStation(weatherStation);
    }
  }, [stations]);

  const handleRefresh = useCallback(() => {
    // For now, just log that refresh was called
    console.log('Refresh called');
  }, []);


  const [viewState, setViewState] = useState<MapViewState>(map_INITIAL_VIEW_STATE);

// When a station is selected, animate to its location
const handleStationSelect = (station: WeatherStation) => {
  setSelectedStation(station);
  setIsDrawerOpen(true);
  
  // Animate to the station's location
  setViewState({
    ...viewState,
    latitude: parseFloat(station.Latitude),
    longitude: parseFloat(station.Longitude),
    zoom: 11, // Adjust zoom level as needed
    maxZoom: 15,
    minZoom: 0,  // Add this
    pitch: 2,
    bearing: 0,
    transitionDuration: 1000, // Animation duration in milliseconds
    transitionInterpolator: new FlyToInterpolator(), // Smooth animation
    transitionEasing: t => t * (2 - t) // Easing function for smooth deceleration
  });
};



  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // Provide all values
  const value = {
    mapData,
    isLoading,
    observationsDataDay,
    observationsDataHour,
    filteredObservationsDataHour,
    isMetric,
    selectedStation,
    isDrawerOpen,
    handleStationSelect,
    closeDrawer,
    activeLayerState,
    timeRangeData,
    tableMode,
    dayRangeType,
    customTime,
    calculateCurrentTimeRange,
    onLayerToggle,
    viewState,
    setViewState,
  };

  return (
    <MapDataContext.Provider value={value}>
      {children}
    </MapDataContext.Provider>
  );
};
export const useMapData = () => useContext(MapDataContext);

