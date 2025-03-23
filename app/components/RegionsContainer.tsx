import React, { Dispatch, SetStateAction } from 'react';
import RegionCard from './mapStationCards/RegionCard';
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
  setActiveDropdown: Dispatch<SetStateAction<string | null>>;
  observationsDataDay: any;
  observationsDataHour: any;
  filteredObservationsDataHour: any;
  isMetric: boolean;
  tableMode: 'summary' | 'daily';
}

export function RegionsContainer({
  observationsData,
  handleStationClick,
  activeDropdown,
  setActiveDropdown,
  observationsDataDay,
  observationsDataHour,
  filteredObservationsDataHour,
  isMetric,
  tableMode
}: RegionsContainerProps) {
  if (!observationsData) return null;
  
  return (
    <div className="space-y-4">
      {regions.map((region, index) => (
        <RegionCard
          key={index}
          title={region.title}
          stationIds={region.stationIds}
          stations={observationsData?.data || []}
          onStationClick={handleStationClick}
          observationsData={observationsData}
          activeDropdown={activeDropdown}
          onDropdownToggle={setActiveDropdown}
          observationsDataDay={observationsDataDay}
          observationsDataHour={observationsDataHour}
          filteredObservationsDataHour={filteredObservationsDataHour}
          isMetric={isMetric}
          tableMode={tableMode}
          dayAverages={observationsDataDay}
        />
      ))}
    </div>
  );
} 