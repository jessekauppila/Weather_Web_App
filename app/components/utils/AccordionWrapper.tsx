import React from 'react';
import { styled } from '@mui/material/styles';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ReactNode, useState } from 'react';

// Custom styled components
const StyledAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: 'transparent',
  color: 'var(--app-text-primary, #c6c6c6)',
  boxShadow: 'none',
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: 0,
  },
  border: '1px solid rgba(97, 97, 97, 0.3)'
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  padding: '0 0.5rem',
  minHeight: '48px',
  borderBottom: '1px solid rgba(97, 97, 97, 0.5)',
  background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.4) 100%)',
  '&.Mui-expanded': {
    minHeight: '48px',
  },
  '& .MuiAccordionSummary-content': {
    margin: '0.5rem 0',
    '&.Mui-expanded': {
      margin: '0.5rem 0',
    }
  },
  '& .MuiSvgIcon-root': {
    color: 'var(--app-text-primary, #c6c6c6)',
  }
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: '0.75rem 0.75rem 0.25rem',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  color: 'var(--app-text-primary, #c6c6c6)',
  borderTop: '1px solid rgba(97, 97, 97, 0.2)'
}));

interface AccordionWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  onExpandChange?: (isExpanded: boolean) => void;
}

export default function AccordionWrapper({
  title,
  subtitle,
  children,
  defaultExpanded = false,
  onExpandChange
}: AccordionWrapperProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleChange = (isExpanded: boolean) => {
    setExpanded(isExpanded);
    if (onExpandChange) {
      onExpandChange(isExpanded);
    }
  };

  return (
    <StyledAccordion defaultExpanded={defaultExpanded}>
      <StyledAccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel-content"
        id="panel-header"
      >
        <div>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontSize: '0.875rem', 
              fontWeight: 600,
              color: 'var(--app-text-primary, #c6c6c6)'
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                color: 'var(--app-text-secondary, #757575)',
                fontSize: '0.675rem' 
              }}
            >
              {subtitle}
            </Typography>
          )}
        </div>
      </StyledAccordionSummary>
      <StyledAccordionDetails>
        {children}
      </StyledAccordionDetails>
    </StyledAccordion>
  );
} 