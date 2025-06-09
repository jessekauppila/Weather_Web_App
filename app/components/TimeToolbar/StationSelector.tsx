import { FormControl, InputLabel, Select, MenuItem, ListSubheader, Box, Chip } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { regions } from '../../config/regions';
import { useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';

interface StationSelectorProps {
  stations: Array<{ id: string; name: string }>;
  handleStationSelect: (station: any) => void;
  selectedStation: any;
  selectedStationId: string | null;
  onStationChange: (ids: string[]) => void;
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
      <ListSubheader 
      key={`header-${region.id}`} 
      className="!text-[var(--app-text-primary)]"
      sx={{
        fontSize: '1.1rem',
        fontWeight: 'bold',
        backgroundColor: 'var(--app-section-bg) !important',
        color: 'var(--app-text-primary) !important',
        padding: '4px 16px',
        lineHeight: '1.2',
        margin: 0,
        minHeight: '32px'
      }}
      >
        {region.title}
      </ListSubheader>,
      stations
        .filter(station => region.stationIds.includes(station.id))
        .map((station) => (
          <MenuItem 
          key={station.id} 
          value={station.id} 
          className="!text-[var(--app-text-primary)]"
          sx={{
            fontSize: '0.9rem',
            fontWeight: 'normal',
            padding: '6px 16px',
            backgroundColor: 'var(--app-section-bg) !important',
            color: 'var(--app-text-secondary) !important',
            minHeight: '32px',
            '&:hover': {
              backgroundColor: 'var(--app-hover-bg) !important'
            }
          }}
          >
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
        multiple
        value={selectedStationId ? [selectedStationId] : []}
        onChange={(e: SelectChangeEvent<string>) => {
          const values = e.target.value as string[];
          console.log('[StationSelector] onStationChange called with:', value);
            onStationChange(values);
        }}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(selected as string[]).map((value: string) => (
              <Chip
                key={value}
                label={stations.find(s => s.id === value)?.name}
                onDelete={() => {
                  const newValues = (selected as string[]).filter(id => id !== value);
                  onStationChange(newValues);
                }}
                className="!bg-[var(--app-section-bg)] !text-[var(--app-text-primary)]"
              />
            ))}
          </Box>
        )}
        label="Station"
        className="w-full app-select text-[var(--app-text-primary)]"
        MenuProps={{
          classes: {
            paper: 'station-selector-menu-paper'
          },
          PaperProps: {
            className: 'station-selector-menu-paper'
          },
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left'
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left'
          }
        }}
      >
        {memoizedStationOptions}
      </Select>
    </FormControl>
  );
} 