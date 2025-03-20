import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import DayAveragesTable from '../../vis/dayWxTable';
import DayWxSnowGraph from '../../vis/dayWxSnowGraph';
import HourWxTable from '../../vis/hourWxTable';
import WxSnowGraph from '../../vis/wxSnowGraph';
import AccordionWrapper from './AccordionWrapper';
import MeasurementCard from './MeasurementCard';

interface StationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
  } | null;
  observationsDataDay: any;
  observationsDataHour: any;
  filteredObservationsDataHour: any;
  isMetric: boolean;
  tableMode: 'summary' | 'daily';
}

const StationDrawer: React.FC<StationDrawerProps> = ({
  isOpen,
  onClose,
  station,
  observationsDataDay,
  observationsDataHour,
  filteredObservationsDataHour,
  isMetric,
  tableMode
}) => {
  const [snowAccordionOpen, setSnowAccordionOpen] = React.useState(false);
  const [tempAccordionOpen, setTempAccordionOpen] = React.useState(false);
  const [windAccordionOpen, setWindAccordionOpen] = React.useState(false);

  // Filter and format the data for the graphs
  const stationDataHourFiltered = useMemo(() => {
    if (!station) return { data: [], title: '' };
    return {
      data: filteredObservationsDataHour?.data?.filter(
        (obs: { Station: string }) => obs.Station === station.Station
      ) || [],
      title: `Filtered Hourly Data - ${station.Station}`
    };
  }, [filteredObservationsDataHour, station]);

  const stationDataHourUnFiltered = useMemo(() => {
    if (!station) return { data: [], title: '' };
    return {
      data: observationsDataHour?.data?.filter(
        (obs: { Station: string }) => obs.Station === station.Station
      ) || [],
      title: `Raw Hourly Data - ${station.Station}`
    };
  }, [observationsDataHour, station]);

  const stationDataForGraph = useMemo(() => {
    if (!station) return { data: [], title: '' };
    return {
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
  }, [filteredObservationsDataHour, station]);

  const stationDayData = useMemo(() => {
    if (!station) return { data: [], title: '' };
    return {
      data: [station],
      title: station.Station
    };
  }, [station]);

  if (!station) return null;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl"
      style={{
        height: "95vh",
        width: "100%",
        zIndex: 1000,
        touchAction: 'none',
        transformOrigin: "bottom"
      }}
      initial={{ y: "100%", scale: 0.9 }}
      animate={{ 
        y: isOpen ? "0%" : "100%",
        scale: isOpen ? 1 : 0.9
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400,
        damping: 40,
        scale: {
          type: "spring",
          stiffness: 500,
          damping: 30
        }
      }}
      drag="y"
      dragPropagation={false}
      dragConstraints={{ 
        top: 0,
        bottom: window.innerHeight * 0.95
      }}
      dragElastic={0.2}
      dragMomentum={false}
      onDragEnd={(event, info) => {
        const currentY = info.point.y;
        const windowHeight = window.innerHeight;
        
        if (currentY > windowHeight * 0.95) {
          onClose();
        } else if (currentY < windowHeight * 0.05) {
          // Keep drawer open at full height
        }
      }}
    >
      <div className="p-4">
        <div
          className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing"
          onClick={onClose}
        />
        
        {/* Station Header */}
        <div className="station-card-header mb-4">
          <h2 className="station-name text-lg font-semibold text-gray-800">{station.Station}</h2>
          <p className="station-elevation text-sm text-gray-600">{station.Elevation}</p>
        </div>

        {/* Measurement Cards */}
        <div className="measurement-grid grid grid-cols-3 gap-4 mb-6">
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
        
        <div className="overflow-auto" style={{ height: 'calc(95vh - 250px)' }}>
          {/* Station Summary Table */}
          <div className="mb-6">
            <AccordionWrapper
              title="Station Summary"
              subtitle={station.Station}
              defaultExpanded={false}
            >
              <DayAveragesTable 
                dayAverages={stationDayData}
                onStationClick={() => {}}
                mode={tableMode}
              />
            </AccordionWrapper>
          </div>

          {/* Hourly Snow and Temperature Graph */}
          {stationDataHourFiltered.data.length > 0 && (
            <div className="mb-6">
              <AccordionWrapper
                title="Hourly Snow and Temperature Graph"
                subtitle={station.Station}
                defaultExpanded={false}
              >
                <WxSnowGraph 
                  dayAverages={stationDataHourFiltered}
                  isHourly={true}
                  isMetric={isMetric}
                />
              </AccordionWrapper>
            </div>
          )}

          {/* Daily Snow and Temperature Graph */}
          {stationDataForGraph.data.length > 0 && (
            <div className="mb-6">
              <AccordionWrapper
                title="Daily Snow and Temperature Graph"
                subtitle={station.Station}
                defaultExpanded={false}
              >
                <DayWxSnowGraph 
                  dayAverages={stationDataForGraph}
                  isMetric={isMetric}
                />
              </AccordionWrapper>
            </div>
          )}

          {/* Filtered Hourly Data Table */}
          {stationDataHourFiltered.data.length > 0 && (
            <div className="mb-6">
              <AccordionWrapper
                title="Filtered Hourly Data"
                subtitle={station.Station}
                defaultExpanded={false}
              >
                <HourWxTable 
                  hourAverages={stationDataHourFiltered} 
                />
              </AccordionWrapper>
            </div>
          )}

          {/* Raw Hourly Data Table */}
          {stationDataHourUnFiltered.data.length > 0 && (
            <div className="mb-6">
              <AccordionWrapper
                title="Raw Hourly Data"
                subtitle={station.Station}
                defaultExpanded={false}
              >
                <HourWxTable 
                  hourAverages={stationDataHourUnFiltered} 
                />
              </AccordionWrapper>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StationDrawer; 