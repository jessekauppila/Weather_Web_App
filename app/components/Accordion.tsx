import React from "react";

interface AccordionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  metricValue: string | null;
  metricUnit: string;
  subtitle: string;
}

const Accordion = ({ 
  title, 
  isOpen, 
  onToggle, 
  metricValue, 
  metricUnit, 
  subtitle 
}: AccordionProps) => {
  return (
    <div className="station-metric">
      <div className="metric-header">
        <p className="metric-label">{title}</p>
        <button 
          className={`metric-caret ${isOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          ▼
        </button>
      </div>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        <div className="accordion-inner">
          {title} Accordion
        </div>
      </div>
      {metricValue === '-' ? (
        <p className="no-data">no station data</p>
      ) : (
        <>
          <p className="metric-value">
            {metricValue}
            <span className="metric-unit">{metricUnit}</span>
          </p>
          <p className="metric-subtitle">{subtitle}</p>
        </>
      )}
    </div>
  );
};

export default Accordion;
