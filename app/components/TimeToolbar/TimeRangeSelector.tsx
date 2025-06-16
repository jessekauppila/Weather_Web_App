import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';

interface TimeRangeSelectorProps {
  calculateCurrentTimeRange: () => string;
  handleTimeRangeChange: (event: SelectChangeEvent<string>) => void;
}

export function TimeRangeSelector({ 
  calculateCurrentTimeRange, 
  handleTimeRangeChange 
}: TimeRangeSelectorProps) {
  const currentRange = calculateCurrentTimeRange();
  console.log('⏰ TIME RANGE SELECTOR: Current range', currentRange);

  return (
    <FormControl variant="outlined" size="small" className="w-[100px] sm:w-auto">
      <InputLabel sx={{ color: 'var(--app-text-secondary)' }}>Range</InputLabel>
      <Select
        value={calculateCurrentTimeRange()}
        onChange={handleTimeRangeChange}
        label="Range"
        className="app-select"
        sx={{
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--app-border-color)'
          },
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--app-border-hover)'
            },
            backgroundColor: 'var(--app-hover-bg)'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--app-border-hover)'
          },
          '& .MuiSvgIcon-root': {
            color: 'var(--app-text-primary)'
          },
          '& .MuiSelect-select': {
            color: 'var(--app-text-primary)'
          }
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: 'var(--app-toolbar-bg)',
              color: 'var(--app-text-primary)',
              borderRadius: 'var(--app-border-radius)',
              boxShadow: 'var(--app-box-shadow)',
              border: '1px solid var(--app-border-color)',
              '& .MuiMenuItem-root': {
                color: 'var(--app-text-primary)'
              },
              '& .MuiMenuItem-root:hover': {
                backgroundColor: 'var(--app-hover-bg)'
              }
            }
          }
        }}
      >
        <MenuItem value="1">1 Day</MenuItem>
        <MenuItem value="3">3 Days</MenuItem>
        <MenuItem value="7">7 Days</MenuItem>
        <MenuItem value="14">14 Days</MenuItem>
        <MenuItem value="30">30 Days</MenuItem>
        <MenuItem value="custom">Custom</MenuItem>
      </Select>
    </FormControl>
  );
} 