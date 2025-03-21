import React, { useMemo, useState, useEffect } from 'react';
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
  // Debug logs
  console.log("StationDrawer rendered with:", {
    station,
    observationsDataDay: observationsDataDay?.data?.length,
    observationsDataHour: observationsDataHour?.data?.length,
    filteredObservationsDataHour: filteredObservationsDataHour?.data?.length
  });
  
  // Filter and format the data for the graphs
  const stationDataHourFiltered = useMemo(() => {
    try {
      if (!station || !filteredObservationsDataHour?.data) {
        console.log("No station or filteredObservationsDataHour data for filtered hours");
        return {
          data: [],
          title: station ? `Filtered Hourly Data - ${station.Station}` : ''
        };
      }
      
      const filteredData = filteredObservationsDataHour.data.filter(
        (obs: { Station: string }) => obs?.Station === station.Station
      );
      
      console.log(`Found ${filteredData.length} filtered observations for station ${station.Station}`);
      
      return {
        data: filteredData,
        title: `Filtered Hourly Data - ${station.Station}`
      };
    } catch (error) {
      console.error("Error processing filtered hour data:", error);
      return {
        data: [],
        title: station ? `Filtered Hourly Data - ${station.Station}` : ''
      };
    }
  }, [filteredObservationsDataHour, station]);

  const stationDataHourUnFiltered = useMemo(() => {
    try {
      if (!station || !observationsDataHour?.data) {
        console.log("No station or observationsDataHour data for unfiltered hours");
        return {
          data: [],
          title: station ? `Raw Hourly Data - ${station.Station}` : ''
        };
      }
      
      const filteredData = observationsDataHour.data.filter(
        (obs: { Station: string }) => obs?.Station === station.Station
      );
      
      console.log(`Found ${filteredData.length} unfiltered observations for station ${station.Station}`);
      
      return {
        data: filteredData,
        title: `Raw Hourly Data - ${station.Station}`
      };
    } catch (error) {
      console.error("Error processing unfiltered hour data:", error);
      return {
        data: [],
        title: station ? `Raw Hourly Data - ${station.Station}` : ''
      };
    }
  }, [observationsDataHour, station]);

  const stationDataForGraph = useMemo(() => {
    try {
      if (!station || !filteredObservationsDataHour?.data) {
        console.log("No station or filteredObservationsDataHour data");
        return {
          data: [],
          title: station?.Station || ''
        };
      }

      const filteredData = filteredObservationsDataHour.data.filter(
        (obs: { Station: string }) => obs?.Station === station.Station
      );
      
      console.log(`Found ${filteredData.length} observations for station ${station.Station}`);
      
      const mappedData = filteredData.map((obs: any) => {
        try {
          return {
            Date: obs.Day && obs.Hour ? `${obs.Day} ${obs.Hour}` : new Date().toLocaleString(),
            'Total Snow Depth': obs['Snow Depth'] || '0 in',
            '24h Snow Accumulation': obs['New Snow'] || '0 in',
            'Air Temp Min': obs['Air Temp'] || '0 °F',
            'Air Temp Max': obs['Air Temp'] || '0 °F',
            'Precip Accum One Hour': obs['Precip'] || '0 in',
            'Cur Air Temp': obs['Air Temp'] || '0 °F'
          };
        } catch (obsError) {
          console.error("Error mapping observation:", obsError);
          return {
            Date: new Date().toLocaleString(),
            'Total Snow Depth': '0 in',
            '24h Snow Accumulation': '0 in',
            'Air Temp Min': '0 °F',
            'Air Temp Max': '0 °F',
            'Precip Accum One Hour': '0 in',
            'Cur Air Temp': '0 °F'
          };
        }
      });
      
      return {
        data: mappedData,
        title: station?.Station || ''
      };
    } catch (error) {
      console.error("Error processing graph data:", error);
      return {
        data: [],
        title: station?.Station || ''
      };
    }
  }, [filteredObservationsDataHour, station]);

  const stationDayData = useMemo(() => ({
    data: station ? [station] : [],
    title: station?.Station || ''
  }), [station]);

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
        <div className="text-sm font-semibold text-gray-600 mb-4">
          {station.Station}
        </div>
        
        <div className="overflow-auto" style={{ height: 'calc(95vh - 100px)' }}>
          {/* Station Summary Table */}
          <div className="mb-6">
            <DayAveragesTable 
              dayAverages={stationDayData}
              onStationClick={() => {}}
              mode={tableMode}
            />
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