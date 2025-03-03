import DayAveragesTable from '../vis/dayWxTable';
import DayWxSnowGraph from '../vis/dayWxSnowGraph';
import HourWxTable from '../vis/hourWxTable';
import WxSnowGraph from '../vis/wxSnowGraph';
import AccordionWrapper from './map/AccordionWrapper';

interface WeatherDisplayProps {
  observationsDataDay: any;
  observationsDataHour: any;
  filteredObservationsDataHour: any;
  selectedStation: string;
  isMetric: boolean;
  handleStationClick: (stationId: string) => void;
  tableMode: 'summary' | 'daily';
}

export function WeatherDisplay({ 
  observationsDataDay, 
  observationsDataHour,
  filteredObservationsDataHour,
  selectedStation,
  isMetric,
  handleStationClick,
  tableMode
}: WeatherDisplayProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Graphs */}
      {filteredObservationsDataHour && observationsDataDay && selectedStation && (
        <AccordionWrapper
          title="Hourly Snow and Temperature Graph"
          subtitle={observationsDataDay.title}
          defaultExpanded={false}
        >
          <WxSnowGraph 
            dayAverages={filteredObservationsDataHour} 
            isHourly={true}
            isMetric={isMetric}
          />
        </AccordionWrapper>
      )}

      {observationsDataDay && selectedStation && (
        <AccordionWrapper
          title="Daily Snow and Temperature Graph"
          subtitle={observationsDataDay.title}
          defaultExpanded={false}
        >
          <DayWxSnowGraph 
            dayAverages={observationsDataDay} 
            isMetric={isMetric}
          />
        </AccordionWrapper>
      )}

      {/* Tables */}
      {observationsDataDay && selectedStation && (
        <DayAveragesTable 
          dayAverages={observationsDataDay} 
          onStationClick={handleStationClick}
          mode={tableMode}
        />
      )}

      {filteredObservationsDataHour && selectedStation && (
        <HourWxTable 
          hourAverages={filteredObservationsDataHour} 
        />
      )}

      {observationsDataHour && selectedStation && (
        <HourWxTable 
          hourAverages={observationsDataHour} 
        />
      )}
    </div>
  );
} 