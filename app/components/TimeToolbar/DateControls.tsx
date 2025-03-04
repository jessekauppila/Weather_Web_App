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
        className="min-w-0 p-1"
        sx={{
          color: 'rgba(0, 0, 0, 0.54)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <ArrowBack sx={{ fontSize: 20 }} />
      </Button>

      <TextField
        type="date"
        size="small"
        value={selectedDate.toISOString().split('T')[0]}
        onChange={handleDateChange}
        className="w-[130px]"
      />

      {useCustomEndDate && (
        <TextField
          type="date"
          size="small"
          value={endDate.toISOString().split('T')[0]}
          onChange={handleEndDateChange}
          className="w-[130px]"
        />
      )}

      <Button
        onClick={handleNextDay}
        variant="text"
        size="small"
        className="min-w-0 p-1"
        sx={{
          color: 'rgba(0, 0, 0, 0.54)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <ArrowForward sx={{ fontSize: 20 }} />
      </Button>
    </div>
  );
} 