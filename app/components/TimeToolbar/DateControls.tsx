import { Button, TextField } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

interface DateControlsProps {
  selectedDate: Date;
  endDate: Date;
  handleDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleEndDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handlePrevDay: () => void;
  handleNextDay: () => void;
  useCustomEndDate: boolean;
}

export function DateControls({
  selectedDate,
  endDate,
  handleDateChange,
  handleEndDateChange,
  handlePrevDay,
  handleNextDay,
  useCustomEndDate
}: DateControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handlePrevDay}
        variant="text"
        size="small"
        className="min-w-0 p-1 app-button"
        sx={{
          color: 'var(--app-border-color)',
          minWidth: '30px'
        }}
      >
        <ArrowBack sx={{ fontSize: 20 }} />
      </Button>

      <TextField
        type="date"
        size="small"
        value={selectedDate.toISOString().split('T')[0]}
        onChange={handleDateChange}
        className="w-[140px] app-textfield"
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

      {useCustomEndDate && (
        <TextField
          type="date"
          size="small"
          value={endDate.toISOString().split('T')[0]}
          onChange={handleEndDateChange}
          className="w-[130px] app-textfield"
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
      )}

      <Button
        onClick={handleNextDay}
        variant="text"
        size="small"
        className="min-w-0 p-1 app-button"
        sx={{
          color: 'var(--app-border-color)',
          minWidth: '30px'
        }}
      >
        <ArrowForward sx={{ fontSize: 20 }} />
      </Button>
    </div>
  );
} 