import React from 'react';
import StationCard from './StationCard';

interface RegionCardProps {
  title: string;
  stations: Array<{
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
  stationIds: string[];
  onStationClick: (stid: string) => void;
  observationsData: {
    data: any[];
    title: string;
  } | null;
  activeDropdown: string | null;
  onDropdownToggle: (stid: string | null) => void;
}

const RegionCard = ({ 
  title, 
  stations, 
  stationIds, 
  onStationClick,
  observationsData,
  activeDropdown,
  onDropdownToggle
}: RegionCardProps) => (
  <div className="bg-[cornflowerblue] bg-opacity-10 p-4 rounded-lg mb-4">
    <h2 className="text-xl text-black font-bold mb-4">{title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stations.filter(station => 
        stationIds.includes(station.Stid)
      ).map((station, index) => (
        <StationCard 
          key={index} 
          station={station} 
          onStationClick={onStationClick}
          observationsData={observationsData}
          isActive={activeDropdown === station.Stid}
          onDropdownToggle={onDropdownToggle}
        />
      ))}
    </div>
  </div>
);

export default RegionCard; 