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
import { LayerId, LayerState, LAYER_GROUPS, LAYER_LABELS } from '@/app/types/layers';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface LayerToolbarProps {
  activeLayerState: LayerState;
  onLayerToggle: (layerId: LayerId) => void;
  isStationDrawerOpen: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const GROUP_LABELS: Record<string, string> = {
  temperature: 'Temperature',
  wind: 'Wind',
  precipitation: 'Precipitation',
  other: 'Other',
};

// Add ordered array to control group display order
const GROUP_ORDER = ['temperature', 'wind', 'precipitation', 'other'] as const;

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
  margin: '1px 0',
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
  isStationDrawerOpen = false,
  isOpen,
  onToggle
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mobile drawer behavior when StationDrawer opens
  useEffect(() => {
    if (isMobile && isStationDrawerOpen && isOpen) {
      onToggle();
    }
  }, [isMobile, isStationDrawerOpen, isOpen, onToggle]);

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
      onToggle();
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

  // Add function to check if a group has any active layers
  const isGroupActive = (group: string) => {
    if (group === 'other') {
      return activeLayerState.other.size > 0;
    }
    return activeLayerState[group as keyof Omit<LayerState, 'other'>].size > 0;
  };

  // console.log('LayerToolbar activeLayerState:', {
  //   temperature: Array.from(activeLayerState.temperature),
  //   wind: Array.from(activeLayerState.wind),
  //   precipitation: Array.from(activeLayerState.precipitation),
  //   other: Array.from(activeLayerState.other),
  // });

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
        onClick={onToggle}
      >
        {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </div>

      <div className="layer-toolbar-content">
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: 'var(--app-text-primary)',
            mb: 1,
            textAlign: 'center'
          }}
        >
          Layers
        </Typography>

        {/* {idx < arr.length - 1 && ( */}
                  <div className="layer-toolbar-divider" />
                {/* )} */}

        <FormGroup sx={{ width: '100%' }}>
          {GROUP_ORDER.map((group, idx, arr) => {
            const layers = groupedLayers[group] || [];
            return (
              <React.Fragment key={group}>
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: isGroupActive(group) ? 'var(--app-text-primary)' : 'var(--app-text-secondary)', 
                      mb: 0.5,
                      mt: group !== 'temperature' ? 1 : 0,
                      transition: 'color 0.2s ease-in-out',
                                  textAlign: 'center'

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
                {idx < arr.length - 1 && (
                  <div className="layer-toolbar-divider" />
                )}
              </React.Fragment>
            );
          })}
        </FormGroup>
      </div>
    </div>
  );
};

export default LayerToolbar; 