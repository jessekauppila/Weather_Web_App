import { useState, useEffect, useCallback } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { TableMode } from './useViewState';  // Import the type

interface UseStationsProps {
  setTableMode: (mode: TableMode) => void;
}

interface Station {
  id: string;
  name: string;
}

export function useStations({ setTableMode }: UseStationsProps) {
  const [stations, setStations] = useState<Station[]>([]);
    const [selectedStation, setSelectedStation] = useState<string>('');
  const [stationIds, setStationIds] = useState<string[]>([]);
  const [isStationChanging, setIsStationChanging] = useState(false);

  // Fetch stations
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch('/api/getStations');
        if (!response.ok) throw new Error('Failed to fetch stations');
        
        const data = await response.json();
        const mappedStations = data
          .map((station: any) => ({
            id: station.stid,
            name: station.station_name,
          }))
          .sort((a: Station, b: Station) => a.name.localeCompare(b.name));

        setStations(mappedStations);
        setStationIds(mappedStations.map((station: Station) => station.id));
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
    };

    fetchStations();
  }, []);

  const handleStationChange = useCallback((event: SelectChangeEvent<string>) => {
    const selectedStationId = event.target.value;
    
    if (!selectedStationId) {
      setSelectedStation('');
      // setStationIds(stations.map(station => station.id));
      setTableMode('summary');  // Set mode directly here
    } else {
      setSelectedStation(selectedStationId);
      // setStationIds([selectedStationId]);
      setTableMode('daily');    // Set mode directly here
    }
  }, [stations, setTableMode]);

  const handleStationClick = useCallback((stationId: string) => {
    setIsStationChanging(true);
    setSelectedStation(stationId);
    // setStationIds([stationId]);
    setTableMode('daily');      // Set mode directly here
    
    setTimeout(() => {
      setIsStationChanging(false);
    }, 300);
  }, [setTableMode]);

  return {
    stations,
    selectedStation,
    stationIds,
    isStationChanging,
    handleStationChange,
    handleStationClick
  };
} 