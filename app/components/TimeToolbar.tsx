import { useState } from 'react';
import { format } from 'date-fns';
import { DayRangeType } from '../types';
import { Button, Select, MenuItem, InputLabel, FormControl, TextField, Popover } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import moment from 'moment';

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
  observationsData?: {
    data: any[];
    title: string;
  } | null;
}

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
  observationsData,
}: TimeToolbarProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  console.log(observationsData)

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
                value={format(selectedDate, 'yyyy-MM-dd')}
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

            {/* Settings dropdown using Popover */}
            <Button variant="outlined" size="small" onClick={handleClick}>
              Cut Offs
            </Button>
            <Popover
              id={id}
              open={open}
              anchorEl={anchorEl}
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
                  <TextField
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    variant="outlined"
                    size="small"
                    className="w-full"
                  />
                )}
              </div>
            </Popover>
          </div>
        </div>

        {/* Station selector */}
        {(selectedStation || stationIds.length === 1) && (
          <FormControl variant="outlined" size="small" className="w-full sm:w-auto">
            <InputLabel>Station</InputLabel>
            <Select
              value={selectedStation}
              onChange={handleStationChange}
              label="Station"
            >
              <MenuItem value="">All Stations</MenuItem>
              {stations.map((station) => (
                <MenuItem key={station.id} value={station.id}>
                  {station.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </div>

      

      {/* Status lines showing both timespans */}
      {(observationsData || observationsData) && (
        <div className="text-sm text-gray-500 mt-2 text-center space-y-1">
          {observationsData && observationsData.data.length > 0 && (
            <>
              <div>
                Last Update: {moment(observationsData.data[observationsData.data.length - 1].date_time).format('MM/DD/YYYY h:mm A')}
              </div>
              {/* <div>
                Query Range: {moment(observationsData.data[0].date_time).format('MM/DD/YYYY h:mm A')} - {' '}
                {moment(observationsData.data[observationsData.data.length - 1].date_time).format('MM/DD/YYYY h:mm A')}
              </div> */}
            </>
          )}
          {observationsData && observationsData.data.length > 0 && (
            <div>
            Data: {moment(`${observationsData.data[0].Day} ${observationsData.data[0].Hour}`).format('MMM DD h:mm A')} - {' '}
              {moment(`${observationsData.data[observationsData.data.length - 1].Day} ${observationsData.data[observationsData.data.length - 1].Hour}`).format('MMM DD h:mm A')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeToolbar;