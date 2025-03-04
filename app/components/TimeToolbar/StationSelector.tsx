import { FormControl, InputLabel, Select, MenuItem, ListSubheader } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { regions } from '../../config/regions';
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

interface StationSelectorProps {
  selectedStation: string;
  stations: Array<{ id: string; name: string }>;
  handleStationChange: (event: SelectChangeEvent<string>) => void;
}

export function StationSelector({
  selectedStation,
  stations,
  handleStationChange
}: StationSelectorProps) {
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
    <FormControl variant="outlined" size="small" className="w-full">
      <InputLabel>Station</InputLabel>
      <Select
        value={selectedStation}
        onChange={debouncedHandleStationChange}
        label="Station"
        className="w-full"
        MenuProps={{
          PaperProps: {
            sx: {
              '& .MuiListSubheader-root': {
                color: 'black',
                fontWeight: 'bold',
              },
              '& .MuiMenuItem-root': {
                paddingLeft: '32px',
                color: 'black',
                '&:hover': {
                  backgroundColor: 'rgba(100, 149, 237, 0.1)'
                }
              }
            }
          }
        }}
        sx={{
          '& .MuiSelect-icon': {
            color: 'rgba(0, 0, 0, 0.54)',
            width: '20px',
            height: '20px'
          }
        }}
      >
        <MenuItem value="">All Stations</MenuItem>
        {memoizedStationOptions}
      </Select>
    </FormControl>
  );
} 