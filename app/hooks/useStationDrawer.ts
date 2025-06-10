import { useState, useCallback } from 'react';
import type { WeatherStation } from '../map/map';

interface UseStationDrawerReturn {
  selectedStation: WeatherStation | null;
  isDrawerOpen: boolean;
  handleStationSelect: (station: WeatherStation) => void;
  closeDrawer: () => void;
}

export default function useStationDrawer(): UseStationDrawerReturn {
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleStationSelect = useCallback((station: WeatherStation) => {
    console.log('🟢 USE_STATION_DRAWER - handleStationSelect called:', {
      newStation: {
        name: station.Station,
        stid: station.Stid,
        elevation: station.Elevation
      },
      previousStation: selectedStation?.Station || 'None',
      drawerWasOpen: isDrawerOpen
    });
    
    setSelectedStation(station);
    setIsDrawerOpen(true);
  }, [selectedStation, isDrawerOpen]);

  const closeDrawer = useCallback(() => {
    console.log('🟢 USE_STATION_DRAWER - closeDrawer called:', {
      closingStation: selectedStation?.Station || 'None'
    });
    
    setIsDrawerOpen(false);
    setSelectedStation(null);
  }, [selectedStation]);

  return {
    selectedStation,
    isDrawerOpen,
    handleStationSelect,
    closeDrawer
  };
}