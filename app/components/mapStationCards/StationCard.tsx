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

const StationCard = ({ station, stationIds, onStationClick, observationsData, isActive, onDropdownToggle, filteredObservationsDataHour, tableMode, isMetric }: StationCardProps) => {
  const [snowAccordionOpen, setSnowAccordionOpen] = useState(false);
  const [tempAccordionOpen, setTempAccordionOpen] = useState(false);
  const [windAccordionOpen, setWindAccordionOpen] = useState(false);

  // Only render if station is in stationIds
  if (!stationIds.includes(station.Stid)) {
    return null;
  }

  // console.log('Station data:', station);
  // console.log('Observations data:', observationsData);\
  console.log('Station data:', station);
  console.log('Filtered observations data:', filteredObservationsDataHour);

  // const stationDataDay = observationsData?.data?.filter((obs: { Stid: string }) => obs.Stid === station.Stid);
  // const stationDataHour = observationsData?.data?.filter((obs: { Stid: string }) => obs.Stid === station.Stid);
  const stationDataHourFiltered = filteredObservationsDataHour?.data?.filter(
    (obs: { Station: string }) => obs.Station === station.Station
  );

  console.log('Station:', station.Station);
  console.log('Filtered data for station:', stationDataHourFiltered);

  // Filter and format the data for the graph
  const formattedData = {
    data: filteredObservationsDataHour?.data?.filter(
      (obs: { Station: string }) => obs.Station === station.Station
    ) || [],
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
        <Popover.Content className="PopoverContent">

          
          {/* <div className="station-card-header">
            <h2 className="station-name">{station.Station}</h2>
          </div>
          
          <p className="station-elevation">
            {station.Elevation}
          </p> */}

          {observationsData  &&(
            <AccordionWrapper
              title="Hourly Snow and Temperature Graph"
              subtitle={station.title}
              defaultExpanded={false}
            >
              <WxSnowGraph 
                dayAverages={formattedData}
                isHourly={true}
                isMetric={isMetric}
              />
            </AccordionWrapper>
          )}
{/* 
          {observationsData && (
            <AccordionWrapper
              title="Daily Snow and Temperature Graph"
              subtitle={station.title}
              defaultExpanded={false}
            >
              <DayWxSnowGraph 
              dayAverages={{ 
                data: [station],
                title: station.Station
              }}
                isMetric={isMetric}
              />
            </AccordionWrapper>
          )} */}

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

          {/* {filteredObservationsDataHour && (
            <HourWxTable 
              hourAverages={filteredObservationsDataHour} 
            />
          )}

          {observationsDataHour && (
            <HourWxTable 
              hourAverages={observationsDataHour} 
            />
          )} */}

				<Popover.Close className="PopoverClose" aria-label="Close">
					<Cross2Icon />
				</Popover.Close>            
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default StationCard; 