import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleTime, scaleLinear } from '@visx/scale';
import { Brush } from '@visx/brush';
import { format, subMonths } from 'date-fns';
import { Axis } from '@visx/axis';
import { Grid } from '@visx/grid';
import { Text } from '@visx/text';
import { useCallback } from 'react';

interface TimeBrushProps {
  width: number;
  height: number;
  selectedDate: Date;
  endDate: Date;
  onBrushChange: (start: Date, end: Date) => void;
  timeRangeData?: any[];
}

const dimensions = {
  margin: { 
    top: 20, 
    right: 20, 
    bottom: 30, 
    left: 20 
  }
};

export function TimeBrush({
  width,
  height,
  selectedDate,
  endDate,
  onBrushChange,
  timeRangeData = []
}: TimeBrushProps) {
  // Calculate the date range (1 month back from current date)
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = subMonths(end, 1);
    return { start, end };
  }, []);

  // Create scales
  const xScale = useMemo(() => {
    return scaleTime({
      domain: [dateRange.start, dateRange.end],
      range: [dimensions.margin.left, width - dimensions.margin.right],
      nice: true,
    });
  }, [dateRange, width]);

  const yScale = useMemo(() => {
    return scaleLinear({
      domain: [0, 100],
      range: [height - dimensions.margin.bottom, dimensions.margin.top],
      nice: true,
    });
  }, [height]);

  // Handle brush changes
  const handleBrushChange = useCallback((domain: [Date, Date] | null) => {
    if (domain && domain[0] && domain[1]) {
      const start = new Date(domain[0]);
      const end = new Date(domain[1]);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        onBrushChange(start, end);
      }
    }
  }, [onBrushChange]);

  return (
    <div className="w-full mb-4">
      <svg width={width} height={height}>
        <Group>
          {/* Background */}
          <rect
            width={width}
            height={height}
            fill="var(--app-toolbar-bg)"
            rx={4}
          />

          {/* Grid lines */}
          <Grid
            xScale={xScale}
            yScale={yScale}
            width={width - dimensions.margin.left - dimensions.margin.right}
            height={height - dimensions.margin.top - dimensions.margin.bottom}
            strokeDasharray="2,2"
            stroke="var(--app-text-secondary)"
            strokeOpacity={0.3}
          />

          {/* Time axis */}
          <Axis
            orientation="bottom"
            scale={xScale}
            top={height - dimensions.margin.bottom}
            numTicks={6}
            tickFormat={d => format(d as Date, 'MMM d')}
            stroke="var(--app-text-secondary)"
            tickStroke="var(--app-text-secondary)"
            tickLength={4}
            tickLabelProps={() => ({
              fill: "var(--app-text-primary)",
              fontSize: 10,
              textAnchor: 'middle',
              dy: '0.5em',
            })}
          />

          {/* Brush component */}
          <Brush
            xScale={xScale}
            yScale={yScale}
            width={width - dimensions.margin.left - dimensions.margin.right}
            height={height - dimensions.margin.top - dimensions.margin.bottom}
            margin={dimensions.margin}
            handleSize={8}
            resizeTriggerAreas={['left', 'right', 'top', 'bottom']}
            brushDirection="both"
            initialBrushPosition={{
              start: { x: xScale(selectedDate), y: dimensions.margin.top },
              end: { x: xScale(endDate), y: height - dimensions.margin.bottom }
            }}
            onChange={(domain) => {
              if (domain) {
                const start = xScale.invert(domain.x0);
                const end = xScale.invert(domain.x1);
                handleBrushChange([start, end]);
              }
            }}
            selectedBoxStyle={{
              fill: 'var(--app-hover-bg)',
              fillOpacity: 0.3,
              stroke: 'var(--app-border-hover)',
              strokeWidth: 1,
            }}
            handleStyle={{
              fill: 'var(--app-toolbar-bg)',
              stroke: 'var(--app-border-hover)',
              strokeWidth: 1,
            }}
          />
        </Group>
      </svg>
    </div>
  );
} 