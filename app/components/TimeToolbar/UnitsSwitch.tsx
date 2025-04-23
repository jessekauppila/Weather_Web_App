import { Button, Popover, Stack, Typography, Switch } from '@mui/material';
import { styled } from '@mui/material/styles';

const AntSwitch = styled(Switch)(({ theme }) => ({
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
        backgroundColor: '#1890ff'
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

interface UnitsSwitchProps {
  isMetric: boolean;
  onRefresh: (newIsMetric?: boolean) => Promise<void>;
  setIsMetric: (isMetric: boolean) => void;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
  handleUnitsPopupButtonClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export function UnitsSwitch({
  isMetric,
  onRefresh,
  setIsMetric,
  anchorEl,
  handleClose,
  handleUnitsPopupButtonClick
}: UnitsSwitchProps) {
  return (
    <>
      <Button 
        variant="outlined" 
        size="small" 
        onClick={handleUnitsPopupButtonClick}
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
        Units
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
        PaperProps={{
          sx: {
            width: 'auto',
            minWidth: 'auto',
            maxWidth: 'none',
            '& .MuiPopover-paper': {
              width: 'auto'
            }
          }
        }}
      >
        <div className="p-2 sm:p-4 space-y-2 sm:space-y-4">
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography>
              Imperial
            </Typography>
            <AntSwitch 
              checked={isMetric}
              onChange={async (e) => {
                const newIsMetric = e.target.checked;
                setIsMetric(newIsMetric);
                await onRefresh(newIsMetric);
              }}
              inputProps={{ 'aria-label': 'unit switch' }}
            />
            <Typography>
              Metric
            </Typography>
          </Stack>
        </div>
      </Popover>
    </>
  );
} 