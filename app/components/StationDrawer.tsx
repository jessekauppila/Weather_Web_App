import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import DayAveragesTable from '../vis/dayWxTable';
import DayWxSnowGraph from '../vis/dayWxSnowGraph';
import HourWxTable from '../vis/hourWxTable';
import WxSnowGraph from '../vis/wxSnowGraph';
import AccordionWrapper from './utils/AccordionWrapper';
import moment from 'moment-timezone';
import { DayRangeType } from '../types';
import './StationDrawer.css';
import { Tabs, Tab, Box } from '@mui/material';

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
  dayRangeType: DayRangeType;
  customTime: string;
  calculateCurrentTimeRange: () => string;
}

// TabPanel component for better organization and transitions
interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`station-tabpanel-${index}`}
      aria-labelledby={`station-tab-${index}`}
      {...other}
      style={{
        display: value === index ? 'block' : 'none',
        opacity: value === index ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const StationDrawer: React.FC<StationDrawerProps> = ({
  isOpen,
  onClose,
  station,
  observationsDataDay,
  observationsDataHour,
  filteredObservationsDataHour,
  isMetric,
  tableMode,
  dayRangeType,
  customTime,
  calculateCurrentTimeRange
}) => {
  // ===== DRAWER POSITIONING CONFIGURATION =====
  // TO ADJUST DRAWER HEIGHT: Change the INITIAL_OPEN_HEIGHT value below
  // Change these values to control drawer position and behavior
  
  // 1. TOOLBAR_HEIGHT: Height of the TimeToolbar component
  //    This sets where the drawer starts when fully open
  const TOOLBAR_HEIGHT = 135; 
  
  // 2. INITIAL_OPEN_HEIGHT: Starting height when drawer first opens
  //    Set to a smaller value for a partially open initial state
  //    Example: 400 will open to 400px height initially
  const INITIAL_OPEN_HEIGHT = 700;
  
  // 3. MIN_DRAWER_HEIGHT: Minimum allowed height when resizing
  //    Drawer can't be resized smaller than this
  const MIN_DRAWER_HEIGHT = 50;
  
  // 4. CLOSED_Y_POSITION: Where drawer goes when closed
  //    Use "100%" to hide it completely off-screen
  //    Use a pixel value to keep part of it visible when closed
  const CLOSED_Y_POSITION = "100%";
  // ===============================================
  
  // Get current year for consistent date formatting
  const currentYear = moment().year();
  
  // Calculate the initial top position based on desired height
  const initialTopPosition = window.innerHeight - INITIAL_OPEN_HEIGHT;
  
  // State to track the drawer's current top position
  const [drawerTop, setDrawerTop] = useState<number>(initialTopPosition);
  
  // State for resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const [lastMouseY, setLastMouseY] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Memoize the current time range value to avoid recalculation in other hooks
  const memoizedTimeRange = useMemo(() => {
    return Number(calculateCurrentTimeRange().split(" ")[0]) || 1;
  }, [calculateCurrentTimeRange]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Reset drawer to initial position when opened
  useEffect(() => {
    if (isOpen) {
      setDrawerTop(initialTopPosition);
      setActiveTab(0); // Reset to first tab when drawer opens
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
      console.log('No station or filteredObservationsDataHour data available');
      return {
        data: [],
        title: station ? `Filtered Hourly Data - ${station.Station}` : ''
      };
    }
    
    // Log the data to help with debugging
    console.log('filteredObservationsDataHour data:', 
      filteredObservationsDataHour.data.length, 
      'entries, first few:', 
      filteredObservationsDataHour.data.slice(0, 3)
    );

    const stationData = filteredObservationsDataHour.data.filter(
      (obs: { Station: string }) => obs.Station === station.Station
    );
    
    console.log('Filtered data for station', station.Station, ':', stationData.length, 'entries');

    return {
      data: stationData,
      title: `Filtered Hourly Data - ${station.Station}`
    };
  }, [
    station?.Station, 
    filteredObservationsDataHour?.data 
  ]);

  const stationDataHourUnFiltered = useMemo(() => {
    if (!station || !observationsDataHour?.data) {
      return {
        data: [],
        title: station ? `Raw Hourly Data - ${station.Station}` : ''
      };
    }

    // Get data for this specific station
    const filteredData = observationsDataHour.data.filter(
      (obs: { Station: string }) => obs.Station === station.Station
    );
    
    // If we have data, enhance it with the current station properties for consistency
    if (filteredData.length > 0) {
      // Add some station properties to each hourly observation
      const enhancedData = filteredData.map((hourData: { [key: string]: any }) => ({
        ...hourData,
        // Add any important station properties here
        'Stid': station.Stid,
        'Elevation': station.Elevation,
        // Use the observation's own date/time as an identifier instead of a random timestamp
        'ObservationId': `${hourData.Day || ''}-${hourData.Hour || ''}-${hourData.Station || ''}`
      }));
      
      return {
        data: enhancedData,
        title: `Raw Hourly Data - ${station.Station}`
      };
    }

    return {
      data: filteredData,
      title: `Raw Hourly Data - ${station.Station}`
    };
  }, [
    station?.Station, 
    station?.Stid, 
    station?.Elevation, 
    observationsDataHour?.data
  ]);

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

    // If no data found, return empty
    if (!filteredData.length) {
      return {
        data: [],
        title: station ? `Daily Data - ${station.Station}` : ''
      };
    }

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
      Longitude: station.Longitude,
      // Use the actual observation dates as identifiers instead of random timestamps
      'ObservationPeriod': `${obs['Start Date Time'] || ''}-${obs['End Date Time'] || ''}`
    }));

    // Create the title with elevation and date range
    const title = `${station.Station} - ${station.Elevation}\n${formattedData[0]?.['Start Date Time']?.split(',')[1]?.trim()} - ${formattedData[0]?.['End Date Time']?.split(',')[1]?.trim()}`;

    return {
      data: formattedData,
      title
    };
  }, [
    station?.Station, 
    station?.Elevation, 
    station?.Latitude, 
    station?.Longitude, 
    observationsDataDay?.data
  ]);


  // Update stationDayData to incorporate date-specific data
  const stationDayData = useMemo(() => {
    if (!station) return { data: [], title: '' };
    
    // If we have observationsDataDay with data for this station, use it to enhance station data
    if (observationsDataDay?.data?.length) {
      // Try to find the station's data in the observations
      const stationDayObservation = observationsDataDay.data.find(
        (obs: any) => obs.Station === station.Station
      );
      
      if (stationDayObservation) {
        // Create an enhanced station object with properties from both the station
        // and its corresponding observation data
        const enhancedStation = {
          ...station, // Keep all existing station properties
          // Update temperature properties
          'Cur Air Temp': stationDayObservation['Cur Air Temp'] || station['Cur Air Temp'] || '-',
          'Air Temp Min': stationDayObservation['Air Temp Min'] || station['Air Temp Min'] || '-',
          'Air Temp Max': stationDayObservation['Air Temp Max'] || station['Air Temp Max'] || '-',
          // Update snow properties
          'Total Snow Depth': stationDayObservation['Total Snow Depth'] || station['Total Snow Depth'] || '-',
          'Total Snow Depth Change': stationDayObservation['Total Snow Depth Change'] || station['Total Snow Depth Change'] || '-',
          '24h Snow Accumulation': stationDayObservation['24h Snow Accumulation'] || station['24h Snow Accumulation'] || '-',
          // Update wind properties
          'Wind Speed Avg': stationDayObservation['Wind Speed Avg'] || station['Wind Speed Avg'] || '-',
          'Max Wind Gust': stationDayObservation['Max Wind Gust'] || station['Max Wind Gust'] || '-',
          'Wind Direction': stationDayObservation['Wind Direction'] || station['Wind Direction'] || '-',
          // Update precipitation property
          'Precip Accum One Hour': stationDayObservation['Precip Accum One Hour'] || station['Precip Accum One Hour'] || '-',
          // Add the observation date to the station (important for tables)
          'Date': stationDayObservation['Date'] || stationDayObservation['Day'] || new Date().toLocaleDateString(),
          // Instead of a timestamp, use the actual observation date as an identifier
          'ObservationDate': stationDayObservation['Start Date Time'] || stationDayObservation['Date'] || new Date().toISOString()
        };
        
        return {
          data: [enhancedStation],
          title: `${enhancedStation.Station} - ${observationsDataDay.title}`
        };
      }
    }
    
    // Fallback to just using the station data if no observation data available
    return {
      data: [station],
      title: station.Station || ''
    };
  }, [station, observationsDataDay]);

  // This is a NEW function to process hourly data into daily summaries
  const processedDailyFromHourly = useMemo(() => {
    if (!station || !stationDataHourFiltered?.data?.length) {
      console.log('processedDailyFromHourly: No data to process', {
        hasStation: !!station,
        stationDataLength: stationDataHourFiltered?.data?.length || 0
      });
      return {
        data: [],
        title: station ? `Daily Data from Hourly - ${station.Station}` : ''
      };
    }

    // Get timeRange from the URL or context - assuming it's available
    // If not, we can modify this to accept it as a parameter
    const currentTimeRange = memoizedTimeRange;
    console.log('processedDailyFromHourly: Processing with time range', currentTimeRange, 'and day range type', dayRangeType);

    // Log the calculated time range from useTimeRange for debugging
    const timeRangeStr = calculateCurrentTimeRange();
    console.log('useTimeRange result:', timeRangeStr);

    // Group hourly data by day
    const hoursByDay: { [key: string]: any[] } = {};
    
    // Process each hourly data point
    stationDataHourFiltered.data.forEach((hourData: any) => {
      const day = hourData.Day;
      if (!hoursByDay[day]) {
        hoursByDay[day] = [];
      }
      hoursByDay[day].push(hourData);
    });

    // Get all days in order
    const days = Object.keys(hoursByDay).sort((a, b) => {
      return moment(a, 'MMM DD').diff(moment(b, 'MMM DD'));
    });
    
    console.log('processedDailyFromHourly: Days available:', days, 'with hourly counts:', 
      days.map(day => ({ day, hours: hoursByDay[day].length }))
    );

    // If we have no days, return empty
    if (days.length === 0) {
      console.log('processedDailyFromHourly: No days found in data');
      return {
        data: [],
        title: station ? `Daily Data from Hourly - ${station.Station}` : ''
      };
    }

    // Special case for 1-day time range with non-midnight cutoff
    if (currentTimeRange === 1 && dayRangeType !== DayRangeType.MIDNIGHT) {
      // Get cutoff time based on dayRangeType
      let cutoffTimeStr;
      if (dayRangeType === DayRangeType.CURRENT) {
        cutoffTimeStr = moment().format('h:mm A');
      } else { // CUSTOM
        if (!customTime) {
          cutoffTimeStr = moment().format('h:mm A');
        } else {
          const [hours, minutes] = customTime.split(':').map(Number);
          cutoffTimeStr = moment().hour(hours).minute(minutes).format('h:mm A');
        }
      }

      // For 1-day time range, use selected date as the END date
      // and get the previous day as the START date
      const currentDateStr = moment().format('MMM DD YYYY');
      const selectedDateString = currentDateStr; // Default to today
      const selectedDate = moment(currentDateStr).format('MMM DD');
      const previousDate = moment(currentDateStr).subtract(1, 'days').format('MMM DD');
      
      console.log('1-day time range using dates from UI:', { selectedDate, previousDate });
      
      // Create dates using the current date selection, not just available data
      const endDay = selectedDate;
      const startDay = previousDate;
      
      // DEBUG: Log the date formats for debugging
      console.log('DEBUG 1-day timeRange data:', {
        days,
        availableDays: Object.keys(hoursByDay),
        startDay,
        endDay,
        cutoffTimeStr
      });

      // Create a 24-hour period - depending on cutoff time
      // From cutoff time on day N-1 to cutoff time on day N
      let startTime = '';
      let endTime = '';

      // Set start and end times using the selected date range
      startTime = `${startDay}, ${currentYear}, ${cutoffTimeStr}`;
      endTime = `${endDay}, ${currentYear}, ${cutoffTimeStr}`;

      console.log('processedDailyFromHourly: Calculated time range', {
        startTime,
        endTime,
        dayRangeType
      });

      // Get all hours in this 24-hour window
      const hoursInRange: any[] = [];
      
      // Parse the Date Time fields to debug the format issues
      const sampleDates: any[] = [];
      Object.keys(hoursByDay).forEach(day => {
        const hours = hoursByDay[day];
        if (hours.length > 0) {
          for (let i = 0; i < Math.min(3, hours.length); i++) {
            sampleDates.push({
              dayStr: day,
              hourStr: hours[i].Hour,
              dateTimeStr: hours[i]['Date Time'] || hours[i].Date_Time,
              parsed: moment(hours[i]['Date Time'] || hours[i].Date_Time, 'MMM DD, YYYY, h:mm A').format('YYYY-MM-DD HH:mm:ss')
            });
          }
        }
      });
      
      console.log('Sample date formats from hourly data:', sampleDates);
      
      // Convert string times to moment objects for comparison
      const startTimeMoment = moment(startTime, `MMM DD, ${currentYear}, h:mm A`);
      const endTimeMoment = moment(endTime, `MMM DD, ${currentYear}, h:mm A`);
      
      console.log('processedDailyFromHourly: Time window moments', {
        startTimeMoment: startTimeMoment.format('YYYY-MM-DD HH:mm:ss'),
        endTimeMoment: endTimeMoment.format('YYYY-MM-DD HH:mm:ss'),
        startTimeValid: startTimeMoment.isValid(),
        endTimeValid: endTimeMoment.isValid()
      });

      // If we have the selected end day in our data, use it
      if (hoursByDay[endDay]?.length > 0) {
        console.log(`Using available data for selected end day: ${endDay}`);
        hoursInRange.push(...hoursByDay[endDay]);
      } 
      
      // If we have the selected start day in our data, use that too
      if (hoursByDay[startDay]?.length > 0) {
        console.log(`Using available data for selected start day: ${startDay}`);
        hoursInRange.push(...hoursByDay[startDay]);
      }
      
      // If we still have no data, get the most recent data available
      if (hoursInRange.length === 0) {
        console.log('No data for selected range, using most recent available data');
        
        // Use all hours from the latest day
        const latestDay = days[days.length - 1];
        if (hoursByDay[latestDay]?.length > 0) {
          hoursInRange.push(...hoursByDay[latestDay]);
          console.log(`Added ${hoursInRange.length} hours from latest day ${latestDay}`);
        }
        
        // If we still don't have data, try the previous day
        if (hoursInRange.length === 0 && days.length > 1) {
          const previousDay = days[days.length - 2];
          if (hoursByDay[previousDay]?.length > 0) {
            hoursInRange.push(...hoursByDay[previousDay]);
            console.log(`Added ${hoursInRange.length} hours from previous day ${previousDay}`);
          }
        }
      }
      
      // If no hours in range, return with an empty array but still include the title
      if (hoursInRange.length === 0) {
        console.log('processedDailyFromHourly: No hours found in the specified time range and no fallback data');
        return {
          data: [],
          title: `${station.Station} - ${station.Elevation}\n${startDay} to ${endDay} (${cutoffTimeStr})`
        };
      }
      
      // Create a title that explicitly shows the range
      const startDateStr = startDay;
      const endDateStr = endDay;
      const timeStr = cutoffTimeStr;
      const title = `${station.Station} - ${station.Elevation}\n${startDateStr} to ${endDateStr} (${timeStr})`;

      // Create a single summary for the entire 24-hour period
      const periodSummary: any = {
        Station: station.Station,
        Elevation: station.Elevation,
        // Fix Date field to use the date from endTime
        Date: endDateStr,
        // Fix Date Time field to properly format the range
        'Date Time': `${timeStr}, ${startDateStr} to ${endDateStr}`,
        'Start Date Time': startTime,
        'End Date Time': endTime,
        Latitude: station.Latitude || 'NaN',
        Longitude: station.Longitude || 'NaN',
        // Fix Stid format
        Stid: `${startDateStr} - ${endDateStr}`,
        'Total Snow Depth': findLatestValue(hoursInRange, 'Total Snow Depth'),
        'Air Temp Min': findMinValue(hoursInRange, 'Air Temp'),
        'Air Temp Max': findMaxValue(hoursInRange, 'Air Temp'),
        'Cur Air Temp': findLatestValue(hoursInRange, 'Air Temp'),
        'Wind Speed Avg': calculateAverage(hoursInRange, 'Wind Speed'),
        'Max Wind Gust': findMaxValue(hoursInRange, 'Wind Gust'),
        'Wind Direction': findMostCommon(hoursInRange, 'Wind Direction'),
        'Relative Humidity': findLatestValue(hoursInRange, 'Relative Humidity'),
        'Solar Radiation Avg': calculateAverage(hoursInRange, 'Solar Radiation'),
        'Cur Wind Speed': findLatestValue(hoursInRange, 'Wind Speed'),
        '24h Snow Accumulation': calculateSnowAccumulation(hoursInRange),
        'Total Snow Depth Change': calculateTotalSnowDepthChange(hoursInRange),
        'Precip Accum One Hour': calculateTotalPrecipitation(hoursInRange),
        'Api Fetch Time': `${endDateStr}, ${endTime.split(',')[1]?.trim() || timeStr}`,
        'api_fetch_time': hoursInRange.map(hour => hour.API_Fetch_Time || hour['API Fetch Time']),
        'precipitation': [''],
        'intermittent_snow': ['']
      };

      return {
        data: [periodSummary],
        title: title
      };
    }
    
    // Standard processing for multiple days or midnight cutoff
    // Process into daily summaries based on cutoff type
    const dailySummaries: any[] = [];
    
    // For non-1-day time ranges, we should use the selected date as the end date
    // and calculate the start date based on the time range
    const currentDateForMultiDay = moment().format('MMM DD YYYY');
    const endDateFromUI = moment(currentDateForMultiDay).format('MMM DD'); // Default to today 
    const startDateFromUI = moment(currentDateForMultiDay).subtract(currentTimeRange - 1, 'days').format('MMM DD');
    
    console.log('Multi-day time range using dates from UI:', { 
      startDateFromUI, 
      endDateFromUI, 
      timeRange: currentTimeRange 
    });
    
    // Try to find days in our data that match the UI date range
    const matchingDays = days.filter(day => {
      const dayMoment = moment(day, 'MMM DD');
      const startMoment = moment(startDateFromUI, 'MMM DD');
      const endMoment = moment(endDateFromUI, 'MMM DD');
      
      // Check if this day is within the selected date range
      return dayMoment.isSameOrAfter(startMoment) && dayMoment.isSameOrBefore(endMoment);
    });
    
    console.log('Days matching UI date range:', matchingDays);
    
    // If we have matching days, use only those days
    const daysToProcess = matchingDays.length > 0 ? matchingDays : days;
    
    daysToProcess.forEach((day, index) => {
      const dayData = hoursByDay[day];
      const nextDay = daysToProcess[index + 1];
      const nextDayData = nextDay ? hoursByDay[nextDay] : [];
      
      // Calculate time boundaries based on cutoff type
      let startHour, endHour;
      let startTime, endTime;
      
      switch (dayRangeType) {
        case DayRangeType.MIDNIGHT:
          // Midnight to midnight
          startHour = "12:00 AM";
          endHour = "11:59 PM";
          break;
          
        case DayRangeType.CURRENT:
          // Current time
          const currentTime = moment().format('h:mm A');
          startHour = currentTime;
          endHour = currentTime;
          break;
          
        case DayRangeType.CUSTOM:
          // Custom time
          if (!customTime) {
            // Use current time as fallback
            const now = new Date();
            const defaultTime = `${now.getHours()}:${now.getMinutes()}`;
            const [hours, minutes] = defaultTime.split(':').map(Number);
            const timeStr = moment().hour(hours).minute(minutes).format('h:mm A');
            startHour = timeStr;
            endHour = timeStr;
          } else {
            const [hours, minutes] = customTime.split(':').map(Number);
            const timeStr = moment().hour(hours).minute(minutes).format('h:mm A');
            startHour = timeStr;
            endHour = timeStr;
          }
          break;
          
        default:
          startHour = "12:00 AM";
          endHour = "11:59 PM";
      }
      
      // Format time strings for display
      startTime = `${day}, ${currentYear}, ${startHour}`;
      
      // For midnight, end time is same day
      if (dayRangeType === DayRangeType.MIDNIGHT) {
        endTime = `${day}, ${currentYear}, ${endHour}`;
      } 
      // For current or custom, end time is next day
      else {
        const endDay = nextDay || moment(day, 'MMM DD').add(1, 'day').format('MMM DD');
        endTime = `${endDay}, ${currentYear}, ${endHour}`;
      }
      
      // Define cutoff function based on day range type
      const isInRange = (hourData: any): boolean => {
        const hourMoment = moment(`${hourData.Day} ${hourData.Hour}`, 'MMM DD h:mm A');
        
        // Different cutoff logic based on type
        if (dayRangeType === DayRangeType.MIDNIGHT) {
          // Midnight: all hours of the current day
          return hourData.Day === day;
        } else {
          // Current or Custom: Get the current or custom time on this day
          let cutoffTime: moment.Moment;
          
          if (dayRangeType === DayRangeType.CURRENT) {
            cutoffTime = moment(`${day} ${moment().format('h:mm A')}`, 'MMM DD h:mm A');
          } else {
            // Custom time
            if (!customTime) {
              // Use current time as fallback
              cutoffTime = moment(`${day} ${moment().format('h:mm A')}`, 'MMM DD h:mm A');
            } else {
              const [hours, minutes] = customTime.split(':').map(Number);
              cutoffTime = moment(`${day} ${moment().hour(hours).minute(minutes).format('h:mm A')}`, 'MMM DD h:mm A');
            }
          }
          
          // For the last day in the range, we should only include hours before or equal to the cutoff time
          const isLastDay = day === days[days.length - 1];
          if (isLastDay) {
            return hourMoment.isBefore(cutoffTime) || hourMoment.isSame(cutoffTime, 'minute');
          }
          
          // For all other days, include hours from cutoff time on current day to same time on next day
          const nextDayCutoff = cutoffTime.clone().add(1, 'day');
          
          return hourMoment.isSameOrAfter(cutoffTime) && hourMoment.isBefore(nextDayCutoff);
        }
      };
      
      // Get hours that match our time cutoff
      const hoursInRange = [...dayData.filter(isInRange)];
      
      // For non-midnight cutoffs, we might need hours from next day too
      if (dayRangeType !== DayRangeType.MIDNIGHT && nextDayData) {
        const nextDayHoursInRange = nextDayData.filter(isInRange);
        hoursInRange.push(...nextDayHoursInRange);
      }
      
      // Skip if no data in range
      if (!hoursInRange.length) return;
      
      // Create summary for this day based on hours in range
      const daySummary: any = {
        Station: station.Station,
        Elevation: station.Elevation,
        Date: day,
        'Date Time': `${startHour} - ${endHour}, ${day}, ${currentYear}`,
        'Start Date Time': startTime,
        'End Date Time': endTime,
        Latitude: station.Latitude || 'NaN',
        Longitude: station.Longitude || 'NaN',
        // Format Stid based on date cutoff
        Stid: formatStid(day, startHour, endHour, dayRangeType),
        // Process snow and temperature data
        'Total Snow Depth': findLatestValue(hoursInRange, 'Total Snow Depth'),
        'Air Temp Min': findMinValue(hoursInRange, 'Air Temp'),
        'Air Temp Max': findMaxValue(hoursInRange, 'Air Temp'),
        'Cur Air Temp': findLatestValue(hoursInRange, 'Air Temp'),
        'Wind Speed Avg': calculateAverage(hoursInRange, 'Wind Speed'),
        'Max Wind Gust': findMaxValue(hoursInRange, 'Wind Gust'),
        'Wind Direction': findMostCommon(hoursInRange, 'Wind Direction'),
        'Relative Humidity': findLatestValue(hoursInRange, 'Relative Humidity'),
        'Solar Radiation Avg': calculateAverage(hoursInRange, 'Solar Radiation'),
        'Cur Wind Speed': findLatestValue(hoursInRange, 'Wind Speed'),
        
        // Calculate snow accumulation (change in snow depth)
        '24h Snow Accumulation': calculateSnowAccumulation(hoursInRange),
        'Total Snow Depth Change': calculateTotalSnowDepthChange(hoursInRange),
        'Precip Accum One Hour': calculateTotalPrecipitation(hoursInRange),
        
        // For api fields
        'Api Fetch Time': `${day}, ${hoursInRange[hoursInRange.length - 1]?.Hour || '11:59 PM'}`,
        'api_fetch_time': hoursInRange.map(hour => hour.API_Fetch_Time || hour['API Fetch Time']),
        'precipitation': [''],
        'intermittent_snow': ['']
      };
      
      dailySummaries.push(daySummary);
    });
    
    // Add debugging to understand why Apr 21 is missing
    console.log('Days in hoursByDay:', days);
    console.log('Daily summaries after processing:', dailySummaries.map(s => s.Date));
    
    // Check if today's date is missing from the daily summaries
    const today = moment().format('MMM DD');
    const hasToday = dailySummaries.some(summary => summary.Date === today);
    if (!hasToday && memoizedTimeRange > 1) {
      // Check if today is within our expected range
      const oldestDay = days[0];
      const expectedDays = memoizedTimeRange;
      const startMoment = moment(oldestDay, 'MMM DD');
      const todayMoment = moment(today, 'MMM DD');
      const dayDiff = todayMoment.diff(startMoment, 'days');
      
      if (dayDiff < expectedDays) {
        // If we have hourly data for today, create a summary
        if (hoursByDay[today]?.length) {
          const todayHours = hoursByDay[today];
          
          // Create a summary with the same approach as the main loop
          const daySummary = createDaySummary(today, todayHours, station, dayRangeType, customTime);
          if (daySummary) {
            dailySummaries.push(daySummary);
          }
        }
      }
    }
  
    // Check for any missing days within the date range
    const startDay = days[0];
    const endDay = days[days.length - 1];
    const startMoment = moment(startDay, 'MMM DD');
    const endMoment = moment(endDay, 'MMM DD');
    
    // Calculate the expected number of days in the range
    const daysInRange = endMoment.diff(startMoment, 'days') + 1;
    
    // Ensure all dates within the range are accounted for
    if (daysInRange > dailySummaries.length) {
      console.log('Missing days in dailySummaries, adding them', {
        daysInRange,
        actualDays: dailySummaries.length,
        availableDays: days
      });
      
      // Create a map of days we already have summaries for
      const summaryDays = new Set(dailySummaries.map(s => s.Date));
      
      // Check each day in the range
      for (let i = 0; i < daysInRange; i++) {
        const currentDay = startMoment.clone().add(i, 'days').format('MMM DD');
        
        // If we don't have a summary for this day and we have hourly data, create one
        if (!summaryDays.has(currentDay) && hoursByDay[currentDay]?.length) {
          const dayHours = hoursByDay[currentDay];
          const daySummary = createDaySummary(currentDay, dayHours, station, dayRangeType, customTime);
          
          if (daySummary) {
            dailySummaries.push(daySummary);
          }
        }
      }
      
      // Sort summaries by date for correct display
      dailySummaries.sort((a, b) => {
        return moment(a.Date, 'MMM DD').diff(moment(b.Date, 'MMM DD'));
      });
    }
    
    // Create a title with appropriate time range
    let timeRangeInfo = '';
    if (dailySummaries.length > 0) {
      // Use the UI date range for the title to match what's in the UI
      const displayStartDay = startDateFromUI;
      const displayEndDay = endDateFromUI;
      
      let timeFormat;
      switch (dayRangeType) {
        case DayRangeType.MIDNIGHT:
          timeFormat = '12 AM - 11:59 PM';
          break;
        case DayRangeType.CURRENT:
          timeFormat = moment().format('h:mm A') + ' cutoff';
          break;
        case DayRangeType.CUSTOM:
          const [hours, minutes] = customTime.split(':').map(Number);
          timeFormat = moment().hour(hours).minute(minutes).format('h:mm A') + ' cutoff';
          break;
        default:
          timeFormat = '12 AM - 11:59 PM';
      }
      
      timeRangeInfo = `${displayStartDay} to ${displayEndDay} (${timeFormat})`;
      
      console.log('Generated title date range:', {
        displayStartDay,
        displayEndDay,
        availableDataDays: dailySummaries.map(s => s.Date),
        memoizedTimeRange,
        matchingDays,
        allDays: days
      });
    }

    return {
      data: dailySummaries,
      title: `${station.Station} - ${station.Elevation}\n${timeRangeInfo}`
    };
  }, [
    station, 
    stationDataHourFiltered, 
    dayRangeType, 
    customTime, 
    // Remove calculateCurrentTimeRange from dependency array as it's causing the loop
    // Instead, memoize its result
    // calculateCurrentTimeRange
  ]);

  console.log('processedDailyFromHourly', processedDailyFromHourly);

  // Helper functions for data processing
  function findMinValue(data: any[], field: string): string {
    const values = data
      .map(item => parseFloat(item[field]))
      .filter(val => !isNaN(val));
    
    if (!values.length) return "-";
    return `${Math.min(...values)} °F`;
  }

  function findMaxValue(data: any[], field: string): string {
    const values = data
      .map(item => parseFloat(item[field]))
      .filter(val => !isNaN(val));
    
    if (!values.length) return "-";
    return `${Math.max(...values)} °F`;
  }

  function findLatestValue(data: any[], field: string): string {
    // If no data, return placeholder
    if (!data || data.length === 0) return "-";
    
    // For Total Snow Depth, check if we have values with units first
    if (field === 'Total Snow Depth') {
      // Check for values that include units (more likely to be valid)
      const validData = data.filter(item => 
        item[field] && 
        item[field] !== "-" && 
        item[field].includes("in")
      );
      
      if (validData.length > 0) {
        // Sort by time to get the latest valid value
        const latestValid = [...validData].sort((a, b) => {
          const timeA = moment(`${a.Day} ${a.Hour}`, 'MMM DD h:mm A');
          const timeB = moment(`${b.Day} ${b.Hour}`, 'MMM DD h:mm A');
          return timeB.diff(timeA);
        })[0];
        
        return latestValid[field];
      }
      
      // If no values with units, try numeric values
      const numericData = data.filter(item => {
        const value = parseFloat(item[field]);
        return !isNaN(value);
      });
      
      if (numericData.length > 0) {
        // Sort by time to get the latest
        const latestNumeric = [...numericData].sort((a, b) => {
          const timeA = moment(`${a.Day} ${a.Hour}`, 'MMM DD h:mm A');
          const timeB = moment(`${b.Day} ${b.Hour}`, 'MMM DD h:mm A');
          return timeB.diff(timeA);
        })[0];
        
        const value = parseFloat(latestNumeric[field]);
        return `${value.toFixed(2)} in`;
      }
      
      // Before giving up, check if the station has this field
      if (data[0]?.Station) {
        for (const item of data) {
          // Try alternative field names
          const alternativeFields = ['Total_Snow_Depth', 'Snow_Depth', 'snow_depth', 'Snow Depth'];
          for (const altField of alternativeFields) {
            if (item[altField] && item[altField] !== "-") {
              return item[altField].includes("in") ? item[altField] : `${item[altField]} in`;
            }
          }
        }
      }
      
      // If we have stationDayData global data, try to get it from there 
      if (stationDayData?.data?.[0]?.[field] && stationDayData.data[0][field] !== "-") {
        return stationDayData.data[0][field];
      }
      
      return "-";
    }
    
    // Sort by time and get the latest for other fields
    const latestData = [...data].sort((a, b) => {
      const timeA = moment(`${a.Day} ${a.Hour}`, 'MMM DD h:mm A');
      const timeB = moment(`${b.Day} ${b.Hour}`, 'MMM DD h:mm A');
      return timeB.diff(timeA);
    })[0];
    
    if (!latestData) return "-";
    
    // Add units if needed
    const value = latestData[field];
    if (!value) return "-";
    
    if (field === 'Air Temp') return `${value}`;
    if (field === 'Relative Humidity' && value !== "-") return `${value}`;
    
    return value;
  }

  function calculateAverage(data: any[], field: string): string {
    const values = data
      .map(item => {
        const value = item[field];
        if (!value || value === "-") return NaN;
        return parseFloat(value);
      })
      .filter(val => !isNaN(val));
    
    if (!values.length) return "-";
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return `${Math.round(avg * 10) / 10}`;
  }

  function findMostCommon(data: any[], field: string): string {
    const values = data.map(item => item[field]).filter(val => val && val !== "-");
    if (!values.length) return "-";
    
    // Count occurrences of each value
    const counts: {[key: string]: number} = {};
    values.forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
    });
    
    // Find the most common
    let maxCount = 0;
    let mostCommon = "-";
    
    Object.entries(counts).forEach(([val, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = val;
      }
    });
    
    return mostCommon;
  }

  function calculateSnowAccumulation(hourData: any[]): string {
    // Sort data by time
    const sortedData = [...hourData].sort((a, b) => {
      const timeA = moment(`${a.Day} ${a.Hour}`, 'MMM DD h:mm A');
      const timeB = moment(`${b.Day} ${b.Hour}`, 'MMM DD h:mm A');
      return timeA.diff(timeB);
    });
    
    // Find first and last valid snow depth
    const validDepths = sortedData
      .map(item => parseFloat(item['Total Snow Depth']))
      .filter(val => !isNaN(val));
      
    if (validDepths.length < 2) {
      // Look for explicitly reported 24h Snow Accumulation
      for (const hour of sortedData) {
        const reported = hour['24h Snow Accumulation'];
        if (reported && reported !== "-" && reported !== "0.00 in") {
          // If we find a valid non-zero value, use it
          return reported;
        }
      }
      
      // If we can't find non-zero values, look for any valid values
      for (const hour of sortedData) {
        const reported = hour['24h Snow Accumulation'];
        if (reported && reported !== "-") {
          return reported;
        }
      }
      
      // No valid values found
      return "0.00 in";
    }
    
    // Calculate the difference (positive means accumulation)
    // Get first and last valid depths
    const startDepth = validDepths[0];
    const endDepth = validDepths[validDepths.length - 1];
    
    // Calculate the difference and only show positive accumulation
    const diff = Math.max(0, endDepth - startDepth);
    
    // If we calculated zero, double check against reported values
    if (diff === 0) {
      // Look for explicitly reported 24h Snow Accumulation
      for (const hour of sortedData) {
        const reported = hour['24h Snow Accumulation'];
        if (reported && reported !== "-" && reported !== "0.00 in") {
          // If we find a valid non-zero value, use it instead
          const reportedValue = parseFloat(reported);
          if (!isNaN(reportedValue) && reportedValue > 0) {
            return reported;
          }
        }
      }
    }
    
    return `${diff.toFixed(2)} in`;
  }

  function calculateTotalSnowDepthChange(hourData: any[]): string {
    // Sort data by time
    const sortedData = [...hourData].sort((a, b) => {
      const timeA = moment(`${a.Day} ${a.Hour}`, 'MMM DD h:mm A');
      const timeB = moment(`${b.Day} ${b.Hour}`, 'MMM DD h:mm A');
      return timeA.diff(timeB);
    });
    
    // Find first and last valid snow depth
    const validDepths = sortedData
      .map(item => parseFloat(item['Total Snow Depth']))
      .filter(val => !isNaN(val));
      
    if (validDepths.length < 2) {
      // Look for explicitly reported Total Snow Depth Change
      for (const hour of sortedData) {
        const reported = hour['Total Snow Depth Change'];
        if (reported && reported !== "-") {
          return reported;
        }
      }
      return "0.00 in";
    }
    
    // Get first and last valid depths
    const startDepth = validDepths[0];
    const endDepth = validDepths[validDepths.length - 1];
    
    // Calculate the difference (can be positive or negative)
    const diff = endDepth - startDepth;
    
    // If we calculated zero, check reported values
    if (diff === 0) {
      // Look for explicitly reported Total Snow Depth Change
      for (const hour of sortedData) {
        const reported = hour['Total Snow Depth Change'];
        if (reported && reported !== "-" && reported !== "0.00 in") {
          const reportedValue = parseFloat(reported);
          if (!isNaN(reportedValue) && reportedValue !== 0) {
            return reported;
          }
        }
      }
    }
    
    return `${diff.toFixed(2)} in`;
  }

  function calculateTotalPrecipitation(hourData: any[]): string {
    // Sum all valid precipitation values
    const total = hourData.reduce((sum, hour) => {
      const precip = parseFloat(hour['Precip Accum'] || "0");
      return sum + (isNaN(precip) ? 0 : precip);
    }, 0);
    
    return `${total.toFixed(2)} in`;
  }

  function formatStid(day: string, startHour: string, endHour: string, dayRangeType: DayRangeType): string {
    const dayFormat = moment(day, 'MMM DD').format('MM-DD');
    
    if (dayRangeType === DayRangeType.MIDNIGHT) {
      return `${dayFormat} ${startHour} - ${dayFormat} ${endHour}`;
    } else {
      // For CURRENT or CUSTOM, include next day
      const nextDay = moment(day, 'MMM DD').add(1, 'day').format('MM-DD');
      return `${dayFormat} ${startHour} - ${nextDay} ${endHour}`;
    }
  }
  
  // Helper function to create a day summary from hours data
  function createDaySummary(day: string, hoursData: any[], station: any, dayRangeType: DayRangeType, customTime: string) {
    if (hoursData.length === 0) return null;
    
    let startHour, endHour;
    let startTime, endTime;
    
    switch (dayRangeType) {
      case DayRangeType.MIDNIGHT:
        // Midnight to midnight - use all hours
        startHour = "12:00 AM";
        endHour = "11:59 PM";
        startTime = `${day}, ${currentYear}, ${startHour}`;
        endTime = `${day}, ${currentYear}, ${endHour}`;
        break;
        
      case DayRangeType.CURRENT:
        // Current time cutoff
        const currentTime = moment().format('h:mm A');
        startHour = currentTime;
        endHour = currentTime;
        
        // Format times for display
        startTime = `${day}, ${currentYear}, 12:00 AM`;
        endTime = `${day}, ${currentYear}, ${endHour}`;
        break;
        
      case DayRangeType.CUSTOM:
        // Custom time cutoff
        if (!customTime) {
          // Use current time as fallback
          const now = new Date();
          const defaultTime = `${now.getHours()}:${now.getMinutes()}`;
          const [hours, minutes] = defaultTime.split(':').map(Number);
          startHour = moment().hour(hours).minute(minutes).format('h:mm A');
        } else {
          const [hours, minutes] = customTime.split(':').map(Number);
          startHour = moment().hour(hours).minute(minutes).format('h:mm A');
        }
        endHour = startHour;
        
        // Format times for display
        startTime = `${day}, ${currentYear}, 12:00 AM`;
        endTime = `${day}, ${currentYear}, ${endHour}`;
        break;
        
      default:
        // Default: midnight to midnight
        startHour = "12:00 AM";
        endHour = "11:59 PM";
        startTime = `${day}, ${currentYear}, ${startHour}`;
        endTime = `${day}, ${currentYear}, ${endHour}`;
    }

    // Create summary with properly filtered hours
    return {
      Station: station.Station,
      Elevation: station.Elevation,
      // Ensure Date is clearly the actual date string
      Date: day,
      // Format Date Time consistently for parsing in graph components
      'Date Time': `${startHour} - ${endHour}, ${day}, ${currentYear}`,
      // Make sure the Start/End Date Time formats are consistent
      'Start Date Time': startTime,
      'End Date Time': endTime,
      Latitude: station.Latitude || 'NaN',
      Longitude: station.Longitude || 'NaN',
      Stid: formatStid(day, "12:00 AM", endHour, dayRangeType),
      'Total Snow Depth': findLatestValue(hoursData, 'Total Snow Depth'),
      'Air Temp Min': findMinValue(hoursData, 'Air Temp'),
      'Air Temp Max': findMaxValue(hoursData, 'Air Temp'),
      'Cur Air Temp': findLatestValue(hoursData, 'Air Temp'),
      'Wind Speed Avg': calculateAverage(hoursData, 'Wind Speed'),
      'Max Wind Gust': findMaxValue(hoursData, 'Wind Gust'),
      'Wind Direction': findMostCommon(hoursData, 'Wind Direction'),
      'Relative Humidity': findLatestValue(hoursData, 'Relative Humidity'),
      'Solar Radiation Avg': calculateAverage(hoursData, 'Solar Radiation'),
      'Cur Wind Speed': findLatestValue(hoursData, 'Wind Speed'),
      '24h Snow Accumulation': calculateSnowAccumulation(hoursData),
      'Total Snow Depth Change': calculateTotalSnowDepthChange(hoursData),
      'Precip Accum One Hour': calculateTotalPrecipitation(hoursData),
      'Api Fetch Time': `${day}, ${hoursData[hoursData.length - 1]?.Hour || '11:59 PM'}`,
      'api_fetch_time': hoursData.map(hour => hour.API_Fetch_Time || hour['API Fetch Time']),
      'precipitation': [''],
      'intermittent_snow': ['']
    };
  }
  
  if (!station) return null;

  // Calculate the drawer height based on top position
  // This ensures the drawer is always anchored to the bottom of the screen
  const drawerHeight = window.innerHeight - drawerTop;

  return (
    <motion.div
      ref={drawerRef}
      className="fixed left-0 right-0 bottom-0 shadow-lg rounded-t-xl"
      style={{
        top: isOpen ? `${drawerTop}px` : 'auto', // Position based on top when open
        height: drawerHeight,
        width: "100%",
        zIndex: 9999,
        transformOrigin: "bottom",
        pointerEvents: isOpen ? 'auto' : 'none',
        overflow: 'hidden',
        backgroundColor: 'var(--app-dropdown-bg)', // Use the dropdown bg for drawer as it's darker
        color: 'var(--app-text-primary)',
        borderTop: '1px solid var(--app-border-color)',
        boxShadow: 'var(--app-box-shadow)'
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
        className="w-full h-6 cursor-ns-resize select-none flex justify-center items-center"
        onMouseDown={handleMouseDown}
        style={{
          touchAction: 'none',
          userSelect: 'none',
          backgroundColor: 'var(--app-toolbar-bg)',
          borderBottom: '1px solid var(--app-border-color)'
        }}
      >
        <div className="w-16 h-1.5 bg-gray-500 rounded-full" />
      </div>

      <div className="p-4">
        {/* Header with tabs and close button */}
        <div className="flex items-center justify-between mb-4">
          {/* Tabs */}
          <Box sx={{ flexGrow: 1, mr: 2, maxWidth: 'calc(100% - 40px)' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{ 
                minHeight: '36px',
                '& .MuiTab-root': { 
                  color: 'var(--app-text-secondary)',
                  minHeight: '36px',
                  minWidth: '80px',
                  padding: '6px 10px',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  '&.Mui-selected': { 
                    color: 'var(--app-text-primary)',
                    fontWeight: 600 
                  } 
                },
                '& .MuiTabs-indicator': { 
                  backgroundColor: 'var(--app-text-primary)',
                  height: 2
                },
                '& .MuiTabs-scrollButtons': {
                  color: 'var(--app-text-secondary)',
                  '&.Mui-disabled': { opacity: 0.3 },
                  padding: '0 4px'
                }
              }}
            >
              <Tab 
                label="Summary" 
                id={`station-tab-0`}
                aria-controls={`station-tabpanel-0`}
              />
              <Tab 
                label="Hourly Graph" 
                id={`station-tab-1`}
                aria-controls={`station-tabpanel-1`}
              />
              <Tab 
                label="Daily Graph" 
                id={`station-tab-2`}
                aria-controls={`station-tabpanel-2`}
              />
              <Tab 
                label="Filtered Data" 
                id={`station-tab-3`}
                aria-controls={`station-tabpanel-3`}
              />
              <Tab 
                label="Raw Data" 
                id={`station-tab-4`}
                aria-controls={`station-tabpanel-4`}
              />
            </Tabs>
          </Box>

          {/* Close button */}
          <button 
            onClick={onClose}
            className="app-button flex-shrink-0"
            style={{
              background: 'var(--app-section-bg)',
              color: 'var(--app-text-primary)',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              lineHeight: 1,
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--app-border-radius)',
              border: '1px solid var(--app-border-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            aria-label="Close drawer"
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--app-section-bg)';
            }}
          >
            ×
          </button>
        </div>
        
        {/* Scrollable content with dark theme scrollbar */}
        <div 
          className="custom-scrollbar overflow-y-auto pr-2" 
          style={{ 
            height: `calc(100% - 50px)`,
            minHeight: '120px',
            maxHeight: `${drawerHeight - 90}px`,
            overflowY: 'auto',
            position: 'relative'
          }}
        >
          {/* Tab Panels */}
          
          {/* Tab 1: Daily Summary from Hourly */}
          <TabPanel value={activeTab} index={0}>


            {/* Station Summary Table - Always visible at the top */}
            <div className="mb-6 pb-2">
              <DayAveragesTable 
                dayAverages={stationDayData}
                onStationClick={() => {}}
                mode={tableMode}
                key={`summary-${station.Station}`}
              />
            </div>

            {processedDailyFromHourly.data.length > 0 ? (
              <div className="mb-6">
                <DayAveragesTable 
                  dayAverages={processedDailyFromHourly}
                  onStationClick={() => {}}
                  mode={tableMode}
                  key={`daily-summary-${station.Station}`}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p></p>
              </div>
            )}
          </TabPanel>

          {/* Tab 2: Hourly Snow and Temperature Graph */}
          <TabPanel value={activeTab} index={1}>
            {stationDataHourFiltered.data.length > 0 ? (
              <div className="mb-6 app-section-solid">
                <WxSnowGraph 
                  dayAverages={stationDataHourFiltered}
                  isHourly={true}
                  isMetric={isMetric}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No hourly graph data available</p>
              </div>
            )}
          </TabPanel>

          {/* Tab 3: Daily Snow and Temperature Graph */}
          <TabPanel value={activeTab} index={2}>
            {processedDailyFromHourly.data.length > 0 ? (
              <div className="mb-6 app-section-solid">
                <DayWxSnowGraph 
                  dayAverages={processedDailyFromHourly}
                  isMetric={isMetric}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Only one day of data, not good for daily graph comparison</p>
              </div>
            )}
          </TabPanel>



          {/* Tab 4: Filtered Hourly Data Table */}
          <TabPanel value={activeTab} index={3}>
            {stationDataHourFiltered.data.length > 0 ? (
              <div className="mb-6 app-section-solid">
                <HourWxTable 
                  hourAverages={stationDataHourFiltered}
                  key={`filtered-${station.Station}`}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No filtered hourly data available</p>
              </div>
            )}
          </TabPanel>

          {/* Tab 5: Raw Hourly Data Table */}
          <TabPanel value={activeTab} index={4}>
            {stationDataHourUnFiltered.data.length > 0 ? (
              <div className="mb-6 app-section-solid">
                <HourWxTable 
                  hourAverages={stationDataHourUnFiltered}
                  key={`raw-${station.Station}`}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No raw hourly data available</p>
              </div>
            )}
          </TabPanel>
        </div>
      </div>
    </motion.div>
  );
};

export default StationDrawer; 