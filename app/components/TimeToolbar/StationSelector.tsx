import { FormControl, InputLabel, Select, MenuItem, ListSubheader } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { regions } from '../../config/regions';
import { useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';
//import { useStationDrawer } from '@/app/hooks/useStationDrawer';

interface StationSelectorProps {
  stations: Array<{ id: string; name: string }>;
  handleStationSelect: (station: any) => void;
  selectedStation: any;
  selectedStationId: string | null;
  onStationChange: (id: string) => void;
}

export function StationSelector({
  stations,
  handleStationSelect,
  selectedStation,
  selectedStationId,
  onStationChange
}: StationSelectorProps) {
  const handleChange = useCallback((event: SelectChangeEvent<string>) => {
    const stationId = event.target.value;
    const station = stations.find(s => s.id === stationId);
    if (station) {
      handleStationSelect(station);
    }
  }, [stations, handleStationSelect]);

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
      handleChange(event);
    }, 150),
    [handleChange]
  );

  return (
    <FormControl variant="outlined" size="small" className="w-full">
      <InputLabel className="!text-[var(--app-text-primary)]">Station</InputLabel>
      <Select
        value={selectedStationId || ''}
        onChange={(e: SelectChangeEvent<string>) => {
          const value = e.target.value;
          console.log('Selection event triggered:', value);
          onStationChange(value);
          // Also call handleStationSelect for backward compatibility
          const station = stations.find(s => s.id === value);
          if (station) {
            handleStationSelect(station);
          }
        }}
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