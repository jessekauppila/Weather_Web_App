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
      >
        <MenuItem value="">All Stations</MenuItem>
        {memoizedStationOptions}
      </Select>
    </FormControl>
  );
} 