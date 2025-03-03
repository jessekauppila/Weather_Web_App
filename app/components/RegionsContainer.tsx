import React from 'react';
import RegionCard from './map/RegionCard';
import { regions } from '@/app/config/regions';

interface RegionsContainerProps {
  observationsData: {
    data: Array<{
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
      'Relative Humidity': string;
      'Total Snow Depth': string;
      'Total Snow Depth Change': string;
      'Precip Accum One Hour': string;
      [key: string]: string;
    }>;
    title: string;
  } | null;
  handleStationClick: (stationId: string) => void;
  activeDropdown: string | null;
  setActiveDropdown: (id: string | null) => void;
}

export function RegionsContainer({
  observationsData,
  handleStationClick,
  activeDropdown,
  setActiveDropdown
}: RegionsContainerProps) {
  if (!observationsData) return null;
  
  return (
    <div className="space-y-4">
      {regions.map(region => (
        <RegionCard
          key={region.id}
          title={region.title}
          stations={observationsData.data}
          stationIds={region.stationIds}
          onStationClick={handleStationClick}
          observationsData={observationsData}
          activeDropdown={activeDropdown}
          onDropdownToggle={setActiveDropdown}
        />
      ))}
    </div>
  );
} 