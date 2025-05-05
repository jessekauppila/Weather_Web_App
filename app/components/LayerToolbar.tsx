import React, { useState, useEffect, useRef } from 'react';
import {
  Switch,
  FormGroup,
  FormControlLabel,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { LayerId, LayerState, LAYER_GROUPS } from '@/app/types/layers';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface LayerToolbarProps {
  activeLayerState: LayerState;
  onLayerToggle: (layerId: LayerId) => void;
  isStationDrawerOpen?: boolean;
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

const LayerToolbar: React.FC<LayerToolbarProps> = ({ 
  activeLayerState, 
  onLayerToggle,
  isStationDrawerOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mobile drawer behavior when StationDrawer opens
  useEffect(() => {
    if (isMobile && isStationDrawerOpen) {
      setIsOpen(false);
    }
  }, [isMobile, isStationDrawerOpen]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    if (swipeDistance > 50) { // Swipe right threshold
      setIsOpen(false);
    }
  };

  // Group layers by their category
  const groupedLayers = Object.entries(LAYER_GROUPS).reduce((acc, [layerId, group]) => {
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(layerId as LayerId);
    return acc;
  }, {} as Record<string, LayerId[]>);

  return (
    <div 
      ref={drawerRef}
      className={`layer-toolbar ${isOpen ? 'open' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left handle */}
      <div 
        className="layer-toolbar-handle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </div>

      <div className="layer-toolbar-content">
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: 'var(--app-text-primary)',
            mb: 2,
            textAlign: 'center'
          }}
        >
          Layer Controls
        </Typography>

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
                  : activeLayerState[group as keyof Omit<LayerState, 'other'>].has(layerId);

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
    </div>
  );
};

export default LayerToolbar; 