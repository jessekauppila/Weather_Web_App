import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Cross2Icon } from "@radix-ui/react-icons";
import MeasurementCard from './MeasurementCard';
import './StationCard.css';

// Importing the DayAveragesTable component from the vis folder
import DayAveragesTable from '../../vis/dayWxTable';
import DayWxSnowGraph from '../../vis/dayWxSnowGraph';
import HourWxTable from '../../vis/hourWxTable';
import WxSnowGraph from '../../vis/wxSnowGraph';
import AccordionWrapper from '../../components/mapStationCards/AccordionWrapper';


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
  stationIds: string[];
}

const StationCard = ({ station, stationIds, onStationClick, observationsData, observationsDataDay, observationsDataHour, isActive, onDropdownToggle, filteredObservationsDataHour, tableMode, isMetric }: StationCardProps) => {
  const [snowAccordionOpen, setSnowAccordionOpen] = useState(false);
  const [tempAccordionOpen, setTempAccordionOpen] = useState(false);
  const [windAccordionOpen, setWindAccordionOpen] = useState(false);

  // Only render if station is in stationIds
  if (!stationIds.includes(station.Stid)) {
    return null;
  }

  // Filter and format the data for the graph
  const stationDataHourFiltered = {
    data: filteredObservationsDataHour?.data?.filter(
      (obs: { Station: string }) => obs.Station === station.Station
    ) || [],
    title: `Filtered Hourly Data - ${station.Station}`
  };

  // Filter and format the data for the graph
  const stationDataHourUnFiltered = {
    data: observationsDataHour?.data?.filter(
      (obs: { Station: string }) => obs.Station === station.Station
    ) || [],
    title: `Raw Hourly Data - ${station.Station}`
  };

  // Format daily data to match DayWxSnowGraph expectations
  // Use the hourly data and format it for the graph
  const stationDataForGraph = {
    data: filteredObservationsDataHour?.data?.filter(
      (obs: { Station: string }) => obs.Station === station.Station
    ).map((obs: { 
      Station: string; 
      Day: string; 
      Hour: string; 
      'Snow Depth'?: string; 
      'New Snow'?: string;
      'Air Temp'?: string;
      'Precip'?: string;
    }) => ({
      Date: `${obs.Day} ${obs.Hour}`,
      'Total Snow Depth': obs['Snow Depth'] || '0 in',
      '24h Snow Accumulation': obs['New Snow'] || '0 in',
      'Air Temp Min': obs['Air Temp'],
      'Air Temp Max': obs['Air Temp'],
      'Precip Accum One Hour': obs['Precip'] || '0 in'
    })) || [],
    title: station.Station
  };

  return (
    <Popover.Root>
      <Popover.Trigger>
        <div className="station-card">
          <div className="station-card-header">
            <h2 className="station-name">{station.Station}</h2>
          </div>
          
          <p className="station-elevation">
            {station.Elevation}, {station.Latitude}, {station.Longitude}

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
        <Popover.Content className="PopoverContent">

          
          <div className="station-card-header">
            <h2 className="station-name">{station.Station}</h2>
          </div>
          
          <p className="station-elevation">
            {station.Elevation}
          </p>

          {stationDataHourFiltered  &&(
            <AccordionWrapper
              title="Hourly Snow and Temperature Graph"
              subtitle={station.title}
              defaultExpanded={false}
            >
              <WxSnowGraph 
                dayAverages={stationDataHourFiltered}
                isHourly={true}
                isMetric={isMetric}
              />
            </AccordionWrapper>
          )}

          {stationDataForGraph && (
            <AccordionWrapper
              title="Daily Snow and Temperature Graph"
              subtitle={station.title}
              defaultExpanded={false}
            >
              <DayWxSnowGraph 
              dayAverages={stationDataForGraph}
                isMetric={isMetric}
              />
            </AccordionWrapper>
          )}

          {station && (
            <DayAveragesTable 
              dayAverages={{ 
                data: [station],
                title: station.Station
              }}
              onStationClick={onStationClick}
              mode={tableMode}
            />
          )}

        {stationDataHourFiltered && (
            <HourWxTable 
              hourAverages={stationDataHourFiltered} 
            />
          )}


        
          {stationDataHourUnFiltered && (
            <HourWxTable 
              hourAverages={stationDataHourUnFiltered} 
            />
          )}

				<Popover.Close className="PopoverClose" aria-label="Close">
					<Cross2Icon />
				</Popover.Close>            
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default StationCard; 