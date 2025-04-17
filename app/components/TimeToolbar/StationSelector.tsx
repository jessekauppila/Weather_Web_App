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
      <ListSubheader key={`header-${region.id}`} className="!text-[var(--app-text-primary)]">
        {region.title}
      </ListSubheader>,
      stations
        .filter(station => region.stationIds.includes(station.id))
        .map((station) => (
          <MenuItem key={station.id} value={station.id} className="!text-[var(--app-text-primary)]">
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
      <InputLabel className="!text-[var(--app-text-primary)]">Station</InputLabel>
      <Select
        value={selectedStation}
        onChange={debouncedHandleStationChange}
        label="Station"
        className="w-full app-select text-[var(--app-text-primary)]"
        MenuProps={{
          classes: {
            paper: 'app-menu-paper'
          }
        }}
      >
        <MenuItem value="" className="!text-[var(--app-text-primary)]">All Stations</MenuItem>
        {memoizedStationOptions}
      </Select>
    </FormControl>
  );
} 