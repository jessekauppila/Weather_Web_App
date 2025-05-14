import { FormControl, InputLabel, Select, MenuItem, ListSubheader } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { regions } from '../../config/regions';
import { useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';
import type { WeatherStation } from '../../map/map';
import { useMapData } from '../../data/map/MapDataContext';
import { createWeatherStationFromProperties } from '../utils/createWeatherStationFromProperties';
// import { createWeatherStationFromProperties } from '../utils/createWeatherStationFromProperties';
//import { useStationDrawer } from '@/app/hooks/useStationDrawer';

interface StationSelectorProps {
  handleStationSelect: (station: WeatherStation) => void;
  selectedStation: WeatherStation | null;
}

export function StationSelector({
  handleStationSelect,
  selectedStation
}: StationSelectorProps) {
  const { mapData, isLoading } = useMapData();
  //const stationDrawer = useStationDrawer({ mapData });


  // Create station list with clearer naming
  const stationList = useMemo(() => {
    if (!mapData?.stationData?.features) return [];
    return mapData.stationData.features.map(f => ({
      stid: String(f.properties.Stid),
      name: f.properties.stationName
    }));
  }, [mapData]);


  const allStationOptions = useMemo(() => (
    regions.map((region) => [
      <ListSubheader 
        key={`header-${region.id}`} 
        className="station-selector-header"
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
      stationList
        .filter(station => region.stationIds.includes(station.stid))
        .map(station => (
          <MenuItem 
            key={station.stid} 
            value={station.stid} 
            className="station-selector-item"
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
    ]).flat()
  ), [stationList]);

  // Handle station selection
  const handleChange = useCallback((event: SelectChangeEvent<string>) => {
    const selectedStid = event.target.value;
    console.log('StationSelector - handleChange called with ID:', selectedStid);
    
    const fullStationData = mapData?.stationData.features.find(
      f => f.properties.Stid === selectedStid
    );
    
    if (fullStationData) {
      const weatherStation = createWeatherStationFromProperties(fullStationData.properties);
      console.log('StationSelector - Created WeatherStation:', weatherStation);
      // This handleStationSelect comes from MapComponent's stationDrawer
      handleStationSelect(weatherStation);
    }
  }, [handleStationSelect, mapData]);

  // console.log('stationList at render:', stationList);

  
  if (isLoading || !mapData || !mapData.stationData) {
    return (
      <FormControl variant="outlined" size="small" className="w-full">
        <InputLabel>Station</InputLabel>
        <Select value="" label="Station" disabled>
          <MenuItem value="">Loading stations...</MenuItem>
        </Select>
      </FormControl>
    );
  }
  // console.log('Rendering Select with options:', memoizedStationOptions.length);
  return (
    <FormControl variant="outlined" size="small" className="w-full">
      <InputLabel className="!text-[var(--app-text-primary)]">Station</InputLabel>
      <Select
        value={selectedStation?.Stid ? String(selectedStation.Stid) : ''}
        onChange={handleChange}
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
        {stationList.length === 0 ? (
          <MenuItem disabled>No stations available</MenuItem>
        ) : (
          allStationOptions
        )}
      </Select>
    </FormControl>
  );
}