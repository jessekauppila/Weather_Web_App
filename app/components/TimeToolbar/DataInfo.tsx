import { Button, Popover, FormControl } from '@mui/material';
import moment from 'moment';

interface DataInfoProps {
  filteredObservationsDataHour?: {
    data: any[];
    title: string;
  } | null;
  handleRefreshButtonClick: () => void;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
  handleDataPopupButtonClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export function DataInfo({
  filteredObservationsDataHour,
  handleRefreshButtonClick,
  anchorEl,
  handleClose,
  handleDataPopupButtonClick
}: DataInfoProps) {
  return (
    <>
      <Button 
        variant="outlined" 
        size="small" 
        onClick={handleDataPopupButtonClick}
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
        Data Info
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
          <div className="text-[11px] mt-2 text-center space-y-1">
            {filteredObservationsDataHour && filteredObservationsDataHour.data.length > 0 && (
              <>
                <div>
                  Page Loaded: {moment(filteredObservationsDataHour.data[filteredObservationsDataHour.data.length - 1].date_time).format('MM/DD/YYYY h:mm A')}
                </div>
                <div className="text-[10px]">
                  (Data fetched 5 and 20 min past the hour)
                </div>
              </>
            )}
          </div>
          <FormControl variant="outlined" size="small" className="w-full">
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleRefreshButtonClick}
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
              Refresh Data
            </Button>
          </FormControl>
        </div>
      </Popover>
    </>
  );
} 