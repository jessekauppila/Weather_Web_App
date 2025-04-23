import { Button, Popover, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { DayRangeType } from '../../types';

interface CutoffControlsProps {
  dayRangeType: DayRangeType;
  handleDayRangeTypeChange: (event: SelectChangeEvent<DayRangeType>) => void;
  customTime: string;
  setCustomTime: (value: string) => void;
  handleCustomTimeButtonClick: () => void;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
  handleCutOffPopupButtonClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export function CutoffControls({
  dayRangeType,
  handleDayRangeTypeChange,
  customTime,
  setCustomTime,
  handleCustomTimeButtonClick,
  anchorEl,
  handleClose,
  handleCutOffPopupButtonClick
}: CutoffControlsProps) {
  return (
    <>
      <Button 
        variant="outlined" 
        size="small" 
        onClick={handleCutOffPopupButtonClick}
        className="app-button"
        sx={{
          borderColor: 'var(--app-border-color)',
          color: 'var(--app-text-primary)',
          '&:hover': {
            borderColor: 'var(--app-border-hover)',
            backgroundColor: 'var(--app-hover-bg)'
          }
        }}
      >
        Cut Offs
      </Button>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        classes={{
          paper: 'app-popover-paper'
        }}
      >
        <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 w-[250px] sm:w-[300px]">
          <FormControl variant="outlined" size="small" className="w-full">
            <InputLabel>Range</InputLabel>
            <Select
              value={dayRangeType}
              onChange={handleDayRangeTypeChange}
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
                classes: {
                  paper: 'app-menu-paper'
                }
              }}
            >
              <MenuItem value={DayRangeType.MIDNIGHT}>Midnight to Midnight</MenuItem>
              <MenuItem value={DayRangeType.CURRENT}>Rolling 24 hours</MenuItem>
              <MenuItem value={DayRangeType.CUSTOM}>Custom</MenuItem>
            </Select>
          </FormControl>

          {dayRangeType === DayRangeType.CUSTOM && (
            <>
              <TextField
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                variant="outlined"
                size="small"
                className="w-full app-textfield"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--app-border-color)'
                  },
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--app-border-hover)'
                    },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'var(--app-hover-bg)'
                    }
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--app-border-hover)'
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--app-text-primary)'
                  },
                  '& input::-webkit-calendar-picker-indicator': {
                    filter: 'invert(0.8)'
                  }
                }}
              />
              
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleCustomTimeButtonClick}
                className="app-button"
                sx={{
                  borderColor: 'var(--app-border-color)',
                  color: 'var(--app-text-primary)',
                  minWidth: '120px',
                  textAlign: 'left',
                  padding: '4px 8px',
                  marginTop: '8px',
                  '&:hover': {
                    borderColor: 'var(--app-border-hover)',
                    backgroundColor: 'var(--app-hover-bg)'
                  }
                }}
              >
                Apply Custom Range
              </Button>
            </>
          )}
        </div>
      </Popover>
    </>
  );
} 