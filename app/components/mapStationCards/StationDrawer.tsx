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

// Debug Info Panel Component
const DebugInfoPanel = ({ 
  station, 
  observationsDataDay,
  observationsDataHour,
  filteredObservationsDataHour,
  stationDataHourFiltered,
  stationDataHourUnFiltered 
}: any) => {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      padding: '8px',
      marginBottom: '24px',
      borderRadius: '5px',
      color: '#e0e0e0',
      fontSize: '0.75rem',
      overflowX: 'auto',
      maxHeight: '240px'
    }}>
      <div style={{ fontWeight: 500, marginBottom: '8px', color: '#9e9e9e' }}>
        Debug Info
      </div>
      
      <div className="mb-2">
        <span style={{ fontWeight: 500 }}>Station:</span> {station ? station.Station : 'none'}<br />
        <span style={{ fontWeight: 500 }}>Station Data:</span> {station ? 'Available' : 'Missing'}
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <span style={{ fontWeight: 500 }}>Raw Data Sources:</span>
          <ul style={{ listStyleType: 'disc', paddingLeft: '16px', marginTop: '4px' }}>
            <li>Day Obs: {observationsDataDay?.data?.length || 0} items</li>
            <li>Hour Obs: {observationsDataHour?.data?.length || 0} items</li>
            <li>Filtered Hour: {filteredObservationsDataHour?.data?.length || 0} items</li>
          </ul>
        </div>
        <div>
          <span style={{ fontWeight: 500 }}>Processed Data:</span>
          <ul style={{ listStyleType: 'disc', paddingLeft: '16px', marginTop: '4px' }}>
            <li>Filtered: {stationDataHourFiltered?.data?.length || 0} items</li>
            <li>Unfiltered: {stationDataHourUnFiltered?.data?.length || 0} items</li>
          </ul>
        </div>
      </div>
      
      <details>
        <summary style={{ fontWeight: 500, cursor: 'pointer', marginBottom: '4px' }}>
          Raw Data Sample
        </summary>
        <pre style={{ 
          fontSize: '9px', 
          overflow: 'auto', 
          maxHeight: '80px', 
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '3px',
          padding: '4px'
        }}>
          {JSON.stringify(
            {
              station: station || {},
              hourSample: stationDataHourFiltered?.data?.[0] || {},
              unfilteredSample: stationDataHourUnFiltered?.data?.[0] || {}
            },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
};

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
  
  // State for debug mode
  const [showDebug, setShowDebug] = useState(false);
  
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
    try {
      if (!station || !filteredObservationsDataHour?.data) {
        console.log("No station or filteredObservationsDataHour data for filtered hours");
        return {
          data: [],
          title: station ? `Filtered Hourly Data - ${station.Station}` : ''
        };
      }
      
      // Filter the data for the current station
      const filteredData = filteredObservationsDataHour.data.filter(
        (obs: { Station: string }) => obs?.Station === station.Station
      );
      
      // Process the data to ensure it has the correct format for HourWxTable
      const processedData = filteredData.map((item: any) => {
        // Format the date: convert numeric dates like "3/23/2025" to "Mar 23"
        let formattedDate = item.Day;
        if (typeof item.Day === 'string' && item.Day.includes('/')) {
          try {
            const dateParts = item.Day.split('/');
            if (dateParts.length >= 2) {
              const month = parseInt(dateParts[0], 10);
              const day = parseInt(dateParts[1], 10);
              
              // Convert month number to abbreviation
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              if (month >= 1 && month <= 12) {
                formattedDate = `${monthNames[month-1]} ${day}`;
              }
            }
          } catch (e) {
            console.error("Error formatting date:", e);
          }
        }
        
        // Handle hour conversion properly
        let formattedHour = item.Hour;
        if (typeof item.Hour === 'string') {
          // If it's already in 12-hour format (contains AM/PM), keep it
          if (item.Hour.includes('AM') || item.Hour.includes('PM')) {
            formattedHour = item.Hour;
          } else {
            // Extract the hour part, handling formats like "0:00", "2:00", "14:00", or even just "14"
            const hourParts = item.Hour.split(':');
            const hour = parseInt(hourParts[0], 10);
            
            if (!isNaN(hour)) {
              // Format to 12-hour time
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
              formattedHour = `${hour12}:00 ${ampm}`;
            }
          }
        }
        
        return {
          ...item, // Keep all original properties
          Day: formattedDate,
          Hour: formattedHour,
          "Station": item.Station,
          "Elevation": station?.Elevation || '-',
          "Air Temp": item['Air Temp'] || '-',
          "Total Snow Depth": item['Snow Depth'] || item['Total Snow Depth'] || '-',
          "24h Snow Depth": item['New Snow'] || item['24h Snow Accumulation'] || '-',
          "Precipitation": item['Precip'] || item['Precip Accum One Hour'] || '-',
          "Precip Accum": item['Precip Accum One Hour'] || '-',
          "Wind Speed": item['Cur Wind Speed'] || item['Wind Speed Avg'] || '-',
          "Wind Gust": item['Max Wind Gust'] || '-',
          "Wind Direction": item['Wind Direction'] || '-',
          "Relative Humidity": item['Relative Humidity'] || '-',
          "Solar Radiation": '-', // Not available in our data
          "API Fetch Time": item['Api Fetch Time'] || new Date().toLocaleString()
        };
      });
      
      console.log(`Found ${filteredData.length} filtered observations for station ${station.Station}`);
      if (processedData.length > 0) {
        console.log("Sample processed data item:", processedData[0]);
      }
      
      return {
        data: processedData,
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
      
      // Filter the data for the current station
      const filteredData = observationsDataHour.data.filter(
        (obs: { Station: string }) => obs?.Station === station.Station
      );
      
      // Process the data to ensure it has the correct format for HourWxTable
      const processedData = filteredData.map((item: any) => {
        // Format the date: convert numeric dates like "3/23/2025" to "Mar 23"
        let formattedDate = item.Day;
        if (typeof item.Day === 'string' && item.Day.includes('/')) {
          try {
            const dateParts = item.Day.split('/');
            if (dateParts.length >= 2) {
              const month = parseInt(dateParts[0], 10);
              const day = parseInt(dateParts[1], 10);
              
              // Convert month number to abbreviation
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              if (month >= 1 && month <= 12) {
                formattedDate = `${monthNames[month-1]} ${day}`;
              }
            }
          } catch (e) {
            console.error("Error formatting date:", e);
          }
        }
        
        // Handle hour conversion properly
        let formattedHour = item.Hour;
        if (typeof item.Hour === 'string') {
          // If it's already in 12-hour format (contains AM/PM), keep it
          if (item.Hour.includes('AM') || item.Hour.includes('PM')) {
            formattedHour = item.Hour;
          } else {
            // Extract the hour part, handling formats like "0:00", "2:00", "14:00", or even just "14"
            const hourParts = item.Hour.split(':');
            const hour = parseInt(hourParts[0], 10);
            
            if (!isNaN(hour)) {
              // Format to 12-hour time
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
              formattedHour = `${hour12}:00 ${ampm}`;
            }
          }
        }
        
        return {
          ...item, // Keep all original properties
          Day: formattedDate,
          Hour: formattedHour,
          "Station": item.Station,
          "Elevation": station?.Elevation || '-',
          "Air Temp": item['Air Temp'] || '-',
          "Total Snow Depth": item['Snow Depth'] || item['Total Snow Depth'] || '-',
          "24h Snow Depth": item['New Snow'] || item['24h Snow Accumulation'] || '-',
          "Precipitation": item['Precip'] || item['Precip Accum One Hour'] || '-',
          "Precip Accum": item['Precip Accum One Hour'] || '-',
          "Wind Speed": item['Cur Wind Speed'] || item['Wind Speed Avg'] || '-',
          "Wind Gust": item['Max Wind Gust'] || '-',
          "Wind Direction": item['Wind Direction'] || '-',
          "Relative Humidity": item['Relative Humidity'] || '-',
          "Solar Radiation": '-', // Not available in our data
          "API Fetch Time": item['Api Fetch Time'] || new Date().toLocaleString()
        };
      });
      
      console.log(`Found ${filteredData.length} unfiltered observations for station ${station.Station}`);
      if (processedData.length > 0) {
        console.log("Sample processed data item:", processedData[0]);
      }
      
      return {
        data: processedData,
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

  // Add debugging log
  useEffect(() => {
    if (isOpen && stationDataHourFiltered?.data?.length > 0) {
      console.log("HOURLY DATA FORMAT CHECK:", {
        sample: stationDataHourFiltered.data[0],
        keys: Object.keys(stationDataHourFiltered.data[0])
      });
    }
  }, [isOpen, stationDataHourFiltered]);

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
              onClick={() => setShowDebug(!showDebug)}
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                color: showDebug ? '#9e9e9e' : '#424242',
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {showDebug ? 'Hide Debug' : 'Debug'}
            </button>
            
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
          {/* Debug Info Panel */}
          {showDebug && (
            <DebugInfoPanel
              station={station}
              observationsDataDay={observationsDataDay}
              observationsDataHour={observationsDataHour}
              filteredObservationsDataHour={filteredObservationsDataHour}
              stationDataHourFiltered={stationDataHourFiltered}
              stationDataHourUnFiltered={stationDataHourUnFiltered}
            />
          )}
          
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
                title={`Filtered Hourly Data (${stationDataHourFiltered.data.length} records)`}
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
                title={`Raw Hourly Data (${stationDataHourUnFiltered.data.length} records)`}
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