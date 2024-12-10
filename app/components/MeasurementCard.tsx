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
        overflow: 'visible',
        position: 'relative',
        padding: '0.25rem',
        '&:before': {
          display: 'none',
        },
        '& .MuiAccordionSummary-root': {
          padding: '0.75rem',
          minHeight: 'unset',
          width: '100%',
          '& .MuiAccordionSummary-expandIconWrapper': {
            display: 'none'
          }
        },
        '& .MuiAccordionSummary-content': {
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          width: '100%'
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ 
          fontSize: '0.8rem', 
          color: '#6b7280',
          padding: '0.25rem'
        }} />}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ 
          width: 'calc(100% - 1.5rem)',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem'
            }}>
              <Typography sx={{ fontSize: '0.625rem', color: '#4b5563', fontWeight: 500 }}>
                {title}
              </Typography>
              <ExpandMoreIcon sx={{ 
                fontSize: '0.625rem', 
                color: '#6b7280',
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s'
              }} />
            </Box>
            
            {metricValue === '-' ? (
              <Typography sx={{ fontSize: '0.625rem', color: '#9ca3af' }}>
                no station data
              </Typography>
            ) : (
              <>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'baseline',
                  gap: '2px'
                }}>
                  <Typography sx={{ fontSize: '1rem', color: '#1f2937', fontWeight: 700 }}>
                    {metricValue}
                  </Typography>
                  <Typography sx={{ fontSize: '0.625rem', color: '#6b7280' }}>
                    {metricUnit}
                  </Typography>
                </Box>

                <Typography sx={{ 
                  fontSize: '0.5rem', 
                  color: '#6b7280',
                  whiteSpace: 'nowrap'
                }}>
                  {subtitle}
                </Typography>
              </>
            )}
          </Box>
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
