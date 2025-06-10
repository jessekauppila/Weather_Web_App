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
  selectedStationIds: string[];
  onStationSelectionChange: (stationIds: string[]) => void;
  handleStationSelect: (stations: any[]) => void;
  maxSelections?: number;
}

export function StationSelector({
  stations,
  selectedStationIds,
  onStationSelectionChange,
  handleStationSelect,
  maxSelections = 5
}: StationSelectorProps) {

  // Handle selection changes
  const handleChange = useCallback((event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    
    // Limit the number of selections
    const limitedValue = value.slice(0, maxSelections);
    
    console.log('Station selection changed:', limitedValue);
    
    // Update the selected station IDs
    onStationSelectionChange(limitedValue);
    
    // Convert IDs back to station objects for the drawer
    const selectedStations = limitedValue
      .map(id => stations.find(s => s.id === id))
      .filter(Boolean);
    
    handleStationSelect(selectedStations);
  }, [stations, onStationSelectionChange, handleStationSelect, maxSelections]);

  // Create the grouped station options with checkboxes
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
            <Checkbox 
              checked={selectedStationIds.includes(station.id)}
              sx={{
                color: 'var(--app-text-secondary)',
                '&.Mui-checked': {
                  color: 'var(--app-text-primary)',
                },
                padding: '4px',
                marginRight: '8px'
              }}
            />
            <ListItemText 
              primary={station.name}
              sx={{
                color: 'var(--app-text-secondary) !important',
                '& .MuiTypography-root': {
                  color: 'var(--app-text-secondary) !important'
                }
              }}
            />
          </MenuItem>
        ))
    ])
  ), [stations, selectedStationIds]);

  // Custom render function for selected values (chips)
  const renderValue = useCallback((selected: string[]) => {
    if (selected.length === 0) return '';
    
    if (selected.length === 1) {
      // Single selection: show just the name (cleaner for single selection)
      const station = stations.find(s => s.id === selected[0]);
      return station?.name || selected[0];
    }
    
    // Multiple selections: show as chips
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {selected.map((stationId) => {
          const station = stations.find(s => s.id === stationId);
          return (
            <Chip
              key={stationId}
              label={station?.name || stationId}
              size="small"
              sx={{
                backgroundColor: 'var(--app-section-bg)',
                color: 'var(--app-text-primary)',
                border: '1px solid var(--app-border-color)',
                maxWidth: '120px',
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                },
                '& .MuiChip-deleteIcon': {
                  color: 'var(--app-text-secondary)',
                  '&:hover': {
                    color: 'var(--app-text-primary)'
                  }
                }
              }}
              onDelete={(e) => {
                e.stopPropagation(); // Prevent dropdown from opening
                // Remove this station from selection
                const newSelection = selected.filter(id => id !== stationId);
                onStationSelectionChange(newSelection);
                
                // Update the station objects
                const selectedStations = newSelection
                  .map(id => stations.find(s => s.id === id))
                  .filter(Boolean);
                handleStationSelect(selectedStations);
              }}
            />
          );
        })}
      </Box>
    );
  }, [stations, onStationSelectionChange, handleStationSelect]);

  // Dynamic label
  const getLabel = () => {
    if (selectedStationIds.length === 0) return 'Select Stations';
    if (selectedStationIds.length === 1) return 'Station';
    return `Stations (${selectedStationIds.length}/${maxSelections})`;
  };

  return (
    <FormControl variant="outlined" size="small" className="w-full">
      <InputLabel 
        className="!text-[var(--app-text-primary)]"
        sx={{ color: 'var(--app-text-primary) !important' }}
      >
        {getLabel()}
      </InputLabel>
      <Select
        multiple
        value={selectedStationIds}
        onChange={handleChange}
        label={getLabel()}
        renderValue={renderValue}
        className="w-full app-select text-[var(--app-text-primary)]"
        MenuProps={{
          classes: {
            paper: 'station-selector-menu-paper'
          },
          PaperProps: {
            className: 'station-selector-menu-paper',
            sx: {
              maxHeight: 400,
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
      >
        {memoizedStationOptions}
      </Select>
      
      {selectedStationIds.length >= maxSelections && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--app-text-secondary)', 
          marginTop: '4px',
          textAlign: 'center'
        }}>
          Maximum {maxSelections} stations selected
        </div>
      )}
    </FormControl>
  );
} 