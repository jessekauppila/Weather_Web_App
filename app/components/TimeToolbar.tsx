import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { DayRangeType } from '../types';
import { Button, Select, MenuItem, InputLabel, FormControl, TextField, Popover, ListSubheader } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import moment from 'moment';
import { regions, stationGroups } from '../config/regions';
import { styled } from '@mui/material/styles';
import { Switch, Stack, Typography } from '@mui/material';
import debounce from 'lodash/debounce';

interface TimeToolbarProps {
  calculateCurrentTimeRange: () => string;
  handleTimeRangeChange: (event: SelectChangeEvent<string>) => void;
  isOneDay: boolean;
  handlePrevDay: () => void;
  handleNextDay: () => void;
  selectedDate: Date;
  handleDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  endDate: Date;
  handleEndDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  dayRangeType: DayRangeType;
  handleDayRangeTypeChange: (event: SelectChangeEvent<DayRangeType>) => void;
  customTime: string;
  setCustomTime: (value: string) => void;
  selectedStation: string;
  stations: Array<{ id: string; name: string }>;
  handleStationChange: (event: SelectChangeEvent<string>) => void;
  stationIds: string[];
  filteredObservationsDataHour?: {
    data: any[];
    title: string;
  } | null;
  onRefresh: (newIsMetric?: boolean) => Promise<void>;
  tableMode: 'summary' | 'daily';
  startHour: number;
  endHour: number;
  setObservationsDataDay: (data: any) => void;
  setObservationsDataHour: (data: any) => void;
  setFilteredObservationsDataHour: (data: any) => void;
  setIsLoading: (loading: boolean) => void;
  isMetric: boolean;
  setIsMetric: (isMetric: boolean) => void;
}

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 28,
  height: 16,
  padding: 0,
  display: 'flex',
  '&:active': {
    '& .MuiSwitch-thumb': {
      width: 15,
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      transform: 'translateX(9px)',
    },
  },
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(12px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#1890ff'
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
    width: 12,
    height: 12,
    borderRadius: 6,
    transition: theme.transitions.create(['width'], {
      duration: 200,
    }),
  },
  '& .MuiSwitch-track': {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: 'rgba(0,0,0,.25)',
    boxSizing: 'border-box',
  },
}));

const TimeToolbar = ({
  calculateCurrentTimeRange,
  handleTimeRangeChange,
  isOneDay,
  handlePrevDay,
  handleNextDay,
  selectedDate,
  handleDateChange,
  endDate,
  handleEndDateChange,
  dayRangeType,
  handleDayRangeTypeChange,
  customTime,
  setCustomTime,
  selectedStation,
  stations,
  handleStationChange,
  stationIds,
  filteredObservationsDataHour,
  onRefresh,
  tableMode,
  startHour,
  endHour,
  setObservationsDataDay,
  setObservationsDataHour,
  setFilteredObservationsDataHour,
  setIsLoading,
  isMetric,
  setIsMetric
}: TimeToolbarProps) => {
  const [dataAnchorEl, setDataAnchorEl] = useState<null | HTMLElement>(null);
  const [cutOffAnchorEl, setCutOffAnchorEl] = useState<null | HTMLElement>(null);
  const [unitsAnchorEl, setUnitsAnchorEl] = useState<null | HTMLElement>(null);
  //const [lastApiCall, setLastApiCall] = useState<string | null>(null);

  const handleCustomTimeButtonClick = async () => {
    // First set the type to CUSTOM
    await handleDayRangeTypeChange({ 
      target: { value: DayRangeType.CUSTOM } 
    } as SelectChangeEvent<DayRangeType>);
    
    // Update the time range
    handleTimeRangeChange({ 
      target: { value: calculateCurrentTimeRange() } 
    } as SelectChangeEvent<string>);
  };

  const memoizedHandleCustomTime = useCallback(handleCustomTimeButtonClick, []);


  const handleUnitsPopupButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setUnitsAnchorEl(event.currentTarget);
  };
  const handleDataPopupButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setDataAnchorEl(event.currentTarget);
  };

  const handleCutOffPopupButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setCutOffAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setDataAnchorEl(null);
    setCutOffAnchorEl(null);
    setUnitsAnchorEl(null);
  };

  const open = Boolean(dataAnchorEl) || Boolean(cutOffAnchorEl);
  const id = open ? 'simple-popover' : undefined;

  const handleRefreshButtonClick = async () => {
    await onRefresh();
    await handleDateChange({ target: { value: format(selectedDate, 'yyyy-MM-dd') } } as React.ChangeEvent<HTMLInputElement>);
    //console.log('Updated last API call:', newLastApiCall);
  };

  const memoizedStationOptions = useMemo(() => (
    regions.map((region) => [
      <ListSubheader key={`header-${region.id}`}>
        {region.title}
      </ListSubheader>,
      stations
        .filter(station => region.stationIds.includes(station.id))
        .map((station) => (
          <MenuItem key={station.id} value={station.id}>
            {station.name}
          </MenuItem>
        ))
    ])
  ), [stations]);

  const debouncedHandleStationChange = useMemo(
    () => debounce((event: SelectChangeEvent<string>) => {
      handleStationChange(event);
    }, 150),
    [handleStationChange]
  );

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col space-y-2 bg-[cornflowerblue] p-2 sm:p-4 rounded-xl shadow-md w-full">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 w-full">
          {/* Time range selector */}
          <FormControl variant="outlined" size="small" className="w-[100px] sm:w-auto">
            <InputLabel>Range</InputLabel>
            <Select
              value={calculateCurrentTimeRange()}
              onChange={handleTimeRangeChange}
              label="Range"
            >
              <MenuItem value="1">1 Day</MenuItem>
              <MenuItem value="3">3 Days</MenuItem>
              <MenuItem value="7">7 Days</MenuItem>
              <MenuItem value="14">14 Days</MenuItem>
              <MenuItem value="30">30 Days</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>

          {/* Date controls container */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 sm:gap-2 flex-nowrap min-w-[200px] sm:min-w-[280px]">
              {isOneDay && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handlePrevDay}
                >
                  &lt;
                </Button>
              )}
              
              <TextField
                type="date"
                value={selectedDate && !isNaN(selectedDate.getTime()) 
                  ? format(selectedDate, 'yyyy-MM-dd')
                  : format(new Date(), 'yyyy-MM-dd')}
                onChange={handleDateChange}
                variant="outlined"
                size="small"
                className="flex-grow"
              />
              
              {isOneDay && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleNextDay}
                >
                  &gt;
                </Button>
              )}
            </div>

            {!isOneDay && (
              <div className="flex items-center gap-1 sm:gap-2 flex-nowrap min-w-[200px] sm:min-w-[280px]">
                <TextField
                  type="date"
                  value={format(endDate, 'yyyy-MM-dd')}
                  onChange={handleEndDateChange}
                  variant="outlined"
                  size="small"
                  className="flex-grow"
                  inputProps={{ min: format(selectedDate, 'yyyy-MM-dd') }}
                />
              </div>
            )}
          {/* //////////////// */}
            {/* END CUTOFF BUTTON */}
            {/* //////////////// */}
            {/* Settings dropdown using Popover */}
            <Button variant="outlined" size="small" onClick={handleCutOffPopupButtonClick}>
              Cut Offs
            </Button>

            <Popover
              id={id}
              open={Boolean(cutOffAnchorEl)}
              anchorEl={cutOffAnchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
              <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 w-[250px] sm:w-[300px] bg-[cornflowerblue]">
                <FormControl variant="outlined" size="small" className="w-full">
                  <InputLabel>Range</InputLabel>
                  <Select
                    value={dayRangeType}
                    onChange={handleDayRangeTypeChange}
                    label="Range"
                    // MenuProps={{
                    //   PaperProps: {
                    //     sx: {
                    //       bgcolor: 'cornflowerblue',
                    //     },
                    //   },
                    // }}
                  >
                    <MenuItem value={DayRangeType.MIDNIGHT}>Midnight to Midnight</MenuItem>
                    <MenuItem value={DayRangeType.CURRENT}>Rolling 24 hours</MenuItem>
                    <MenuItem value={DayRangeType.CUSTOM}>Custom</MenuItem>
                  </Select>
                </FormControl>

                {dayRangeType === DayRangeType.CUSTOM && (
                  <>
                    <TextField
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      variant="outlined"
                      size="small"
                      className="w-full"
                    />
                    
                    {/* <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 w-[200px] sm:w-[250px] bg-[cornflowerblue]"> */}
                      {/* <FormControl variant="outlined" size="small" className="w-full"> */}
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={memoizedHandleCustomTime}
                          sx={{
                            minWidth: '120px',
                            textAlign: 'left',
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            borderColor: '#49597F',
                            transition: 'background-color 0.15s',
                            '&:hover': {
                              backgroundColor: 'rgba(107,123,164,0.1)',
                              borderColor: '#6B7BA4'
                            },
                            marginTop: '8px'
                          }}
                        >
                          Apply Custom Range
                        </Button>
                      {/* </FormControl> */}
                    {/* </div> */}
                  </>
                )}
              </div>
            </Popover>

            {/* //////////////// */}
            {/* END CUTOFF BUTTON */}
            {/* //////////////// */}


            {/* //////////////// */}
            {/* DATA INFO BUTTON */}
            {/* //////////////// */}

            <Button variant="outlined" size="small" onClick={handleDataPopupButtonClick}>
            Data Info
            </Button>

            <Popover
              id={id}
              open={Boolean(dataAnchorEl)}
              anchorEl={dataAnchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              >

            <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 w-[250px] sm:w-[300px] bg-[cornflowerblue]">

            <div className="text-[11px] text-[lightgrey] mt-2 text-center space-y-1 bg-[cornflowerblue]">
            {filteredObservationsDataHour && filteredObservationsDataHour.data.length > 0 && (
            <>
              <div>
                Page Loaded: {moment(filteredObservationsDataHour.data[filteredObservationsDataHour.data.length - 1].date_time).format('MM/DD/YYYY h:mm A')}
              </div>
              <div className="text-[10px]">
                  (Data fetched 5 and 20 min past the hour)
              </div>


            {/* <div>
                Range Requested: {moment(`${filteredObservationsDataHour.data[0].Day} ${filteredObservationsDataHour.data[0].Hour}`, 'MMM DD h:mm A').format('MMM DD h:mm A')} - {' '}
                {moment(`${filteredObservationsDataHour.data[filteredObservationsDataHour.data.length - 1].Day} ${filteredObservationsDataHour.data[filteredObservationsDataHour.data.length - 1].Hour}`, 'MMM DD h:mm A').format('MMM DD h:mm A')}
              </div> */}
            </>
          )}
          </div>
            <FormControl variant="outlined" size="small" className="w-full">
            <Button 
                variant="outlined" 
                size="small" 
                onClick={handleRefreshButtonClick}
                >
                Refresh Data
            </Button>
            </FormControl>
            </div>

            </Popover>
           {/* /////////////////////// */}
            {/* END DATA INFO BUTTON */}
            {/* /////////////////////// */}

            {/* ////////////////// */}
            {/* / UNITS SWITCH BUTTON /*/}
            {/* ////////////////// */}

            <Button variant="outlined" size="small" onClick={handleUnitsPopupButtonClick}>
              Units
            </Button>

            <Popover
              id={id}
              open={Boolean(unitsAnchorEl)}
              anchorEl={unitsAnchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              PaperProps={{
                sx: {
                  width: 'auto',     // Allow width to be determined by content
                  minWidth: 'auto',  // Remove minimum width constraint
                  maxWidth: 'none',  // Remove maximum width constraint
                  '& .MuiPopover-paper': {
                    width: 'auto'
                  }
                }
              }}
            >
              <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 bg-[cornflowerblue]">
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography 
                    sx={{ 
                      fontSize: '1rem',
                      //color: 'primary.main',
                      fontWeight: 500
                    }}
                  >
                    Imperial
                  </Typography>
                  <AntSwitch 
                    checked={isMetric}
                    onChange={async (e) => {
                      const newIsMetric = e.target.checked;
                      //console.log('🔄 TimeToolbar: Unit switch toggled to:', newIsMetric);
                      setIsMetric(newIsMetric);
                      //console.log('🔄 TimeToolbar: State updated, refreshing with isMetric:', newIsMetric);
                      await onRefresh(newIsMetric);
                    }}
                    inputProps={{ 'aria-label': 'unit switch' }}
                  />
                  <Typography 
                    sx={{ 
                      fontSize: '1rem',
                      //color: 'primary.main',
                      fontWeight: 500
                    }}
                  >
                    Metric
                  </Typography>
                </Stack>
              </div>
            </Popover>

           {/* //////////////////////// */}
           {/* // END UNITS SWITCH BUTTON //*/}
          {/* ///////////////////////// */}


          </div>
        </div>



        {/* Station selector */}
        {/* {(selectedStation || stationIds.length === 1) && ( */}
          <FormControl variant="outlined" size="small" className="w-full sm:w-auto">
            <InputLabel>Station</InputLabel>
            <Select
              value={selectedStation}
              onChange={debouncedHandleStationChange}
              label="Station"
              MenuProps={{
                PaperProps: {
                  sx: {
                    '& .MuiListSubheader-root': {
                      // Style for region headers
                      //backgroundColor: 'cornflowerblue',
                      color: 'black',
                      fontWeight: 'bold',
                    },
                    '& .MuiMenuItem-root': {
                      // Style for station items
                      paddingLeft: '32px',
                      color: 'black',
                      '&:hover': {
                        backgroundColor: 'rgba(100, 149, 237, 0.1)'
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">All Stations</MenuItem>
              {memoizedStationOptions}
            </Select>
          </FormControl>
        {/* )} */}


      </div>

      
    </div>
  );
};

export default TimeToolbar;