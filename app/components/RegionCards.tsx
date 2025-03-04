import RegionCard from './mapStationCards/RegionCard';
import { regions } from '@/app/config/regions';

interface RegionCardsProps {
  observationsData: any;
  handleStationClick: (stationId: string) => void;
  activeDropdown: string | null;
  setActiveDropdown: (id: string | null) => void;
}

export function RegionCards({
  observationsData,
  handleStationClick,
  activeDropdown,
  setActiveDropdown
}: RegionCardsProps) {
  return (
    <>
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
    </>
  );
} 