import React, { useMemo } from 'react';
import { Widget } from '@deck.gl/core';
import { useWidget } from '@deck.gl/react';
import { createPortal } from 'react-dom';
import {
  Switch,
  FormGroup,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { LayerId } from '../../../page';

interface LayersWidgetProps {
  element: HTMLDivElement;
  toggleLayer: (id: LayerId) => void;
  layersState: Record<LayerId, boolean>;
}

class LayersWidget implements Widget {
  id: string;
  props: LayersWidgetProps;

  constructor(props: LayersWidgetProps) {
    this.id = 'my-widget';
    this.props = { ...props };
  }

  onAdd(): HTMLDivElement {
    return this.props.element;
  }

  setProps(props: Partial<LayersWidgetProps>): void {
    this.props = { ...this.props, ...props };
  }
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
  '& .MuiTypography-root': {
    color: isChecked ? 'var(--app-text-primary)' : 'var(--app-text-secondary)',
    fontSize: '0.75rem',
  },
});

export const MapLayerSwitchWidget: React.FC<{
  toggleLayer: (id: LayerId) => void;
  layersState: Record<LayerId, boolean>;
}> = ({ toggleLayer, layersState }) => {
  const element = useMemo(() => document.createElement('div'), []);
  useWidget(LayersWidget, {
    element,
    toggleLayer,
    layersState,
  });

  return createPortal(
    <div className="app-card" style={{
      position: 'absolute',
      top: 10,
      left: 10,
      width: '200px',
      zIndex: 1,
    }}>
      <Typography
        variant="h6"
        sx={{ fontSize: '1rem', mb: 1, color: 'inherit' }}
      >
        {/* Layers */}
      </Typography>
      <FormGroup>
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
        />
        {/* <FormControlLabel
          sx={formControlStyle(layersState.ground_for_shadow)}
          control={
            <Switch
              size="small"
              checked={layersState.ground_for_shadow}
              onChange={() => toggleLayer('ground_for_shadow')}
              sx={switchStyle}
            />
          }
          label="Ground for Shadows"
        /> */}
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
        />
      </FormGroup>
    </div>,
    element
  );
};
