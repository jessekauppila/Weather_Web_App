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
    setSelectedStation(station);
    setIsDrawerOpen(true);
  }, [selectedStation, isDrawerOpen]);

  const closeDrawer = useCallback(() => {
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