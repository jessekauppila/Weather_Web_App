import React from 'react';
import { WIND_SPEED_RANGES, WIND_DESCRIPTIONS } from './windRoseUtils';

interface WindRoseLegendProps {
  className?: string;
}

const WindRoseLegend: React.FC<WindRoseLegendProps> = ({ className = '' }) => {
  return (
    <div className={`wind-rose-legend ${className}`}>
      <h4 className="text-md font-semibold mb-3 text-[var(--app-text-primary)]">
        Wind Speed Legend
      </h4>
      
      {/* Speed Range Legend */}
      <div className="mb-4">
        {WIND_SPEED_RANGES.slice().reverse().map((range, index) => (
          <div key={range.label} className="flex items-center mb-2">
            <div 
              className="w-3 h-3 mr-3 border border-gray-400" 
              style={{ backgroundColor: range.color }}
            />
            <span className="text-sm text-[var(--app-text-secondary)]">
              {range.min}-{range.max} mph{' '}
              <span className="font-bold">{range.description}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Detailed Descriptions */}
      <div className="text-xs text-[var(--app-text-secondary)] space-y-2">
        {Object.entries(WIND_DESCRIPTIONS).map(([category, description]) => (
          <div key={category}>
            <span className="font-bold">{category} </span>
            <span>{description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WindRoseLegend; 