import React from 'react';
import {
  Switch,
  FormGroup,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { LayerId } from '../page';

interface LayerControlsProps {
  layersState: {
    forecastZones: boolean;
    windArrows: boolean;
    snowDepthChange: boolean;
    terrain: boolean;
    currentTemp: boolean;
    minMaxTemp: boolean;
    avgMaxWind: boolean;
  };
  toggleLayer: (id: LayerId) => void;
}

const switchStyle = {
  '& .MuiSwitch-switchBase': {
    color: '#424242',
    '&.Mui-checked': {
      color: '#9e9e9e',
      '& + .MuiSwitch-track': {
        backgroundColor: '#757575',
      },
    },
  },
  '& .MuiSwitch-track': {
    backgroundColor: '#616161',
  },
};

const formControlStyle = (isChecked: boolean) => ({
  margin: '2px 0',
  width: '100%',
  justifyContent: 'space-between',
  '& .MuiFormControlLabel-label': {
    marginRight: '8px',
  },
  '& .MuiTypography-root': {
    color: isChecked ? 'var(--app-text-primary)' : 'var(--app-text-secondary)',
    fontSize: '0.75rem',
  },
});

const LayerControls: React.FC<LayerControlsProps> = ({ layersState, toggleLayer }) => {
  return (
    <div className="app-toolbar" style={{ padding: '8px 12px' }}>
      <FormGroup sx={{ width: '100%' }}>
        <FormControlLabel
          sx={formControlStyle(layersState.forecastZones)}
          control={
            <Switch
              size="small"
              checked={layersState.forecastZones}
              onChange={() => toggleLayer('forecastZones')}
              sx={switchStyle}
            />
          }
          label="Forecast Zones"
          labelPlacement="start"
        />
        <FormControlLabel
          sx={formControlStyle(layersState.windArrows)}
          control={
            <Switch
              size="small"
              checked={layersState.windArrows}
              onChange={() => toggleLayer('windArrows')}
              sx={switchStyle}
            />
          }
          label="Wind Arrows"
          labelPlacement="start"
        />
        <FormControlLabel
          sx={formControlStyle(layersState.currentTemp)}
          control={
            <Switch
              size="small"
              checked={layersState.currentTemp}
              onChange={() => toggleLayer('currentTemp')}
              sx={switchStyle}
            />
          }
          label="Current Temp."
          labelPlacement="start"
        />
        <FormControlLabel
          sx={formControlStyle(layersState.minMaxTemp)}
          control={
            <Switch
              size="small"
              checked={layersState.minMaxTemp}
              onChange={() => toggleLayer('minMaxTemp')}
              sx={switchStyle}
            />
          }
          label="Min/Max Temp."
          labelPlacement="start"
        />
        <FormControlLabel
          sx={formControlStyle(layersState.snowDepthChange)}
          control={
            <Switch
              size="small"
              checked={layersState.snowDepthChange}
              onChange={() => toggleLayer('snowDepthChange')}
              sx={switchStyle}
            />
          }
          label="Snow Depth Change"
          labelPlacement="start"
        />
        <FormControlLabel
          sx={formControlStyle(layersState.terrain)}
          control={
            <Switch
              size="small"
              checked={layersState.terrain}
              onChange={() => toggleLayer('terrain')}
              sx={switchStyle}
            />
          }
          label="Terrain"
          labelPlacement="start"
        />
      </FormGroup>
    </div>
  );
};

export default LayerControls; 