import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Cross2Icon } from "@radix-ui/react-icons";
import MeasurementCard from './MeasurementCard';
import './StationCard.css';

// Importing the DayAveragesTable component from the vis folder
import DayAveragesTable from '../../vis/dayWxTable';
// import DayWxSnowGraph from '../vis/dayWxSnowGraph';
// import HourWxTable from '../vis/hourWxTable';
// import WxSnowGraph from '../vis/wxSnowGraph';
// import AccordionWrapper from './mapStationCards/AccordionWrapper';


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
  observationsDataDay: any;
  observationsDataHour: any;
  dayAverages: any;
  filteredObservationsDataHour: any;
  isMetric: boolean;
  tableMode: 'summary' | 'daily';
}

const StationCard = ({ station, onStationClick, observationsData, isActive, onDropdownToggle, tableMode }: StationCardProps) => {
  console.log('Station data:', station);
  console.log('Observations data:', observationsData);

  const [snowAccordionOpen, setSnowAccordionOpen] = useState(false);
  const [tempAccordionOpen, setTempAccordionOpen] = useState(false);
  const [windAccordionOpen, setWindAccordionOpen] = useState(false);

  return (
    <Popover.Root>
      <Popover.Trigger>
        <div className="station-card">
          <div className="station-card-header">
            <h2 className="station-name">{station.Station}</h2>
          </div>
          
          <p className="station-elevation">
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
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '6px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          color: 'black'
        }}>
          <div className="station-card-header">
            <h2 className="station-name">{station.Station}</h2>
          </div>
          
          <p className="station-elevation">
            {station.Elevation}
          </p>

          {observationsData && (
            <DayAveragesTable 
              dayAverages={{ 
                data: [station],
                title: station.Station
              }}
              onStationClick={onStationClick}
              mode={tableMode}
            />
          )}

          <Popover.Close style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            cursor: 'pointer'
          }}>
            <Cross2Icon />
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default StationCard; 