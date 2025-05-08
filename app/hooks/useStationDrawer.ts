// app/hooks/useStationDrawer.ts
import { useState, useCallback } from 'react';
import type { WeatherStation } from '../map/map';
import type { PickingInfo } from '@deck.gl/core';
import type { Map_BlockProperties } from '../map/map';

interface UseStationDrawerProps {
  mapData?: {
    stationData: {
      features: Array<{
        properties: Map_BlockProperties;
      }>;
    };
  };
}

interface UseStationDrawerReturn {
  selectedStation: WeatherStation | null;
  isDrawerOpen: boolean;
  handleStationClick: (info: PickingInfo) => void;
  handleStationSelect: (station: WeatherStation) => void;
  closeDrawer: () => void;
}

export default function useStationDrawer({ mapData }: UseStationDrawerProps): UseStationDrawerReturn {
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const formatValue = (value: number | string | null | undefined, unit: string) => {
    if (value === null || value === undefined || value === '-') return '-';
    return `${value} ${unit}`;
  };

  const handleStationClick = useCallback((info: PickingInfo) => {
    if (info.object && 'properties' in info.object) {
      const properties = (info.object as { properties: Map_BlockProperties }).properties;
      
      const fullStationData = mapData?.stationData.features.find(
        f => f.properties.stationName === properties.stationName
      );

      if (fullStationData) {
        const station: WeatherStation = {
          Station: properties.stationName,
          'Cur Air Temp': formatValue(properties.curAirTemp, '°F'),
          '24h Snow Accumulation': formatValue(properties.snowAccumulation24h, 'in'),
          'Cur Wind Speed': properties.curWindSpeed || '-',
          'Elevation': formatValue(properties.elevation, 'ft'),
          'Stid': fullStationData.properties.stationName,
          'Air Temp Min': formatValue(properties.airTempMin, '°F'),
          'Air Temp Max': formatValue(properties.airTempMax, '°F'),
          'Wind Speed Avg': properties.windSpeedAvg || '-',
          'Max Wind Gust': properties.maxWindGust || '-',
          'Wind Direction': properties.windDirection || '-',
          'Total Snow Depth Change': formatValue(properties.totalSnowDepthChange, 'in'),
          'Precip Accum One Hour': properties.precipAccumOneHour || '-',
          'Total Snow Depth': formatValue(properties.totalSnowDepth, 'in'),
          'Latitude': properties.latitude.toString(),
          'Longitude': properties.longitude.toString(),
          'Relative Humidity': formatValue(properties.relativeHumidity, '%'),
          'Api Fetch Time': properties.fetchTime || new Date().toISOString()
        };

        setSelectedStation(station);
        setIsDrawerOpen(true);
      }
    }
  }, [mapData]);

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
    handleStationClick,
    handleStationSelect,
    closeDrawer
  };
}