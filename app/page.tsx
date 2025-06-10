'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
} from 'react';

import TimeToolbar from './components/TimeToolbar';
// Comment out imports that cause errors and aren't used
// import { WeatherDisplay } from '@/app/components/wxTablesGraphsOrchestrator';
// import { LoadingWrapper } from '@/app/components/LoadingWrapper';
// import RegionTables from '@/app/components/RegionTables';
// import { RegionsContainer } from '@/app/components/RegionsContainer';
import LayerToolbar from './components/LayerToolbar';

import moment from 'moment-timezone';

import { useTimeRange } from '@/app/hooks/useTimeRange';
import { useWeatherControls } from '@/app/hooks/useWeatherControls';
import { useWeatherData } from '@/app/hooks/useWeatherData';
import { useStations } from '@/app/hooks/useStations';
import { useViewState } from '@/app/hooks/useViewState';
import { useDateState } from '@/app/hooks/useDateState';
import { useDropdown } from '@/app/hooks/useDropdown';
import { Analytics } from "@vercel/analytics/react"

import MapComponent from './components/MapComponent';
import { LayerId, LayerState, DEFAULT_LAYER_STATE, LAYER_GROUPS } from '@/app/types/layers';
//import useStationDrawer from '@/app/hooks/useStationDrawer';
import StationDrawer from '@/app/components/StationDrawer';

interface Station {
  id: string;
  name: string;
}

interface StationCardProps {
  station: {
    Station: string;
    'Cur Air Temp': string;
    '24h Snow Accumulation': string;
    'Cur Wind Speed': string;
    'Elevation': string;
    'Stid': string;
    'Air Temp Min': string;
    'Air Temp Max': string;
    'Wind Speed Avg': string;
    'Max Wind Gust': string;
    'Wind Direction': string;
    'Total Snow Depth Change': string;
    'Precip Accum One Hour': string;
    'Total Snow Depth': string;
    [key: string]: string;
  };
  onStationClick: (stid: string) => void;
  observationsData: { data: any[]; title: string; } | null;
  isActive: boolean;
  onDropdownToggle: (stid: string | null) => void;
}

// Add a utility function for logging
const logAppEvent = (category: string, message: string, data?: any) => {
  if (data) {
    console.log(`🔄 ${category}: ${message}`, data);
  } else {
    console.log(`🔄 ${category}: ${message}`);
  }
};

export default function Home() {
  // View state (UI-related)
  const { tableMode, setTableMode, isComponentVisible, isTransitioning, setIsTransitioning } = useViewState();
  const { activeDropdown, setActiveDropdown } = useDropdown();
  const [isPending, startTransition] = useTransition();
  const [isOneDay, setIsOneDay] = useState(true);

  // Station state
  const {
    stations,
    selectedStation,
    stationIds,
    isStationChanging,
    handleStationChange,
    handleStationClick
  } = useStations({ setTableMode });

  // Date and time state
  const {
    selectedDate,
    setSelectedDate,
    endDate,
    setEndDate,
    useCustomEndDate,
    setUseCustomEndDate,
    handlePrevDay,
    handleNextDay,
    handleDateChange
  } = useDateState((newDate) => {
    // When date changes, ONLY log - don't call refresh directly
    logAppEvent('DATE CHANGE', 'Date changed', {
      date: moment(newDate).format('YYYY-MM-DD')
    }
  );
    // Let useEffect handle the refresh based on dependency changes
  });

  const {
    timeRange,
    dayRangeType,
    customTime,
    calculateTimeRange,
    setTimeRange,
    setDayRangeType,
    setCustomTime,
    calculateCurrentTimeRange
  } = useTimeRange();

  const { 
    startHour: calculatedStartHour, 
    endHour: calculatedEndHour 
  } = calculateTimeRange(selectedDate, dayRangeType, timeRange);

  const timeRangeData = useMemo(() => {
    // Always use calculateTimeRange for consistency
    const { start, end } = calculateTimeRange(selectedDate, dayRangeType, timeRange);
    
    return {
      start_time_pdt: start,
      end_time_pdt: end
    };
  }, [selectedDate, dayRangeType, timeRange, calculateTimeRange]);

  // Weather data state
  const {
    observationsDataDay,
    observationsDataHour,
    filteredObservationsDataHour,
    isLoading,
    isMetric,
    setIsMetric,
    handleRefresh,
    setObservationsDataDay,
    setObservationsDataHour,
    setFilteredObservationsDataHour,
    setIsLoading,
    dataReady: weatherDataReady,
  } = useWeatherData(
    timeRangeData,
    stationIds,
    tableMode,
    calculatedStartHour,
    calculatedEndHour,
    dayRangeType
  );

  // Add console log to track when handleRefresh is called
  const trackedHandleRefresh = async (newIsMetric?: boolean) => {
    logAppEvent('DATA REFRESH', 'Manual refresh requested', {
      selectedDate: moment(selectedDate).format('YYYY-MM-DD'),
      timeRange: timeRange,
      dayRangeType: dayRangeType,
      stations: stationIds.length
    });
    
    await handleRefresh(newIsMetric);
  };

  const {
    handleTimeRangeChange,
    handleDayRangeTypeChange,
    handleEndDateChange
  } = useWeatherControls(
    setSelectedDate,
    setEndDate,
    setUseCustomEndDate,
    setIsOneDay,
    setTimeRange,
    stations,
    trackedHandleRefresh, // use the tracked version
    timeRange,
    endDate
  );

  // Props grouping for components
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
    handleDayRangeTypeChange,
    handlePrevDay,
    handleNextDay,
    calculateCurrentTimeRange,
    isOneDay,
    setCustomTime
  };

  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);

  const handleMultiStationSelect = useCallback((stations: any[]) => {
    console.log('🟡 PAGE - handleMultiStationSelect called:', {
      stationCount: stations.length,
      stationNames: stations.map(s => s?.name || s?.Station),
      stationIds: stations.map(s => s?.id || s?.Stid)
    });
    
    if (stations.length > 0) {
      setSelectedStationId(stations[0].id || stations[0].Stid);
    } else {
      setSelectedStationId(null);
    }
  }, []);

  const stationProps = {
    selectedStation,
    stations,
    handleStationChange,
    stationIds,
    selectedStationIds,
    onStationSelectionChange: setSelectedStationIds,
    handleMultiStationSelect,
  };

  const dataProps = {
    filteredObservationsDataHour,
    onRefresh: handleRefresh,
    tableMode,
    startHour: calculatedStartHour,
    endHour: calculatedEndHour,
    setObservationsDataDay,
    setObservationsDataHour,
    setFilteredObservationsDataHour,
    setIsLoading,
    isMetric,
    setIsMetric,
    calculateCurrentTimeRange,
    isOneDay,
    setCustomTime,
  };

  // Add layer visibility state
  // const [layerVisibility, setLayerVisibility] = useState({
  //   forecastZones: true,
  //   windArrows: true,
  //   snowDepthChange: false,
  //   terrain: false,
  //   currentTemp: true,
  //   minMaxTemp: false,
  //   avgMaxWind: false,
  // });
  
  // Handle layer toggle
  // const handleToggleLayer = (layerId: LayerId) => {
  //   console.log(`Toggling layer: ${layerId}, current state:`, layerVisibility[layerId]);
  //   setLayerVisibility((prev) => ({
  //     ...prev,
  //     [layerId]: !prev[layerId],
  //   }));
  //   // Log after update
  //   setTimeout(() => {
  //     console.log(`Layer ${layerId} new state:`, layerVisibility[layerId]);
  //   }, 0);
  // };

  // Add a new loading state
  const [dataReady, setDataReady] = useState(false);

  // Update the useEffect in your page component
  useEffect(() => {
    // Only set dataReady when we have actual data
    if (weatherDataReady && observationsDataDay && observationsDataHour) {
      setDataReady(true);
    }
  }, [weatherDataReady, observationsDataDay, observationsDataHour]);

  const [activeLayerState, setActiveLayerState] = useState<LayerState>(DEFAULT_LAYER_STATE);

  const handleLayerToggle = (layerId: LayerId) => {
    setActiveLayerState(prev => {
      const group = LAYER_GROUPS[layerId];
      
      if (group === 'other') {
        // For 'other' group, toggle the layer independently
        const nextOther = new Set(prev.other);
        if (nextOther.has(layerId)) {
          nextOther.delete(layerId);
        } else {
          nextOther.add(layerId);
        }
        return { ...prev, other: nextOther };
      }

      // For the three main groups (temperature, wind, precipitation)
      const nextState = { ...prev };
      
      if (nextState[group].has(layerId)) {
        // If the layer is already active, just turn it off
        nextState[group].delete(layerId);
      } else {
        // If turning on a layer in a group:
        // 1. Clear other groups
        if (group !== 'temperature') nextState.temperature = new Set();
        if (group !== 'wind') nextState.wind = new Set();
        if (group !== 'precipitation') nextState.precipitation = new Set();
        
        // 2. Add the new layer to its group (keeping existing layers in the same group)
        nextState[group] = new Set(prev[group]).add(layerId);
      }
      console.log(`Toggled ${layerId} in group ${group}. New state:`, Array.from(nextState[group]));

      return nextState;
    });
  };

  const [openMobileToolbar, setOpenMobileToolbar] = useState<'layer' | 'time' | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Desktop open state
  const [isLayerToolbarOpenDesktop, setIsLayerToolbarOpenDesktop] = useState(true);
  const [isTimeToolbarOpenDesktop, setIsTimeToolbarOpenDesktop] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isLayerToolbarOpen = isMobile
    ? openMobileToolbar === 'layer'
    : isLayerToolbarOpenDesktop;

  const isTimeToolbarOpen = isMobile
    ? openMobileToolbar === 'time'
    : isTimeToolbarOpenDesktop;

  // For LayerToolbar
  const handleLayerToolbarToggle = () => {
    if (isMobile) {
      setOpenMobileToolbar(openMobileToolbar === 'layer' ? null : 'layer');
    } else {
      setIsLayerToolbarOpenDesktop((open) => !open);
    }
  };

  // For TimeToolbar
  const handleTimeToolbarToggle = () => {
    if (isMobile) {
      setOpenMobileToolbar(openMobileToolbar === 'time' ? null : 'time');
    } else {
      setIsTimeToolbarOpenDesktop((open) => !open);
    }
  };

  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const handleStationIdChange = useCallback((id: string) => {
    console.log('🟡 PAGE - handleStationIdChange called:', {
      newStationId: id,
      previousStationId: selectedStationId
    });
    setSelectedStationId(id);
  }, [selectedStationId]);

  useEffect(() => {
    console.log('🟡 PAGE - Station props being passed to TimeToolbar:', {
      selectedStation,
      selectedStationId,
      stationsCount: stations.length,
      // stationDrawerState: {
      //   isOpen: stationDrawer?.isOpen,
      //   selectedStation: stationDrawer?.selectedStation?.Station
      // }
    });
  }, [selectedStation, selectedStationId, stations]);

  return (
    <main className="flex min-h-screen flex-col items-center relative w-full overflow-hidden">
      {/* Show loading indicator if data isn't ready */}
      {!dataReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xl">Loading weather data...</div>
        </div>
      )}
      
      {/* Only render actual content when data is ready */}
      {dataReady && (
        <>
          {/* Map component as fullscreen background */}
          <div className="absolute inset-0 w-full h-full z-0">
            <MapComponent 
              observationsDataDay={observationsDataDay}
              observationsDataHour={observationsDataHour}
              filteredObservationsDataHour={filteredObservationsDataHour}
              isMetric={isMetric}
              tableMode={tableMode}
              dayRangeType={dayRangeType}
              customTime={customTime}
              calculateCurrentTimeRange={calculateCurrentTimeRange}
              timeRangeData={timeRangeData}
              activeLayerState={activeLayerState}
              onLayerToggle={handleLayerToggle}
              selectedStationId={selectedStationId}

            />

                {/* Container for both controls positioned at the top */}
                <div className="fixed top-4 left-4 right-4 z-10 flex flex-col md:flex-row gap-4 justify-between items-start"
                  style={{
                    pointerEvents: 'auto',
                    maxHeight: 'calc(100vh - 2rem)',
                    overflowY: 'auto'
                  }}
                >
                {/* Time toolbar - left on desktop, top on mobile */}
                <div className="w-full md:flex-grow">
                  <TimeToolbar
                    {...timeProps}
                    {...stationProps}
                    {...dataProps}
                    isOpen={isTimeToolbarOpen}
                    onToggle={handleTimeToolbarToggle}
                    selectedStationId={selectedStationId}
                    onStationChange={handleStationIdChange}
                  />
                </div>

                {/* Layer controls - right on desktop, below on mobile */}
                <div className="w-full md:w-auto md:sticky md:top-0"
                style={{
                  minWidth: '200px',
                  maxWidth: '250px',
                  alignSelf: 'flex-start'
                }}
                >
                  <LayerToolbar
                  activeLayerState={activeLayerState}
                  onLayerToggle={handleLayerToggle}
                  isStationDrawerOpen={!!selectedStation}
                  isOpen={isLayerToolbarOpen}
                  onToggle={handleLayerToolbarToggle}
                  />
              </div>
            </div>
          </div>
          

        </>
      )}
    </main>
  );
}