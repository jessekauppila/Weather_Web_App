import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  ListSubheader,
  Checkbox,
  ListItemText,
  Chip,
  Box
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { regions } from '../../config/regions';
import { useMemo, useCallback } from 'react';

interface StationSelectorProps {
  stations: Array<{ id: string; name: string }>;
  handleStationSelect: (stations: any[]) => void; // Now accepts array
  selectedStationIds: string[]; // Now array of IDs
  onStationSelectionChange: (stationIds: string[]) => void; // New prop for ID management
  maxSelections?: number;
}

export function StationSelector({
  stations,
  handleStationSelect,
  selectedStationIds,
  onStationSelectionChange,
  maxSelections = 8
}: StationSelectorProps) {

  const handleChange = useCallback((event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    const limitedValue = value.slice(0, maxSelections);
    
    console.log('🔴 STATION SELECTOR - Multi-selection changed:', {
      selectedIds: limitedValue,
      selectedCount: limitedValue.length,
      maxAllowed: maxSelections,
      previousSelection: selectedStationIds // Track what was selected before
    });
    
    // Update the ID array FIRST
    onStationSelectionChange(limitedValue);
    
    // Convert IDs to station objects for handleStationSelect
    const selectedStations = limitedValue.map(id => 
      stations.find(s => s.id === id)
    ).filter(Boolean);
    
    console.log('🔴 STATION SELECTOR - Calling handleStationSelect with stations:', {
      stationCount: selectedStations.length,
      stationNames: selectedStations.map(s => s?.name),
      stationObjects: selectedStations
    });
    
    handleStationSelect(selectedStations);
  }, [stations, handleStationSelect, onStationSelectionChange, maxSelections, selectedStationIds]);

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
            disabled={
              !selectedStationIds.includes(station.id) && 
              selectedStationIds.length >= maxSelections
            }
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
              },
              '&.Mui-disabled': {
                color: 'var(--app-text-secondary) !important',
                opacity: 0.5
              }
            }}
          >
            <Checkbox 
              checked={selectedStationIds.includes(station.id)}
              sx={{
                color: 'var(--app-text-secondary)',
                '&.Mui-checked': {
                  color: 'var(--app-text-primary)'
                },
                padding: '4px'
              }}
            />
            <ListItemText 
              primary={station.name}
              sx={{
                margin: 0,
                '& .MuiListItemText-primary': {
                  fontSize: '0.9rem'
                }
              }}
            />
          </MenuItem>
        ))
    ])
  ), [stations, selectedStationIds, maxSelections]);

  return (
    <FormControl variant="outlined" size="small" className="w-full">
      <InputLabel className="!text-[var(--app-text-primary)]">
        Stations ({selectedStationIds.length}/{maxSelections})
      </InputLabel>
      <Select
        multiple
        value={selectedStationIds}
        onChange={handleChange}
        label={`Stations (${selectedStationIds.length}/${maxSelections})`}
        className="w-full app-select text-[var(--app-text-primary)]"
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: '80px', overflow: 'auto' }}>
            {(selected as string[]).map((stationId) => {
              const station = stations.find(s => s.id === stationId);
              return (
                <Chip
                  key={stationId}
                  label={station?.name || stationId}
                  size="small"
                  sx={{
                    backgroundColor: 'var(--app-section-bg)',
                    color: 'var(--app-text-primary)',
                    fontSize: '0.75rem',
                    height: '24px',
                    '& .MuiChip-deleteIcon': {
                      color: 'var(--app-text-secondary)',
                      fontSize: '16px',
                      '&:hover': {
                        color: 'var(--app-text-primary)'
                      }
                    }
                  }}
                  onDelete={() => {
                    const newSelected = selectedStationIds.filter(id => id !== stationId);
                    onStationSelectionChange(newSelected);
                    
                    const selectedStations = newSelected.map(id => 
                      stations.find(s => s.id === id)
                    ).filter(Boolean);
                    handleStationSelect(selectedStations);
                  }}
                />
              );
            })}
          </Box>
        )}
        MenuProps={{
          classes: {
            paper: 'station-selector-menu-paper'
          },
          PaperProps: {
            className: 'station-selector-menu-paper',
            sx: {
              backgroundColor: 'var(--app-section-bg)',
              maxHeight: '300px'
            }
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
        sx={{
          '& .MuiSelect-select': {
            minHeight: '40px !important',
            display: 'flex !important',
            alignItems: 'flex-start !important',
            paddingTop: '8px !important'
          }
        }}
      >
        {memoizedStationOptions}
      </Select>
    </FormControl>
  );
}