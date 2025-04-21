import React from 'react';
import { FormControlLabel, Switch, Box, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled switch component
const ModeSwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(22px)',
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
          '#fff',
        )}" d="M20 15.31L23.31 12 20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>')`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#0077CC' : '#0077CC',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: theme.palette.mode === 'dark' ? '#003892' : '#001e3c',
    width: 32,
    height: 32,
    '&:before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        '#fff',
      )}" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>')`,
    },
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
    borderRadius: 20 / 2,
  },
}));

export interface TimeModeSwitchProps {
  timeMode?: 'real-time' | 'historical';
  onTimeModeChange?: (mode: 'real-time' | 'historical') => void;
}

export default function TimeModeSwitch({
  timeMode = 'real-time',
  onTimeModeChange,
}: TimeModeSwitchProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onTimeModeChange) {
      onTimeModeChange(event.target.checked ? 'historical' : 'real-time');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title={timeMode === 'real-time' ? 'Switch to Historical Mode' : 'Switch to Real-time Mode'}>
        <FormControlLabel
          control={
            <ModeSwitch
              checked={timeMode === 'historical'}
              onChange={handleChange}
              inputProps={{ 'aria-label': 'time mode switch' }}
            />
          }
          label={timeMode === 'real-time' ? 'Real-time' : 'Historical'}
          sx={{
            '& .MuiFormControlLabel-label': {
              fontSize: '0.875rem',
              color: 'white',
            },
          }}
        />
      </Tooltip>
    </Box>
  );
} 