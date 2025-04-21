import React from 'react';
import { FormControlLabel, Switch, Box, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';

const ModeSwitch = styled(Switch)(({ theme }) => ({
  width: 28,
  height: 16,
  padding: 0,
  display: 'flex',
  '&:active': {
    '& .MuiSwitch-thumb': {
      width: 15,
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      transform: 'translateX(9px)',
    },
  },
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(12px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#1890ff',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
    width: 12,
    height: 12,
    borderRadius: 6,
    transition: theme.transitions.create(['width'], {
      duration: 200,
    }),
  },
  '& .MuiSwitch-track': {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: 'rgba(0,0,0,.25)',
    boxSizing: 'border-box',
  },
}));

interface TableModeSwitchProps {
  tableMode: 'summary' | 'daily';
  onTableModeChange: (mode: 'summary' | 'daily') => void;
}

export default function TableModeSwitch({ tableMode, onTableModeChange }: TableModeSwitchProps) {
  const handleChange = () => {
    const newMode = tableMode === 'summary' ? 'daily' : 'summary';
    onTableModeChange(newMode);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title={tableMode === 'summary' ? "Switch to Daily View" : "Switch to Summary View"}>
        <FormControlLabel
          control={
            <ModeSwitch 
              checked={tableMode === 'daily'} 
              onChange={handleChange}
            />
          }
          label={tableMode === 'summary' ? "Summary" : "Daily"}
          labelPlacement="end"
          sx={{ 
            margin: 0,
            '& .MuiFormControlLabel-label': {
              fontSize: '0.75rem',
              color: 'white'
            }
          }}
        />
      </Tooltip>
    </Box>
  );
} 