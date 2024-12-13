import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ReactNode, useState } from 'react';

interface AccordionWrapperProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  onExpandChange?: (isExpanded: boolean) => void;
}

export default function AccordionWrapper({
  title,
  subtitle,
  children,
  defaultExpanded = true,
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
    <Accordion 
      defaultExpanded={defaultExpanded}
      className="bg-white rounded-xl shadow-md"
      onChange={(_, isExpanded) => handleChange(isExpanded)}
      sx={{
        '& .MuiAccordionSummary-root': {
          minHeight: '20px',
          padding: '0px 8px'
        },
        '& .MuiAccordionSummary-content': {
          margin: '4px 0'
        },
        '& .MuiAccordionSummary-expandIconWrapper': {
          transform: 'scale(0.8)',
          position: 'relative',
          right: 'auto',
          marginLeft: '4px'
        },
        '&:before': {
          display: 'none'
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel-content"
        id="panel-header"
        className="flex items-center justify-center"
      >
        <div className="flex items-center gap-2 w-full">
          <h3 className="section-title">
            {title}
          </h3>
        </div>
      </AccordionSummary>

      <AccordionDetails className="pt-0 px-2 pb-1">
        <h2 
          className="section-subtitle"
          dangerouslySetInnerHTML={{
             __html: subtitle.replace('\n', '<br/>')
          }}
        />
        {children}
      </AccordionDetails>
    </Accordion>
  );
} 