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
      <Button variant="outlined" size="small" onClick={handleCutOffPopupButtonClick}>
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
      >
        <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 w-[250px] sm:w-[300px] bg-[cornflowerblue]">
          <FormControl variant="outlined" size="small" className="w-full">
            <InputLabel>Range</InputLabel>
            <Select
              value={dayRangeType}
              onChange={handleDayRangeTypeChange}
              label="Range"
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
                className="w-full"
              />
              
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleCustomTimeButtonClick}
                sx={{
                  minWidth: '120px',
                  textAlign: 'left',
                  padding: '4px 8px',
                  backgroundColor: 'transparent',
                  borderColor: '#49597F',
                  transition: 'background-color 0.15s',
                  '&:hover': {
                    backgroundColor: 'rgba(107,123,164,0.1)',
                    borderColor: '#6B7BA4'
                  },
                  marginTop: '8px'
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