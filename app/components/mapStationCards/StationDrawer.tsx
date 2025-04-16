import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import DayAveragesTable from '../../vis/dayWxTable';
import DayWxSnowGraph from '../../vis/dayWxSnowGraph';
import HourWxTable from '../../vis/hourWxTable';
import WxSnowGraph from '../../vis/wxSnowGraph';
import AccordionWrapper from './AccordionWrapper';
import './StationDrawer.css';

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
  // ===== DRAWER POSITIONING CONFIGURATION =====
  // Change these values to control drawer position and behavior
  
  // 1. TOOLBAR_HEIGHT: Height of the TimeToolbar component
  //    This sets where the drawer starts when fully open
  const TOOLBAR_HEIGHT = 135; 
  
  // 2. INITIAL_OPEN_HEIGHT: Starting height when drawer first opens
  //    Set to a smaller value for a partially open initial state
  //    Example: 400 will open to 400px height initially
  const INITIAL_OPEN_HEIGHT = 500;
  
  // 3. MIN_DRAWER_HEIGHT: Minimum allowed height when resizing
  //    Drawer can't be resized smaller than this
  const MIN_DRAWER_HEIGHT = 50;
  
  // 4. CLOSED_Y_POSITION: Where drawer goes when closed
  //    Use "100%" to hide it completely off-screen
  //    Use a pixel value to keep part of it visible when closed
  const CLOSED_Y_POSITION = "100%";
  // ===============================================
  
  // Calculate the initial top position based on desired height
  const initialTopPosition = window.innerHeight - INITIAL_OPEN_HEIGHT;
  
  // State to track the drawer's current top position
  const [drawerTop, setDrawerTop] = useState<number>(initialTopPosition);
  
  // State for resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const [lastMouseY, setLastMouseY] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  
  // Reset drawer to initial position when opened
  useEffect(() => {
    if (isOpen) {
      setDrawerTop(initialTopPosition);
    }
  }, [isOpen, initialTopPosition]);
  
  // Add event listeners for resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate the drag delta
      const deltaY = e.clientY - lastMouseY;
      setLastMouseY(e.clientY);
      
      // Update drawer position based on mouse movement
      // Moving the mouse DOWN increases top position (shorter drawer)
      // Moving the mouse UP decreases top position (taller drawer)
      setDrawerTop(prevTop => {
        let newTop = prevTop + deltaY;
        
        // Apply constraints
        // 1. Can't go higher than toolbar
        // 2. Can't be smaller than minimum height
        const maxTop = window.innerHeight - MIN_DRAWER_HEIGHT;
        
        if (newTop < TOOLBAR_HEIGHT) {
          newTop = TOOLBAR_HEIGHT;
        } else if (newTop > maxTop) {
          newTop = maxTop;
        }
        
        return newTop;
      });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    // Add global event listeners when resizing
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, lastMouseY]);
  
  // Handle mouse down on the resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setLastMouseY(e.clientY);
  };
  
  // Filter and format the data for the graphs
  const stationDataHourFiltered = useMemo(() => {
    if (!station || !filteredObservationsDataHour?.data) {
      return {
        data: [],
        title: station ? `Filtered Hourly Data - ${station.Station}` : ''
      };
    }

    

    return {
      data: filteredObservationsDataHour.data.filter(
        (obs: { Station: string }) => obs.Station === station.Station
      ),
      title: `Filtered Hourly Data - ${station.Station}`
    };
  }, [filteredObservationsDataHour, station]);

  // console.log('filteredObservationsDataHour in StationDrawer:', filteredObservationsDataHour);
  // console.log('stationDataHourFiltered in StationDrawer:', stationDataHourFiltered);

  const stationDataHourUnFiltered = useMemo(() => {
    if (!station || !observationsDataHour?.data) {
      return {
        data: [],
        title: station ? `Raw Hourly Data - ${station.Station}` : ''
      };
    }

    return {
      data: observationsDataHour.data.filter(
        (obs: { Station: string }) => obs.Station === station.Station
      ),
      title: `Raw Hourly Data - ${station.Station}`
    };
  }, [observationsDataHour, station]);

  

  // const stationDataForGraph = useMemo(() => {
  //   if (!station || !filteredObservationsDataHour?.data) {
  //     return {
  //       data: [],
  //       title: station?.Station || ''
  //     };
  //   }

  //   return {
  //     data: filteredObservationsDataHour.data.filter(
  //       (obs: { Station: string }) => obs.Station === station.Station
  //     ).map((obs: { 
  //       Station: string; 
  //       Day: string; 
  //       Hour: string; 
  //       'Snow Depth'?: string; 
  //       'New Snow'?: string;
  //       'Air Temp'?: string;
  //       'Precip'?: string;
  //     }) => ({
  //       Date: `${obs.Day} ${obs.Hour}`,
  //       'Total Snow Depth': obs['Snow Depth'] || '0 in',
  //       '24h Snow Accumulation': obs['New Snow'] || '0 in',
  //       'Air Temp Min': obs['Air Temp'],
  //       'Air Temp Max': obs['Air Temp'],
  //       'Precip Accum One Hour': obs['Precip'] || '0 in'
  //     })),
  //     title: station.Station
  //   };
  // }, [filteredObservationsDataHour, station]);

  console.log('observationsDataDay', observationsDataDay);

  const stationObservationsDataDay = useMemo(() => {
    if (!station || !observationsDataDay?.data) {
      return {
        data: [],
        title: station ? `Daily Data - ${station.Station}` : ''
      };
    }

    const filteredData = observationsDataDay.data.filter(
      (obs: { Station: string }) => obs.Station === station.Station
    );

    // Format the data to match the desired structure
    const formattedData = filteredData.map((obs: { 
      Station: string;
      'Start Date Time': string;
      'End Date Time': string;
      [key: string]: any;
    }) => ({
      ...obs,
      Date: obs['Start Date Time']?.split(',')[0] || '',
      Stid: `${obs['Start Date Time']?.split(',')[1]?.trim()} - ${obs['End Date Time']?.split(',')[1]?.trim()}`,
      Latitude: station.Latitude,
      Longitude: station.Longitude
    }));

    // Create the title with elevation and date range
    const title = `${station.Station} - ${station.Elevation}\n${formattedData[0]?.['Start Date Time']?.split(',')[1]?.trim()} - ${formattedData[0]?.['End Date Time']?.split(',')[1]?.trim()}`;

    return {
      data: formattedData,
      title
    };
  }, [observationsDataDay, station]);

  console.log('stationObservationsDataDay', stationObservationsDataDay);


  const stationDayData = useMemo(() => ({
    data: station ? [station] : [],
    title: station?.Station || ''
  }), [station]);

  
  if (!station) return null;

  // Calculate the drawer height based on top position
  // This ensures the drawer is always anchored to the bottom of the screen
  const drawerHeight = window.innerHeight - drawerTop;

  return (
    <motion.div
      ref={drawerRef}
      className="fixed left-0 right-0 bottom-0 bg-white shadow-lg rounded-t-xl"
      style={{
        top: isOpen ? `${drawerTop}px` : 'auto', // Position based on top when open
        height: drawerHeight,
        width: "100%",
        zIndex: 9999,
        transformOrigin: "bottom",
        pointerEvents: isOpen ? 'auto' : 'none',
        overflow: 'hidden'
      }}
      // Initial state animation - where drawer starts from before animating
      initial={{ y: "100%" }}
      // Animation targets - where drawer animates to when opening/closing 
      animate={{ 
        y: isOpen ? 0 : CLOSED_Y_POSITION,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400,
        damping: 40
      }}
    >
      {/* Resizable handle at the top */}
      <div 
        className="w-full h-6 cursor-ns-resize select-none bg-gray-100 border-b border-gray-200 flex justify-center items-center"
        onMouseDown={handleMouseDown}
        style={{
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div className="w-16 h-1.5 bg-gray-300 rounded-full" />
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-semibold text-gray-600">
            {station.Station}
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                color: '#424242',
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Simple scrollable content with just a visible scrollbar */}
        <div 
          className="custom-scrollbar overflow-y-auto pr-2" 
          style={{ 
            height: `calc(100% - 60px)`,
            minHeight: '120px',
            maxHeight: `${drawerHeight - 100}px`,
            overflowY: 'auto',
            position: 'relative'
          }}
        >
          {/* Station Summary Table */}
          <div className="mb-6">
            <DayAveragesTable 
              dayAverages={stationDayData}
              onStationClick={() => {}}
              mode={tableMode}
            />
          </div>
          
          
{/* //////////////////////////////////////////////////////////////// */}


          {/* Hourly Snow and Temperature Graph FIXED!!!!*/}
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
          {stationObservationsDataDay.data.length > 0 && (
            <div className="mb-6">
              <AccordionWrapper
                title="Daily Snow and Temperature Graph"
                subtitle={station.Station}
                defaultExpanded={false}
              >
                <DayWxSnowGraph 
                  dayAverages={stationObservationsDataDay}
                  isMetric={isMetric}
                />
              </AccordionWrapper>
            </div>
          )}

{/* //////////////////////////////////////////////////////////////// */}

          {/* Filtered Hourly Data Table */}
          {stationDayData.data.length > 0 && (
            <div className="mb-6">
              <AccordionWrapper
                title={`Filtered Hourly Data`}
                subtitle={station.Station}
                defaultExpanded={false}
              >
                <HourWxTable 
                  hourAverages={stationDayData} 
                />
              </AccordionWrapper>
            </div>
          )}

          {/* Raw Hourly Data Table */}
          {stationDataHourUnFiltered.data.length > 0 && (
            <div className="mb-6">
              <AccordionWrapper
                title={`Raw Hourly Data`}
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