import { useState, useCallback } from 'react';
import type { WeatherStation } from '../map/map';

interface UseStationDrawerReturn {
  selectedStations: WeatherStation[]; // Array instead of single
  isDrawerOpen: boolean;
  handleStationSelect: (stations: WeatherStation[]) => void; // Array parameter
  handleStationToggle: (station: WeatherStation) => void; // New: toggle individual station
  closeDrawer: () => void;
}

export default function useStationDrawer(): UseStationDrawerReturn {
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleStationSelect = useCallback((station: WeatherStation) => {
    setSelectedStation(station);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedStation(null);
  }, []);

  return {
    selectedStation,
    isDrawerOpen,
    handleStationSelect,
    closeDrawer
  };
}