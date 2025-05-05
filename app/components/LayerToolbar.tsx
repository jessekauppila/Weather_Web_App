import React from 'react';
import {
  Switch,
  FormGroup,
  FormControlLabel,
  Typography,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { LayerId, LayerState, LAYER_GROUPS } from '@/app/types/layers';

interface LayerToolbarProps {
  activeLayerState: LayerState;
  onLayerToggle: (layerId: LayerId) => void;
}

const LAYER_LABELS: Record<LayerId, string> = {
  forecastZones: 'Forecast Zones',
  windArrows: 'Wind Arrows',
  snowDepthChange: 'Snow Depth Change',
  terrain: 'Terrain',
  currentTemp: 'Current Temp.',
  minMaxTemp: 'Min/Max Temp.',
  avgMaxWind: 'Avg/Max Wind',
  snowDepthIcons: 'Snow Depth Icons',
  snowDepthColumns: 'Snow Depth Columns',
};

const GROUP_LABELS: Record<string, string> = {
  temperature: 'Temperature',
  wind: 'Wind',
  precipitation: 'Snow Depth',
  other: 'Other',
};

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

export default function LayerToolbar({ activeLayerState, onLayerToggle }: LayerToolbarProps) {
  // Group layers by their category
  const groupedLayers = Object.entries(LAYER_GROUPS).reduce((acc, [layerId, group]) => {
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(layerId as LayerId);
    return acc;
  }, {} as Record<string, LayerId[]>);

  return (
    <div className="app-toolbar" style={{ padding: '8px 12px' }}>
      <FormGroup sx={{ width: '100%' }}>
        {Object.entries(groupedLayers).map(([group, layers]) => (
          <Box key={group}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'var(--app-text-secondary)', 
                mb: 1,
                mt: group !== 'temperature' ? 2 : 0 
              }}
            >
              {GROUP_LABELS[group]}
            </Typography>
            {layers.map((layerId) => {
              const isChecked = group === 'other' 
                ? activeLayerState.other.has(layerId)
                : activeLayerState[group as keyof Omit<LayerState, 'other'>] === layerId;

              return (
                <FormControlLabel
                  key={layerId}
                  sx={formControlStyle(isChecked)}
                  control={
                    <Switch
                      size="small"
                      checked={isChecked}
                      onChange={() => onLayerToggle(layerId)}
                      sx={switchStyle}
                    />
                  }
                  label={LAYER_LABELS[layerId]}
                  labelPlacement="start"
                />
              );
            })}
          </Box>
        ))}
      </FormGroup>
    </div>
  );
} 