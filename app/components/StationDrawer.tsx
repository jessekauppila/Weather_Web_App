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
  }, [observationsDataHour, station, station?.Stid]);

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
  }, [observationsDataDay, station, station?.['Cur Air Temp'], station?.['Total Snow Depth']]);


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
        //console.log(`Found station ${station.Station} data in observationsDataDay`);
        
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

  console.log('stationDataHourFiltered', stationDataHourFiltered);

  console.log('stationDayData', stationDayData);
  // This is a NEW function to process hourly data into daily summaries
  const processedDailyFromHourly = useMemo(() => {
    if (!station || !stationDataHourFiltered?.data?.length) {
      return {
        data: [],
        title: station ? `Daily Data from Hourly - ${station.Station}` : ''
      };
    }

    // Get timeRange from the URL or context - assuming it's available
    // If not, we can modify this to accept it as a parameter
    const currentTimeRange = Number(calculateCurrentTimeRange().split(" ")[0]) || 1;
    
    console.log("Current time range:", currentTimeRange);

    // ADDED: Debug the time parameters from the raw data
    const timeRangeStr = calculateCurrentTimeRange();
    console.log("Current time range string:", timeRangeStr);
    console.log("First hour data:", stationDataHourFiltered.data[0]);
    
    // ADDED: Check for multi-day view date range issue
    // NOTE: This issue has been fixed in the useTimeRange hook, but we'll keep this check
    // to verify that the fix is working properly
    if (currentTimeRange > 1 && dayRangeType === 'CURRENT' && stationDataHourFiltered.data.length > 0) {
      const firstDataPoint = stationDataHourFiltered.data[0];
      const firstDay = firstDataPoint.Day;
      const firstHour = firstDataPoint.Hour;
      
      console.log(`First data point is on ${firstDay} at ${firstHour}`);
      
      // If first hour is midnight (12:00 AM), we still have the issue
      if (firstHour === '12:00 AM') {
        // Calculate what should be the real start day (one day earlier)
        const expectedStartDay = moment(firstDay, 'MMM DD').subtract(1, 'day');
        const formattedExpectedStartDay = expectedStartDay.format('MMM DD');
        
        console.log(`WARNING: Multi-day view starts at midnight on ${firstDay} but should start at 3:00 PM on ${formattedExpectedStartDay}`);
        console.log(`If you see this warning, the fix in useTimeRange.ts may not be applied yet. Try refreshing the page.`);
      } else if (firstHour === '3:00 PM') {
        console.log(`SUCCESS: Multi-day view correctly starts at 3:00 PM on the day before the first full day`);
      }
    }

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

    // If we have no days, return empty
    if (days.length === 0) {
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

      // Get the latest day in the data
      const latestDay = days[days.length - 1];
      
      // Define the cutoff time on the latest day
      const cutoffTime = moment(`${latestDay} ${cutoffTimeStr}`, 'MMM DD h:mm A');
      
      // Calculate 24 hours before the cutoff time
      const startTime = cutoffTime.clone().subtract(24, 'hours');
      
      // Format the start/end days and times for display
      const startDayStr = startTime.format('MMM DD');
      const endDayStr = cutoffTime.format('MMM DD');
      const startTimeStr = startTime.format('h:mm A');
      const endTimeStr = cutoffTime.format('h:mm A');
      
      console.log(`Creating 24-hour period from ${startDayStr} ${startTimeStr} to ${endDayStr} ${endTimeStr}`);

      // Get all hours in this 24-hour window
      const hoursInRange: any[] = [];
      
      // Iterate through all days and include hours that fall within our 24-hour window
      days.forEach(day => {
        hoursByDay[day].forEach(hourData => {
          const hourTime = moment(`${hourData.Day} ${hourData.Hour}`, 'MMM DD h:mm A');
          // Important: Make sure to include only hours up to the cutoff time on the last day
          const isOnLatestDay = hourData.Day === latestDay;
          if (isOnLatestDay) {
            // On latest day, only include hours before or at cutoff time
            if (hourTime.isSameOrAfter(startTime) && (hourTime.isBefore(cutoffTime) || hourTime.isSame(cutoffTime, 'minute'))) {
              hoursInRange.push(hourData);
            }
          } else {
            // On other days, include all hours in the 24-hour window
            if (hourTime.isSameOrAfter(startTime) && hourTime.isBefore(cutoffTime)) {
              hoursInRange.push(hourData);
            }
          }
        });
      });

      console.log(`Found ${hoursInRange.length} hours in the 24-hour range`);
      
      if (hoursInRange.length === 0) {
        console.log("No hours found in the 24-hour range");
        return {
          data: [],
          title: `${station.Station} - ${station.Elevation}\n${startDayStr} ${startTimeStr} to ${endDayStr} ${endTimeStr}`
        };
      }
      
      // Create a single summary for the entire 24-hour period
      const periodSummary: any = {
        Station: station.Station,
        Elevation: station.Elevation,
        Date: `${startDayStr} - ${endDayStr}`,
        'Date Time': `${startTimeStr} - ${endTimeStr}, ${startDayStr} to ${endDayStr}, 2025`,
        'Start Date Time': `${startDayStr}, 2025, ${startTimeStr}`,
        'End Date Time': `${endDayStr}, 2025, ${endTimeStr}`,
        Latitude: station.Latitude || 'NaN',
        Longitude: station.Longitude || 'NaN',
        Stid: `${startDayStr} ${startTimeStr} - ${endDayStr} ${endTimeStr}`,
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
        'Api Fetch Time': `${endDayStr}, ${endTimeStr}`,
        'api_fetch_time': hoursInRange.map(hour => hour.API_Fetch_Time || hour['API Fetch Time']),
        'precipitation': [''],
        'intermittent_snow': ['']
      };

      return {
        data: [periodSummary],
        title: `${station.Station} - ${station.Elevation}\n${startDayStr} ${startTimeStr} to ${endDayStr} ${endTimeStr}`
      };
    }
    
    // Standard processing for multiple days or midnight cutoff
    // Process into daily summaries based on cutoff type
    const dailySummaries: any[] = [];
    
    days.forEach((day, index) => {
      const dayData = hoursByDay[day];
      const nextDay = days[index + 1];
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
      startTime = `${day}, 2025, ${startHour}`;
      
      // For midnight, end time is same day
      if (dayRangeType === DayRangeType.MIDNIGHT) {
        endTime = `${day}, 2025, ${endHour}`;
      } 
      // For current or custom, end time is next day
      else {
        const endDay = nextDay || moment(day, 'MMM DD').add(1, 'day').format('MMM DD');
        endTime = `${endDay}, 2025, ${endHour}`;
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
        'Date Time': `${startHour} - ${endHour}, ${day}, 2025`,
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
    
    // Create an extra summary for the last day if it's missing
    // This handles cases where the last day might not be included due to filtering
    const lastDay = days[days.length - 1];
    const hasLastDay = dailySummaries.some(summary => summary.Date === lastDay);
    
    if (!hasLastDay && hoursByDay[lastDay]?.length) {
      console.log(`Last day ${lastDay} was missing from summaries, adding it with correct cutoff`);
      
      // Calculate cutoff time for the last day using the same logic as in the main loop
      let startHour, endHour;
      let startTime, endTime;
      let hoursInRange = [];
      
      switch (dayRangeType) {
        case DayRangeType.MIDNIGHT:
          // Midnight to midnight - use all hours
          startHour = "12:00 AM";
          endHour = "11:59 PM";
          startTime = `${lastDay}, 2025, ${startHour}`;
          endTime = `${lastDay}, 2025, ${endHour}`;
          hoursInRange = hoursByDay[lastDay];
          break;
          
        case DayRangeType.CURRENT:
          // Current time cutoff
          const currentTime = moment().format('h:mm A');
          startHour = currentTime;
          endHour = currentTime;
          
          // Define the cutoff time
          const cutoffTime = moment(`${lastDay} ${moment().format('h:mm A')}`, 'MMM DD h:mm A');
          
          // Only include hours before the current time on the last day
          hoursInRange = hoursByDay[lastDay].filter(hourData => {
            const hourMoment = moment(`${hourData.Day} ${hourData.Hour}`, 'MMM DD h:mm A');
            return hourMoment.isBefore(cutoffTime);
          });
          
          // Format times for display
          startTime = `${lastDay}, 2025, 12:00 AM`;
          endTime = `${lastDay}, 2025, ${endHour}`;
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
          
          // Define the cutoff time
          const customCutoffTime = moment(`${lastDay} ${startHour}`, 'MMM DD h:mm A');
          
          // Only include hours before the custom time on the last day
          hoursInRange = hoursByDay[lastDay].filter(hourData => {
            const hourMoment = moment(`${hourData.Day} ${hourData.Hour}`, 'MMM DD h:mm A');
            return hourMoment.isBefore(customCutoffTime);
          });
          
          // Format times for display
          startTime = `${lastDay}, 2025, 12:00 AM`;
          endTime = `${lastDay}, 2025, ${endHour}`;
          break;
          
        default:
          // Default: midnight to midnight
          startHour = "12:00 AM";
          endHour = "11:59 PM";
          startTime = `${lastDay}, 2025, ${startHour}`;
          endTime = `${lastDay}, 2025, ${endHour}`;
          hoursInRange = hoursByDay[lastDay];
      }
      
      // Skip if no hours in range after filtering
      if (!hoursInRange.length) {
        console.log(`Skipping ${lastDay} - no hours in range after applying cutoff`);
      } else {
        // Create summary with properly filtered hours
        const lastDaySummary: any = {
          Station: station.Station,
          Elevation: station.Elevation,
          Date: lastDay,
          'Date Time': `12:00 AM - ${endHour}, ${lastDay}, 2025`,
          'Start Date Time': startTime,
          'End Date Time': endTime,
          Latitude: station.Latitude || 'NaN',
          Longitude: station.Longitude || 'NaN',
          Stid: formatStid(lastDay, "12:00 AM", endHour, dayRangeType),
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
          'Api Fetch Time': `${lastDay}, ${hoursInRange[hoursInRange.length - 1]?.Hour || '11:59 PM'}`,
          'api_fetch_time': hoursInRange.map(hour => hour.API_Fetch_Time || hour['API Fetch Time']),
          'precipitation': [''],
          'intermittent_snow': ['']
        };
        
        console.log(`Added summary for ${lastDay} with ${hoursInRange.length} hours up to cutoff time`);
        dailySummaries.push(lastDaySummary);
      }
    }
  
    // Create a title with appropriate time range
    let timeRangeInfo = '';
    if (dailySummaries.length > 0) {
      // Use the original days array to get the full range, not just the filtered dailySummaries
      // This ensures we show the complete range even if some days didn't have data in range
      const startDay = days[0];
      const endDay = days[days.length - 1];
      
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
      
      timeRangeInfo = `${startDay} to ${endDay} (${timeFormat})`;
    }

    return {
      data: dailySummaries,
      title: `${station.Station} - ${station.Elevation}\n${timeRangeInfo}`
    };
  }, [station, stationDataHourFiltered, dayRangeType, customTime, calculateCurrentTimeRange]);

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
        
        console.log(`Found valid Total Snow Depth: ${latestValid[field]}`);
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
          // Log all keys to debug what's available
          console.log(`Keys for item from ${item.Day} ${item.Hour}:`, Object.keys(item));
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
        console.log(`Using Total Snow Depth from stationDayData: ${stationDayData.data[0][field]}`);
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
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-semibold" style={{ color: 'var(--app-text-primary)' }}>
            {station.Station}
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={onClose}
              className="app-button"
              style={{
                background: 'var(--app-section-bg)',
                color: 'var(--app-text-primary)',
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: 'var(--app-border-radius)',
                border: '1px solid var(--app-border-color)',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Scrollable content with dark theme scrollbar */}
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

{/* //////////////////////////////////////////////////////////////// */}
 
          {/* Station Summary Table */}
          <div className="mb-6">
            <DayAveragesTable 
              dayAverages={stationDayData}
              onStationClick={() => {}}
              mode={tableMode}
              key={`summary-${station.Station}`}
            />
          </div>

                    {/* Station Summary Table */}
                    <div className="mb-6">
            <DayAveragesTable 
              dayAverages={processedDailyFromHourly}
              onStationClick={() => {}}
              mode={tableMode}
              key={`summary-${station.Station}`}
            />
          </div>

{/* //////////////////////////////////////////////////////////////// */}

          
          {/* Hourly Snow and Temperature Graph */}
          {stationDataHourFiltered.data.length > 0 && (
            <div className="mb-6 app-section-solid">
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

          {/* Daily Snow and Temperature Graph using processed hourly data */}
          {processedDailyFromHourly.data.length > 0 && (
            <div className="mb-6 app-section-solid">
              <AccordionWrapper
                title="Daily Snow and Temperature Graph (from Hourly)"
                subtitle={processedDailyFromHourly.title}
                defaultExpanded={false}
              >
                <DayWxSnowGraph 
                  dayAverages={processedDailyFromHourly}
                  isMetric={isMetric}
                />
              </AccordionWrapper>
            </div>
          )}

          {/* Original Daily Snow and Temperature Graph */}
          {stationObservationsDataDay.data.length > 0 && (
            <div className="mb-6 app-section-solid">
              <AccordionWrapper
                title="Daily Snow and Temperature Graph (Original)"
                subtitle={stationObservationsDataDay.title}
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
            <div className="mb-6 app-section-solid">
              <AccordionWrapper
                title={`Filtered Hourly Data`}
                subtitle={station.Station}
                defaultExpanded={false}
              >
                <HourWxTable 
                  hourAverages={stationDataHourFiltered}
                  key={`filtered-${station.Station}`}
                />
              </AccordionWrapper>
            </div>
          )}

          {/* Raw Hourly Data Table */}
          {stationDataHourUnFiltered.data.length > 0 && (
            <div className="mb-6 app-section-solid">
              <AccordionWrapper
                title={`Raw Hourly Data`}
                subtitle={station.Station}
                defaultExpanded={false}
              >
                <HourWxTable 
                  hourAverages={stationDataHourUnFiltered}
                  key={`raw-${station.Station}`}
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