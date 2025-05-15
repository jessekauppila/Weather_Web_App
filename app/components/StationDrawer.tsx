import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import DayAveragesTable from '../vis/dayWxTable';
import DayWxSnowGraph from '../vis/dayWxSnowGraph';
import HourWxTable from '../vis/hourWxTable';
import WxSnowGraph from '../vis/wxSnowGraph';
import moment from 'moment-timezone';
import { DayRangeType } from '../types';
import { Tabs, Tab, Box } from '@mui/material';
import WindRose from '../vis/windRose';

type HourData = {
  Day: string;
  Hour: string;
  [key: string]: any;
};

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
  timeRangeData?: {
    start_time_pdt: moment.Moment;
    end_time_pdt: moment.Moment;
  };
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
  timeRangeData,
  observationsDataDay,
  observationsDataHour,
  filteredObservationsDataHour,
  isMetric,
  tableMode,
  dayRangeType,
  customTime,
  calculateCurrentTimeRange
}) => {
  // Simple configuration
  const DRAWER_HEIGHT = 700; // Fixed height when open
  const MIN_DRAWER_HEIGHT = 50; // Minimum height when dragging
  const currentYear = moment().year();
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  const [drawerHeight, setDrawerHeight] = useState(DRAWER_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Reset tab when drawer opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(0);
      setDrawerHeight(DRAWER_HEIGHT);
    }
  }, [isOpen]);
  
  // Handle mouse down on the drawer handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = drawerHeight;
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = startYRef.current - e.clientY;
      const newHeight = Math.max(MIN_DRAWER_HEIGHT, startHeightRef.current + deltaY);
      setDrawerHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  // Memoize the current time range value
  const memoizedTimeRange = useMemo(() => {
    return Number(calculateCurrentTimeRange().split(" ")[0]) || 1;
  }, [calculateCurrentTimeRange]);

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

  const findLatestValue = useCallback((data: any[], field: string): string => {
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
  }, [stationDayData.data]);
  
  // Filter and format the data for the graphs
  const stationDataHourFiltered = useMemo(() => {
    if (!station || !filteredObservationsDataHour?.data) {
      return {
        data: [],
        title: station ? `Filtered Hourly Data - ${station.Station}` : ''
      };
    }

    const stationData = filteredObservationsDataHour.data.filter(
      (obs: { Station: string }) => obs.Station === station.Station
    );

    return {
      data: stationData,
      title: `Filtered Hourly Data - ${station.Station}`
    };
  }, [
    station, 
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
  }, [station, 
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
   station, 
    observationsDataDay?.data
  ]);

  // Replace the safeTimeRangeData useMemo with this
  const timeRangeInfo = useMemo(() => {
    if (!timeRangeData || !timeRangeData.start_time_pdt || !timeRangeData.end_time_pdt) {
      console.error('StationDrawer: Missing or invalid timeRangeData!');
      return null;
    }
    
    return {
      startDate: timeRangeData.start_time_pdt,
      endDate: timeRangeData.end_time_pdt
    };
  }, [timeRangeData]);
  

  // This is a NEW function to process hourly data into daily summaries
  const processedDailyFromHourly = useMemo(() => {
    if (!station || !stationDataHourFiltered?.data?.length || !timeRangeData) {
      return {
        data: [],
        title: station ? `Daily Data from Hourly - ${station.Station}` : ''
      };
    }

    // Use the timeRangeData directly
    const startDate = timeRangeData.start_time_pdt;
    const endDate = timeRangeData.end_time_pdt;
    
    // No need for validatedEndDate anymore - use endDate directly
    
    // First, sort all hourly data chronologically
    const allHoursSorted = [...stationDataHourFiltered.data].sort((a, b) => {
      const timeA = moment(`${a.Day} ${a.Hour}`, 'MMM DD h:mm A');
      const timeB = moment(`${b.Day} ${b.Hour}`, 'MMM DD h:mm A');
      return timeA.diff(timeB);
    });

    // Determine cutoff time based on dayRangeType
    let cutoffTimeFormat;
    if (dayRangeType === DayRangeType.MIDNIGHT) {
      cutoffTimeFormat = '12:00 AM';
    } else if (dayRangeType === DayRangeType.CURRENT) {
      cutoffTimeFormat = endDate.format('h:mm A');
    } else if (dayRangeType === DayRangeType.CUSTOM && customTime) {
      const [hours, minutes] = customTime.split(':').map(Number);
      cutoffTimeFormat = moment().hour(hours).minute(minutes).format('h:mm A');
    } else {
      cutoffTimeFormat = '12:00 AM';
    }

    // Group hours into custom periods
    const periodsByRange: { [key: string]: HourData[] } = {};
    const periodLabels = [];

    // Get all unique days in the data
    const uniqueDays = [...new Set(allHoursSorted.map(hour => hour.Day))];
    uniqueDays.sort((a, b) => moment(a, 'MMM DD').diff(moment(b, 'MMM DD')));

    // For each day, create a period from cutoff time to next day's cutoff
    for (let i = 0; i < uniqueDays.length; i++) {
      const thisDay = uniqueDays[i];
      const nextDay = i < uniqueDays.length - 1 ? uniqueDays[i + 1] : null;
      
      if (!nextDay) continue; // Skip the last day if there's no next day
      
      const periodStart = moment(`${thisDay} ${cutoffTimeFormat}`, 'MMM DD h:mm A');
      const periodEnd = moment(`${nextDay} ${cutoffTimeFormat}`, 'MMM DD h:mm A');
      const periodLabel = `${thisDay}/${nextDay}`;
      
      // Filter hours that fall within this period
      const hoursInPeriod = allHoursSorted.filter(hour => {
        const hourTime = moment(`${hour.Day} ${hour.Hour}`, 'MMM DD h:mm A');
        return hourTime.isAfter(periodStart) && hourTime.isSameOrBefore(periodEnd);
      });
      
      if (hoursInPeriod.length > 0) {
        periodsByRange[periodLabel] = hoursInPeriod;
        periodLabels.push(periodLabel);
      }
    }

    // Now create summaries for each period
    const dailySummaries = periodLabels.map(periodLabel => {
      const hoursInRange = periodsByRange[periodLabel];
      const [startDay, endDay] = periodLabel.split('/');
      
      // Create a summary for this period
      return {
        Station: station.Station,
        Elevation: station.Elevation,
        Date: periodLabel, // Use the period label as the date
        'Date Time': `${cutoffTimeFormat} - ${cutoffTimeFormat}, ${periodLabel}`,
        'Start Date Time': `${startDay}, ${currentYear}, ${cutoffTimeFormat}`,
        'End Date Time': `${endDay}, ${currentYear}, ${cutoffTimeFormat}`,
        Latitude: station.Latitude || 'NaN',
        Longitude: station.Longitude || 'NaN',
        Stid: `${moment(startDay, 'MMM DD').format('MM-DD')} ${cutoffTimeFormat} - ${moment(endDay, 'MMM DD').format('MM-DD')} ${cutoffTimeFormat}`,
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
        'Api Fetch Time': `${endDay}, ${hoursInRange[hoursInRange.length - 1]?.Hour || cutoffTimeFormat}`,
        'api_fetch_time': hoursInRange[hoursInRange.length - 1]?.API_Fetch_Time || '',
        'precipitation': '',
        'intermittent_snow': ''
      };
    });
    
    // Sort summaries by date for correct display
    dailySummaries.sort((a, b) => {
      return moment(a.Date, 'MMM DD').diff(moment(b.Date, 'MMM DD'));
    });
    
    // Create a title with appropriate time range
    let timeFormat;
    switch (dayRangeType) {
      case DayRangeType.MIDNIGHT:
        timeFormat = '12 AM - 11:59 PM';
        break;
      case DayRangeType.CURRENT:
        timeFormat = endDate.format('h:mm A') + ' cutoff';
        break;
      case DayRangeType.CUSTOM:
        const [hours, minutes] = customTime.split(':').map(Number);
        timeFormat = moment().hour(hours).minute(minutes).format('h:mm A') + ' cutoff';
        break;
      default:
        timeFormat = '12 AM - 11:59 PM';
    }
    
    const timeRangeStr = `${startDate.format('MMM DD')} to ${endDate.format('MMM DD')} (${timeFormat})`;
        
        return {
      data: dailySummaries,
      title: `${station.Station} - ${station.Elevation}\n${timeRangeStr}`
    };
  }, [currentYear, findLatestValue, 
    station, 
    stationDataHourFiltered, 
    dayRangeType, 
    customTime,
    timeRangeData
  ]);

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

  // function formatStid(day: string, startHour: string, endHour: string, dayRangeType: DayRangeType): string {
  //   const dayFormat = moment(day, 'MMM DD').format('MM-DD');
    
  //   if (dayRangeType === DayRangeType.MIDNIGHT) {
  //     return `${dayFormat} ${startHour} - ${dayFormat} ${endHour}`;
  //   } else {
  //     // For CURRENT or CUSTOM, include next day
  //     const nextDay = moment(day, 'MMM DD').add(1, 'day').format('MM-DD');
  //     return `${dayFormat} ${startHour} - ${nextDay} ${endHour}`;
  //   }
  // }
  
  // Helper function to create a day summary from hours data
  // function createDaySummary(day: string, hoursData: any[], station: any, dayRangeType: DayRangeType, customTime: string) {
  //   if (hoursData.length === 0) return null;
    
  //   let startHour, endHour;
  //   let startTime, endTime;
    
  //   switch (dayRangeType) {
  //     case DayRangeType.MIDNIGHT:
  //       // Midnight to midnight - use all hours
  //       startHour = "12:00 AM";
  //       endHour = "11:59 PM";
  //       startTime = `${day}, ${currentYear}, ${startHour}`;
  //       endTime = `${day}, ${currentYear}, ${endHour}`;
  //       break;
        
  //     case DayRangeType.CURRENT:
  //       // Current time cutoff
  //       const currentTime = moment().format('h:mm A');
  //       startHour = currentTime;
  //       endHour = currentTime;
        
  //       // Format times for display
  //       startTime = `${day}, ${currentYear}, 12:00 AM`;
  //       endTime = `${day}, ${currentYear}, ${endHour}`;
  //       break;
        
  //     case DayRangeType.CUSTOM:
  //       // Custom time cutoff
  //       if (!customTime) {
  //         // Use current time as fallback
  //         const now = new Date();
  //         const defaultTime = `${now.getHours()}:${now.getMinutes()}`;
  //         const [hours, minutes] = defaultTime.split(':').map(Number);
  //         startHour = moment().hour(hours).minute(minutes).format('h:mm A');
  //       } else {
  //         const [hours, minutes] = customTime.split(':').map(Number);
  //         startHour = moment().hour(hours).minute(minutes).format('h:mm A');
  //       }
  //       endHour = startHour;
        
  //       // Format times for display
  //       startTime = `${day}, ${currentYear}, 12:00 AM`;
  //       endTime = `${day}, ${currentYear}, ${endHour}`;
  //       break;
        
  //     default:
  //       // Default: midnight to midnight
  //       startHour = "12:00 AM";
  //       endHour = "11:59 PM";
  //       startTime = `${day}, ${currentYear}, ${startHour}`;
  //       endTime = `${day}, ${currentYear}, ${endHour}`;
  //   }

  //   // Create summary with properly filtered hours
  //   return {
  //     Station: station.Station,
  //     Elevation: station.Elevation,
  //     // Ensure Date is clearly the actual date string
  //     Date: day,
  //     // Format Date Time consistently for parsing in graph components
  //     'Date Time': `${startHour} - ${endHour}, ${day}, ${currentYear}`,
  //     // Make sure the Start/End Date Time formats are consistent
  //     'Start Date Time': startTime,
  //     'End Date Time': endTime,
  //     Latitude: station.Latitude || 'NaN',
  //     Longitude: station.Longitude || 'NaN',
  //     Stid: formatStid(day, "12:00 AM", endHour, dayRangeType),
  //     'Total Snow Depth': findLatestValue(hoursData, 'Total Snow Depth'),
  //     'Air Temp Min': findMinValue(hoursData, 'Air Temp'),
  //     'Air Temp Max': findMaxValue(hoursData, 'Air Temp'),
  //     'Cur Air Temp': findLatestValue(hoursData, 'Air Temp'),
  //     'Wind Speed Avg': calculateAverage(hoursData, 'Wind Speed'),
  //     'Max Wind Gust': findMaxValue(hoursData, 'Wind Gust'),
  //     'Wind Direction': findMostCommon(hoursData, 'Wind Direction'),
  //     'Relative Humidity': findLatestValue(hoursData, 'Relative Humidity'),
  //     'Solar Radiation Avg': calculateAverage(hoursData, 'Solar Radiation'),
  //     'Cur Wind Speed': findLatestValue(hoursData, 'Wind Speed'),
  //     '24h Snow Accumulation': calculateSnowAccumulation(hoursData),
  //     'Total Snow Depth Change': calculateTotalSnowDepthChange(hoursData),
  //     'Precip Accum One Hour': calculateTotalPrecipitation(hoursData),
  //     'Api Fetch Time': `${day}, ${hoursData[hoursData.length - 1]?.Hour || '11:59 PM'}`,
  //     'api_fetch_time': hoursData.map(hour => hour.API_Fetch_Time || hour['API Fetch Time']),
  //     'precipitation': '',
  //     'intermittent_snow': ''
  //   };
  // }
  
  if (!station) return null;

  return (
    <div
      className={`drawer ${isOpen ? 'open' : ''}`}
      style={{
        height: drawerHeight,
        width: "100%"
      }}
    >
      <div className="drawer-handle" onMouseDown={handleMouseDown} />
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
              <Tab 
                label="Wind Rose" 
                id={`station-tab-5`}
                aria-controls={`station-tabpanel-5`}
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
          className="drawer-scrollbar overflow-y-auto pr-2" 
          style={{ 
            height: `calc(100% - 50px)`,
            minHeight: '120px',
            maxHeight: `${DRAWER_HEIGHT - 90}px`,
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

          {/* Tab 6: Wind Rose */}
          <TabPanel value={activeTab} index={5}>
            {stationDataHourFiltered.data.length > 0 ? (
              <div className="mb-6 app-section-solid">
                <WindRose 
                  data={stationDataHourFiltered.data}
                  stationName={station.Station}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No wind data available</p>
              </div>
            )}
          </TabPanel>
        </div>
      </div>
    </div>
  );
};

export default StationDrawer; 