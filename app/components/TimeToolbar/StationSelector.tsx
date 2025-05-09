import { FormControl, InputLabel, Select, MenuItem, ListSubheader } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { regions } from '../../config/regions';
import { useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';
import type { WeatherStation } from '../../map/map';
import { useMapData } from '../../data/map/MapDataContext';
//import { useStationDrawer } from '@/app/hooks/useStationDrawer';

interface StationSelectorProps {
  handleStationSelect: (station: WeatherStation) => void;
  selectedStation: WeatherStation | null;
}

export function StationSelector({
  handleStationSelect,
  selectedStation
}: StationSelectorProps) {
  const { mapData } = useMapData();

  // Create station list with clearer naming
  const stationList = useMemo(() => {
    const list = mapData?.stationData.features.map(f => ({
      stid: String(f.properties.Stid),
      name: f.properties.stationName
    })) || [];
    console.log('Station list created:', list);
    return list;
  }, [mapData]);

  console.log('stationList:', stationList);

  // console.log('stationList:', stationList);
  // console.log('regions:', regions);
  // regions.forEach(region => {
  //   console.log(`Region ${region.title} stationIds:`, region.stationIds);
  //   const regionStations = stationList.filter(station => region.stationIds.includes(station.stid));
  //   console.log(`Stations for region ${region.title}:`, regionStations);
  // });

  // const stationsByRegion = useMemo(() => {
  //   return regions.map(region => ({
  //     ...region,
  //     stations: stationList.filter(station => region.stationIds.includes(station.stid))
  //   }));
  // }, [stationList]);

  // console.log('Stations by region:', stationsByRegion);

  // // Create dropdown options grouped by region
  // const memoizedStationOptions = useMemo(() => {
  //   return stationsByRegion.flatMap(region => [
  //     <ListSubheader key={`header-${region.id}`}>{region.title}</ListSubheader>,
  //     ...region.stations.map(station => (
  //       <MenuItem key={station.stid} value={station.stid}>
  //         {station.name}
  //       </MenuItem>
  //     ))
  //   ]);
  // }, [stationsByRegion]);

  

  // console.log('Memoized station options:', memoizedStationOptions);

  const memoizedStationOptionsDummy = [
    <ListSubheader key="header-1" className="!text-[var(--app-text-primary)]">
      Region 1
    </ListSubheader>,
    <MenuItem key="station-1" value="station-1" className="!text-[var(--app-text-primary)]">
      Station 1
    </MenuItem>,
    <MenuItem key="station-2" value="station-2" className="!text-[var(--app-text-primary)]">
      Station 2
    </MenuItem>
  ];

  // console.log('Memoized station options dummy:', memoizedStationOptionsDummy);

  const allStationOptions = useMemo(() => (
    stationList.map(station => (
      <MenuItem key={station.stid} value={station.stid}>
        {station.name}
      </MenuItem>
    ))
  ), [stationList]);

  // Handle station selection
  const handleChange = useCallback((event: SelectChangeEvent<string>) => {
    const selectedStid = event.target.value;
    console.log('Selected station ID:', selectedStid);
    
    // Find the full station data
    const fullStationData = mapData?.stationData.features.find(
      f => f.properties.Stid === selectedStid
    );
    
    if (fullStationData) {
      const properties = fullStationData.properties;
      const formatValue = (value: number | string | null | undefined, unit: string) => {
        if (value === null || value === undefined || value === '-') return '-';
        return `${value} ${unit}`;
      };

      const weatherStation: WeatherStation = {
        Station: properties.stationName,
        'Cur Air Temp': formatValue(properties.curAirTemp, '°F'),
        '24h Snow Accumulation': formatValue(properties.snowAccumulation24h, 'in'),
        'Cur Wind Speed': properties.curWindSpeed || '-',
        'Elevation': formatValue(properties.elevation, 'ft'),
        'Stid': properties.Stid,
        'Air Temp Min': formatValue(properties.airTempMin, '°F'),
        'Air Temp Max': formatValue(properties.airTempMax, '°F'),
        'Wind Speed Avg': properties.windSpeedAvg || '-',
        'Max Wind Gust': properties.maxWindGust || '-',
        'Wind Direction': properties.windDirection || '-',
        'Total Snow Depth Change': formatValue(properties.totalSnowDepthChange, 'in'),
        'Precip Accum One Hour': properties.precipAccumOneHour || '-',
        'Total Snow Depth': formatValue(properties.totalSnowDepth, 'in'),
        'Latitude': properties.latitude.toString(),
        'Longitude': properties.longitude.toString(),
        'Relative Humidity': formatValue(properties.relativeHumidity, '%'),
        'Api Fetch Time': properties.fetchTime || new Date().toISOString()
      };
      handleStationSelect(weatherStation);
    }
  }, [handleStationSelect, mapData]);

  console.log('stationList at render:', stationList);

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
            paper: 'app-menu-paper'
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
        <MenuItem value="">All Stations</MenuItem>
        <ListSubheader key="header-1" className="!text-[var(--app-text-primary)]">
          Region 1
        </ListSubheader>
        <MenuItem key="station-1" value="station-1" className="!text-[var(--app-text-primary)]">
          Station 1
        </MenuItem>
        {stationList.length > 0 && (
          <MenuItem key={stationList[5]?.stid} value={stationList[5]?.stid}>
            {stationList[5]?.name}
          </MenuItem>
        )}
        <MenuItem key="debug" value="debug">
          {JSON.stringify(stationList)}
        </MenuItem>
      </Select>
    </FormControl>
  );
} 