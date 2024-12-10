'use client';

import { format, addDays, subDays, startOfDay, setHours, setMinutes } from 'date-fns';
import moment from 'moment-timezone';
import React, {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
} from 'react';

import { filteredObservationData } from './filteredObservationData';
import hourWxTableDataFiltered from './hourWxTableDataFiltered';

import wxTableDataDayFromDB from './dayWxTableDataDayFromDB';
import DayAveragesTable from './dayWxTable';
import DayWxSnowGraph from './dayWxSnowGraph';


import hourWxTableDataFromDB from './hourWxTableDataFromDB';
import HourWxTable from './hourWxTable';
import WxSnowGraph from './wxSnowGraph';

//import HourWxSnowGraph from './hourWxSnowGraph';


import { DayRangeType } from './types';
import MeasurementCard from './components/MeasurementCard';

interface Station {
  id: string;
  name: string;
}

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
    [key: string]: string;
  };
  onStationClick: (stid: string) => void;
  observationsData: { data: any[]; title: string; } | null;
  isActive: boolean;
  onDropdownToggle: (stid: string | null) => void;
}

export default function Home() {
  // Get current time in PDT
  const currentMoment = moment().tz('America/Los_Angeles');
  const [customTime, setCustomTime] = useState(currentMoment.format('HH:mm'));

  const [isLoading, setIsLoading] = useState(true);

  const [observationsDataDay, setObservationsDataDay] = useState<{
    data: any[];
    title: string;
  } | null>(null);

  const [observationsDataHour, setObservationsDataHour] = useState<{
    data: any[];
    title: string;
  } | null>(null);

  const [filteredObservationsDataHour, setFilteredObservationsDataHour] = useState<{
    data: any[];
    title: string;
  } | null>(null);

  const [stations, setStations] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [stationIds, setStationIds] = useState<string[]>([]);

  // Add loading state for station change
  const [isStationChanging, setIsStationChanging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isOneDay, setIsOneDay] = useState(true); // Default to true since we start with 1 day view

  

  // Add state for table mode
  const [tableMode, setTableMode] = useState<'summary' | 'daily'>('summary');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Add a new state for component visibility
  const [isComponentVisible, setIsComponentVisible] = useState(true);

  // Move this up, before calculateTimeRange
  const [timeRange, setTimeRange] = useState(1);

  // Add this state at the top level where RegionCard is used
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  /**
   * Calculates the start and end times based on the selected date and range type
   * @param date - The base date to calculate the range from
   * @param type - The type of range (MIDNIGHT, CURRENT, or FORECAST)
   * @returns Object containing start time, end time, and corresponding hours
   */
  const calculateTimeRange = (date: Date, type: DayRangeType) => {
    const endMoment = moment(date).tz('America/Los_Angeles');
    const currentMoment = moment().tz('America/Los_Angeles');
    
    switch (type) {
      case DayRangeType.MIDNIGHT:
        const midnightResult = {
          start: endMoment.clone().startOf('day'),
          end: endMoment.clone().startOf('day').add(24 * timeRange, 'hours'),
          startHour: 0,
          endHour: 24
        };

        return midnightResult;
        
      case DayRangeType.CURRENT:
        const currentHour = currentMoment.hour();
        const currentMinute = currentMoment.minute();
        
        const currentResult = {
          start: endMoment.clone()
            .subtract(timeRange, 'days')
            .hour(currentHour)
            .minute(currentMinute)
            .second(0),
          end: endMoment.clone()
            .hour(currentHour)
            .minute(currentMinute)
            .second(0),
          startHour: currentHour,
          endHour: currentHour
        };

        return currentResult;

        case DayRangeType.CUSTOM:
          const [hours, minutes] = customTime.split(':').map(Number);
          return {
            start: endMoment.clone()
              .subtract(timeRange, 'days')
              .hour(hours)
              .minute(minutes)
              .second(0),
            end: endMoment.clone()
              .hour(hours)
              .minute(minutes)
              .second(0),
            startHour: hours,
            endHour: hours
          };
    
        default:
          // Fallback to midnight case if type is unknown
          return {
            start: endMoment.clone().subtract(timeRange, 'days').startOf('day'),
            end: endMoment.clone().endOf('day'),
            startHour: 0,
            endHour: 23
          };
    }
  };

  // Initialize with the current date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

    // Remove unused state variables
    const [useCustomEndDate, setUseCustomEndDate] = useState(false);
    const [startHour, setStartHour] = useState<number>(0);
    const [endHour, setEndHour] = useState<number>(0);
  
    // Add state for day range type
    const [dayRangeType, setDayRangeType] = useState<DayRangeType>(DayRangeType.MIDNIGHT);
    // console.log('dayRangeType:', dayRangeType);
  

    // Now the time calculation will work
    const { 
      startHour: calculatedStartHour, 
      endHour: calculatedEndHour 
    } = calculateTimeRange(selectedDate, dayRangeType);
  
    // Add effect to update hours when time range changes
    useEffect(() => {
      setStartHour(calculatedStartHour);
      setEndHour(calculatedEndHour);
    }, [calculatedStartHour, calculatedEndHour]);
  
    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedEndDate = new Date(event.target.value);
      setEndDate(selectedEndDate);
      setSelectedDate(subDays(selectedEndDate, timeRange));
    };


  // this is the function that determines what happens in the drop down menu for date range
  const handleTimeRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    //console.log('Time range changed to:', value);
    
    if (value === 'custom') {
      setUseCustomEndDate(true);
      setIsOneDay(false);
      return;
    }
    
    setUseCustomEndDate(false);
    setTimeRange(Number(value));
    
    const newEndDate = new Date();
    let newStartDate: Date;
    
    switch (value) {
      case '1':
        newStartDate = subDays(newEndDate, 1);
        setIsOneDay(true);
        break;
      case '3':
        newStartDate = subDays(newEndDate, 3);
        setIsOneDay(false);
        break;
      case '7':
        newStartDate = subDays(newEndDate, 7);
        setIsOneDay(false);
        break;
      case '14':
        newStartDate = subDays(newEndDate, 14);
        setIsOneDay(false);
        break;
      case '30':
        newStartDate = subDays(newEndDate, 30);
        setIsOneDay(false);
        break;
      default:
        newStartDate = subDays(newEndDate, 1);
        setIsOneDay(true);
    }

    console.log('Setting dates:', {
      start: newStartDate,
      end: newEndDate
    });

    setSelectedDate(newStartDate);
    setEndDate(newEndDate);
    setUseCustomEndDate(true);
  };

  const handleEndDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEndDate(new Date(event.target.value));
  };

  const handlePrevDay = () => {
    setSelectedDate((prevDate) => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate((prevDate) => addDays(prevDate, 1));
  };

  //Fetch the stations from the DB and then use the station ids to fetch the observations from the DB
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch('/api/getStations');
        if (!response.ok) {
          throw new Error('Failed to fetch stations');
        }
        const data = await response.json();
        const mappedStations = data
          .map((station: any) => ({
            id: station.stid,
            name: station.station_name,
          }))
          .sort((a: Station, b: Station) =>
            a.name.localeCompare(b.name)
          );

        setStations(mappedStations);
        // Set stationIds to include all station IDs initially
        const allStationIds = mappedStations.map((station: any) => station.id);
        setStationIds(allStationIds);
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
    };

    fetchStations();
  }, []);

  // First, memoize the time range calculation
  const timeRangeData = useMemo(() => {
    let { start: start_time_pdt, end: end_time_pdt } = calculateTimeRange(selectedDate, dayRangeType);
    
    if (timeRange !== 1) {
      start_time_pdt = moment(selectedDate).tz('America/Los_Angeles').startOf('day');
      end_time_pdt = moment(endDate).tz('America/Los_Angeles').endOf('day');
    }

    return {
      start_time_pdt,
      end_time_pdt
    };
  }, [selectedDate, endDate, dayRangeType, timeRange]); // Minimal dependencies

  // Then update the useEffect to use the memoized values and minimal dependencies
  useEffect(() => {
    const fetchDataFromDB = async () => {
      try {
        const { start_time_pdt, end_time_pdt } = timeRangeData;
        
        const response = await fetch('/api/getObservationsFromDB', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: start_time_pdt.toISOString(),
            endDate: end_time_pdt.toISOString(),
            stationIds: stationIds,
          }),
        });

        if (!response.ok) {
          throw new Error('API error');
        }

        const result = await response.json();
        
        // Process data once and store results
        const filteredData = filteredObservationData(result.observations, {
          mode: tableMode,
          startHour,
          endHour,
          dayRangeType,
          start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
          end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
        });

        // Update all states at once
        setObservationsDataDay(wxTableDataDayFromDB(filteredData, result.units, {
          mode: tableMode,
          startHour,
          endHour,
          dayRangeType,
          start: start_time_pdt.format('YYYY-MM-DD HH:mm:ss'),
          end: end_time_pdt.format('YYYY-MM-DD HH:mm:ss')
        }));
        
        setObservationsDataHour(hourWxTableDataFromDB(
          Object.values(result.observations) as any[][] as any[],
          result.units
        ));

        setFilteredObservationsDataHour(hourWxTableDataFiltered(Object.values(filteredData).flat()));
        setIsLoading(false);

      } catch (error) {
        setIsLoading(false);
      }
    };

    fetchDataFromDB();
  }, [timeRangeData, stationIds]); // Reduced dependencies



  // Modify the handleStationChange function
  const handleStationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setIsComponentVisible(false);  // Hide components before transition
      setIsTransitioning(true);
      const selectedStationId = e.target.value;
      
      // Short delay before state changes
      setTimeout(() => {
        startTransition(() => {
          if (!selectedStationId) {
            setSelectedStation('');
            setStationIds(stations.map(station => station.id));
            setTableMode('summary');
            setTimeRange(1);
            setIsOneDay(true);
            setSelectedDate(new Date());
            setEndDate(new Date());
            setUseCustomEndDate(false);
          } else {
            setSelectedStation(selectedStationId);
            setStationIds([selectedStationId]);
            setTableMode('daily');
          }
        });

        // Show components after state changes
        setTimeout(() => {
          setIsComponentVisible(true);
          setIsTransitioning(false);
          setIsStationChanging(false);
        }, 100);
      }, 100);
    },
    [stations]
  );

  const handleStationClick = (stationId: string) => {
    setIsStationChanging(true);
    
    startTransition(() => {
      setSelectedStation(stationId);
      setStationIds([stationId]);
      setTableMode('daily');
    });

    setTimeout(() => {
      setIsStationChanging(false);
    }, 300);
  };

  useEffect(() => {
    //console.log('selectedStation changed to:', selectedStation);
    if (selectedStation) {
      //console.log('🔄 Switching to daily mode - Station selected:', selectedStation);
      setTableMode('daily');
    } else {
      //console.log('🔄 Switching to summary mode - No station selected');
      setTableMode('summary');
    }
  }, [selectedStation]);



  // Updated calculateCurrentTimeRange to be more precise
  const calculateCurrentTimeRange = () => {
    if (useCustomEndDate && timeRange !== 1 && timeRange !== 3 && timeRange !== 7 && timeRange !== 14 && timeRange !== 30) {
      return 'custom';
    }
    return timeRange.toString();
  };

  // Simplified handler - only updates the type and hours
  const handleDayRangeTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value as DayRangeType;
    //console.log('DayRangeType changed:', {
    //  newType,
    //  selectedDate,
    //  timeRange,
    //  isCustom: newType === DayRangeType.CUSTOM
    //});
    
    setDayRangeType(newType);
    
    // Update hours based on the selected type
    const { startHour, endHour } = calculateTimeRange(selectedDate, newType);
    setStartHour(startHour);
    setEndHour(endHour);
  };

  // Add this effect or merge with existing dayRangeType-related effect
  useEffect(() => {
    //console.log('Current dayRangeType:', dayRangeType);
    //console.log('Is CUSTOM?', dayRangeType === DayRangeType.CUSTOM);
  }, [dayRangeType]);

  console.log('observationsDataDay', observationsDataDay);


  // start STATION CARD 

  const StationCard = ({ station, onStationClick, observationsData, isActive, onDropdownToggle }: StationCardProps) => {
    const [snowAccordionOpen, setSnowAccordionOpen] = useState(false);
    const [tempAccordionOpen, setTempAccordionOpen] = useState(false);
    const [windAccordionOpen, setWindAccordionOpen] = useState(false);

    return (
      <div className="station-card">
        <div className="station-card-header">
          <h2 className="station-name">{station.Station}</h2>
        </div>
        <div onClick={() => onStationClick(station.Stid)}>
          <p className="station-elevation">{station.Elevation}</p>
          <div className="measurement-grid">
            <MeasurementCard 
              title="Snow"
              isOpen={snowAccordionOpen}
              onToggle={() => setSnowAccordionOpen(!snowAccordionOpen)}
              metricValue={station['24h Snow Accumulation'].replace(' in', '')}
              metricUnit=" in"
              subtitle="Accumulation"
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
      </div>
    );
  };

    // end STATION CARD 

  // Define station groups by stids
  const stationGroups = {
    westSlopesNorth: ['5', '6'],  // Example stids for alpine stations
    westSlopesCentral: ['48', '49', '50', '51', '52', '53','57'],
    westSlopesSouth: ['29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '54'],
    eastSlopesNorth: ['7', '8', '9'],  // Example stids for alpine stations
    eastSlopesCentral: ['11','24', '25', '26'],  // Example stids for alpine stations
    eastSlopesSouth: [],  // Example stids for alpine stations
    olympics: ['4', '19'],  // Example stids for alpine stations
    mtHood: ['41', '42', '43', '44', '45', '46', '47','56'],
    snoqualmie: ['1','2','20', '21', '22', '23'],  // Example stids for alpine stations
    stevensPass: ['13', '14', '17', '18','50','51'],  // Example stids for alpine stations
    
  };

  // RegionCard component that contains multiple StationCards
  const RegionCard = ({ 
    title, 
    stations, 
    stationIds, 
    onStationClick,
    observationsData,
    activeDropdown,
    onDropdownToggle
  }: { 
    title: string, 
    stations: Array<{
      Station: string,
      'Cur Air Temp': string,
      '24h Snow Accumulation': string,
      'Cur Wind Speed': string,
      'Elevation': string,
      Stid: string
    }>,
    stationIds: string[],
    onStationClick: (stid: string) => void,
    observationsData: {
      data: any[];
      title: string;
    } | null,
    activeDropdown: string | null,
    onDropdownToggle: (stid: string | null) => void
  }) => (
    <div className="bg-[cornflowerblue] bg-opacity-10 p-4 rounded-lg mb-4">
      <h2 className="text-xl text-black font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stations.filter(station => 
          stationIds.includes(station.Stid)
        ).map((station, index) => (
          <StationCard 
            key={index} 
            station={station} 
            onStationClick={onStationClick}
            observationsData={observationsData}
            isActive={activeDropdown === station.Stid}
            onDropdownToggle={onDropdownToggle}
          />
        ))}
      </div>
    </div>
  );

  // Add click outside handler at the top level
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('details')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

  // Define the regions configuration
  const regions = [
    { id: 'westSlopesNorth', title: 'West Slopes North', stationIds: stationGroups.westSlopesNorth },
    { id: 'westSlopesCentral', title: 'West Slopes Central', stationIds: stationGroups.westSlopesCentral },
    { id: 'westSlopesSouth', title: 'West Slopes South', stationIds: stationGroups.westSlopesSouth },
    { id: 'eastSlopesNorth', title: 'East Slopes North', stationIds: stationGroups.eastSlopesNorth },
    { id: 'eastSlopesCentral', title: 'East Slopes Central', stationIds: stationGroups.eastSlopesCentral },
    { id: 'eastSlopesSouth', title: 'East Slopes South', stationIds: stationGroups.eastSlopesSouth },
    { id: 'olympics', title: 'Olympics', stationIds: stationGroups.olympics },
    { id: 'mtHood', title: 'Mt Hood', stationIds: stationGroups.mtHood },
    { id: 'snoqualmie', title: 'Snoqualmie', stationIds: stationGroups.snoqualmie },
    { id: 'stevensPass', title: 'Stevens Pass', stationIds: stationGroups.stevensPass }
  ];

  // Usage in your render
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-100">
      <div className="w-full max-w-6xl space-y-4">

        {/* Top Tool Bar */}

        <div className="flex flex-col items-center">
          <div className="flex flex-col space-y-4 bg-[cornflowerblue] p-4 rounded-xl shadow-md">
            {/* Top row with date controls */}

            <div className="flex items-center justify-center space-x-4">
              <select
                value={calculateCurrentTimeRange()}
                onChange={handleTimeRangeChange}
                className="neumorphic-button dropdown h-10"
              >
                <option value="1">1 Day</option>
                <option value="3">Past 3 Days</option>
                <option value="7">Past 7 Days</option>
                <option value="14">Past 14 Days</option>
                <option value="30">Past 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>

              
              <div className="flex gap-4 items-center">
                {/* <DayRangeSelect 
                  value={dayRangeType} 
                  onChange={handleDayRangeChange} 
                /> */}
                <div className="flex items-center space-x-2">
                  {isOneDay && (
                    <button onClick={handlePrevDay} className="neumorphic-button nav-button h-10 w-10">
                      &lt;
                    </button>
                  )}
                  
                  <input
                    type="date"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={handleDateChange}
                    className="neumorphic-button date-picker h-10"
                  />
                  
                  {isOneDay && (
                    <button onClick={handleNextDay} className="neumorphic-button nav-button h-10 w-10">
                      &gt;
                    </button>
                  )}

                  {!isOneDay && (
                    <input
                      type="date"
                      value={format(endDate, 'yyyy-MM-dd')}
                      onChange={handleEndDateChange}
                      className="neumorphic-button date-picker h-10"
                      min={format(selectedDate, 'yyyy-MM-dd')}
                    />
                  )}

              <div className="flex items-center space-x-4">
                {/* Main container - now narrower since dropdown expands left */}
                <details className="relative w-[40px]"> {/* Match button width */}
                  {/* Button that shows the caret - same size as before */}
                  <summary className="neumorphic-button h-10 w-10 flex items-center justify-center px-4 cursor-pointer">
                    <span className="transform transition-transform duration-200 details-caret">▼</span>
                  </summary>
                  {/* Expanded dropdown menu - now positioned to expand leftward */}
                  <div className="absolute right-0 top-full mt-2 bg-[cornflowerblue] p-4 rounded-lg shadow-lg space-y-4 w-[300px]">
                    <select
                      value={dayRangeType}
                      onChange={handleDayRangeTypeChange}
                      className="neumorphic-button dropdown h-10 w-full"
                    >
                      <option value={DayRangeType.MIDNIGHT}>Range: Midnight to Midnight</option>
                      <option value={DayRangeType.CURRENT}>Range: Rolling 24 hours</option>
                      <option value={DayRangeType.CUSTOM}>Range: Custom</option>
                    </select>

                    {/* Time picker - only shows when Custom is selected */}
                    {dayRangeType === DayRangeType.CUSTOM && (
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="neumorphic-button time-picker h-10 w-full"
                      />
                    )}
                  </div>
                </details>
              </div>


                </div>
              </div>
            </div>

            {/* Bottom row with station selector */}
            {/* Station selector - show when a station is selected or after clicking from table */}
            {(selectedStation || stationIds.length === 1) && (
              <div className="flex justify-center">
                <select
                  value={selectedStation}
                  onChange={handleStationChange}
                  className="neumorphic-button dropdown h-10"
                >
                  <option value="">All Stations</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Should show if stuff is loading, but not showing anything now  */}
        <div 
          className={`w-full max-w-6xl space-y-4 transition-opacity duration-200 ${
            isComponentVisible && !isLoading && !isPending 
              ? 'opacity-100' 
              : 'opacity-0'
          }`}
        >

        {/*  Regions  */}

        {observationsDataDay && tableMode === 'summary' && (
          <>
            {regions.map(region => (
              <RegionCard
                key={region.id}
                title={region.title}
                stations={observationsDataDay.data}
                stationIds={region.stationIds}
                onStationClick={handleStationClick}
                observationsData={observationsDataDay}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />
            ))}
          </>
        )}

        {/* Individual STATION Components  */}

         {/*<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {observationsDataDay?.data.map((station, stid) => (
            <StationCard key={stid} station={station} />
          ))}
        </div>
        */}
        
        {/* Graphs   */}

        {observationsDataDay && selectedStation && stationIds.length === 1 && timeRange > 3 && (
            <>
              <DayWxSnowGraph 
                dayAverages={observationsDataDay} 
                isHourly={false}
              />
            </>
          )}

          {filteredObservationsDataHour && selectedStation && stationIds.length === 1 && (
            <>
              <WxSnowGraph 
                dayAverages={filteredObservationsDataHour} 
                isHourly={true}
              />
            </>
          )}

           {/* Tables   */}


          {observationsDataDay && tableMode === 'daily' && (
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

      </div>
    </main>
  );
}
