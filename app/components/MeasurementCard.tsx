import React from "react";
import {
  Accordion as MuiAccordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface MeasurementCardProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  metricValue: string | null;
  metricUnit: string;
  subtitle: string;
}

const MeasurementCard = ({ 
  title, 
  isOpen, 
  onToggle, 
  metricValue, 
  metricUnit, 
  subtitle 
}: MeasurementCardProps) => {
  return (
    <MuiAccordion 
      expanded={isOpen}
      onChange={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      sx={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderRadius: '0.5rem !important',
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative',
        '&:before': {
          display: 'none',
        },
        '& .MuiAccordionSummary-root': {
          padding: '0.5rem 0.75rem',
          minHeight: 'unset',
          '& .MuiAccordionSummary-expandIconWrapper': {
            position: 'absolute',
            bottom: '0.25rem',
            right: '0.5rem',
          }
        },
        '& .MuiAccordionSummary-content': {
          margin: 0,
          marginRight: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: '0.8rem', color: '#6b7280' }} />}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ 
          width: '100%', 
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <Box>
            <Typography sx={{ fontSize: '0.625rem', color: '#4b5563', fontWeight: 500 }}>
              {title}
            </Typography>
            {metricValue === '-' ? (
              <Typography sx={{ fontSize: '0.625rem', color: '#9ca3af' }}>
                no station data
              </Typography>
            ) : (
              <Typography sx={{ fontSize: '1rem', color: '#1f2937', fontWeight: 700 }}>
                {metricValue}
                <span style={{ fontSize: '0.625rem', color: '#6b7280', marginLeft: '2px' }}>
                  {metricUnit}
                </span>
              </Typography>
            )}
          </Box>
          
          {metricValue !== '-' && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingRight: '1rem'
            }}>
              <Typography sx={{ fontSize: '0.5rem', color: '#6b7280' }}>
                {subtitle}
              </Typography>
            </Box>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails onClick={(e) => e.stopPropagation()}>
        <Box sx={{ 
          backgroundColor: '#f9fafb',
          padding: '0.5rem',
          borderRadius: '0.25rem'
        }}>
          <Typography sx={{ fontSize: '0.625rem', color: '#4b5563' }}>
            {title} Accordion Content
          </Typography>
        </Box>
      </AccordionDetails>
    </MuiAccordion>
  );
};

export default MeasurementCard;
