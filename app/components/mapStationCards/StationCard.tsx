import React, { useState } from 'react';
import MeasurementCard from './MeasurementCard';

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

const StationCard = ({ station, onStationClick, observationsData, isActive, onDropdownToggle }: StationCardProps) => {
  const [snowAccordionOpen, setSnowAccordionOpen] = useState(false);
  const [tempAccordionOpen, setTempAccordionOpen] = useState(false);
  const [windAccordionOpen, setWindAccordionOpen] = useState(false);

  return (
    <div className="station-card">
      <div 
        className="station-card-header"
        onClick={() => onStationClick(station.Stid)}
        style={{ cursor: 'pointer' }}
      >
        <h2 className="station-name">{station.Station}</h2>
      </div>
      
      <p 
        className="station-elevation" 
        onClick={() => onStationClick(station.Stid)}
        style={{ cursor: 'pointer' }}
      >
        {station.Elevation}
      </p>

      <div className="measurement-grid">
        <MeasurementCard 
          title="Snow"
          isOpen={snowAccordionOpen}
          onToggle={() => setSnowAccordionOpen(!snowAccordionOpen)}
          metricValue={station['24h Snow Accumulation'].replace(' in', '')}
          metricUnit=" in"
          subtitle="Accumulated"
          station={station}
        />

        <MeasurementCard 
          title="Temp"
          isOpen={tempAccordionOpen}
          onToggle={() => setTempAccordionOpen(!tempAccordionOpen)}
          metricValue={station['Cur Air Temp'].replace(' °F', '')}
          metricUnit="°F"
          subtitle="Current"
          station={station}
        />

        <MeasurementCard 
          title="Wind"
          isOpen={windAccordionOpen}
          onToggle={() => setWindAccordionOpen(!windAccordionOpen)}
          metricValue={station['Cur Wind Speed'].replace(' mph', '')}
          metricUnit=" mph"
          subtitle="Current"
          station={station}
        />
      </div>
    </div>
  );
};

export default StationCard; 