import React, { useMemo, useCallback, useRef } from 'react';
import { Group } from '@visx/group';
import { scaleTime, scaleLinear } from '@visx/scale';
import { Brush } from '@visx/brush';
import { format, subMonths, startOfDay, endOfDay, isValid } from 'date-fns';
import { Axis } from '@visx/axis';
import { PatternLines } from '@visx/pattern';
import { BaseBrushState } from '@visx/brush/lib/types';

interface TimeBrushProps {
  width: number;
  height: number;
  selectedDate: Date;
  endDate: Date;
  onBrushChange: (start: Date, end: Date) => void;
}

const dimensions = {
  margin: {
    top: 10,
    right: 20,
    bottom: 30, // More space for labels
    left: 20,
  },
};

const PATTERN_ID = 'brush_pattern';

export function TimeBrush({
  width,
  height,
  selectedDate,
  endDate,
  onBrushChange,
}: TimeBrushProps) {
  const brushRef = useRef<any>(null);

  // The brush will always show the last month.
  const dateRange = useMemo(() => {
    const end = endOfDay(new Date());
    const start = startOfDay(subMonths(end, 1));
    return { start, end };
  }, []);

  const innerWidth = width - dimensions.margin.left - dimensions.margin.right;
  const innerHeight = height - dimensions.margin.top - dimensions.margin.bottom;

  const xScale = useMemo(() => scaleTime<number>({
    domain: [dateRange.start, dateRange.end],
    range: [0, innerWidth],
  }), [dateRange.start, dateRange.end, innerWidth]);

  const yScale = useMemo(() => scaleLinear<number>({
    domain: [0, 1],
    range: [innerHeight, 0],
  }), [innerHeight]);

  // This function is now called only when the user finishes dragging.
  const handleBrushEnd = useCallback((domain: BaseBrushState) => {
    if (!domain.extent.x0 || !domain.extent.x1) return;

    const startDate = xScale.invert(domain.extent.x0);
    const endDate = xScale.invert(domain.extent.x1);

    if (isValid(startDate) && isValid(endDate)) {
        console.log('🖌️ BRUSH: Time range changed', {
            start: format(startDate, 'yyyy-MM-dd HH:mm'),
            end: format(endDate, 'yyyy-MM-dd HH:mm')
        });
        onBrushChange(startDate, endDate);
    }
  }, [xScale, onBrushChange]);

  // This sets the initial highlighted area to your app's current selection.
  const initialBrushPosition = useMemo(() => {
    if (!isValid(selectedDate) || !isValid(endDate)) return undefined;
    
    const startX = xScale(selectedDate);
    const endX = xScale(endDate);

    return {
      start: { x: Math.max(0, startX) },
      end: { x: Math.min(innerWidth, endX) },
    };
  }, [selectedDate, endDate, xScale, innerWidth]);

  return (
    <div className="w-full">
      <svg width={width} height={height}>
        <PatternLines
            id={PATTERN_ID}
            height={8}
            width={8}
            stroke="var(--app-text-secondary)"
            strokeWidth={1}
            orientation={['diagonal']}
        />
        <Group left={dimensions.margin.left} top={dimensions.margin.top}>
          {/* This is the track that you can brush over */}
          <rect
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill={`url(#${PATTERN_ID})`}
            fillOpacity={0.2}
            stroke='var(--app-text-secondary)'
            strokeWidth={0.5}
          />

          <Axis
            orientation="bottom"
            scale={xScale}
            top={innerHeight}
            numTicks={width > 520 ? 10 : 5}
            tickFormat={d => format(d as Date, 'M/d')}
            stroke="var(--app-text-primary)"
            tickStroke="var(--app-text-primary)"
            tickLabelProps={() => ({
              fill: 'var(--app-text-primary)',
              fontSize: 10,
              textAnchor: 'middle',
            })}
          />
          <Brush
            ref={brushRef}
            xScale={xScale}
            yScale={yScale}
            width={innerWidth}
            height={innerHeight}
            handleSize={8}
            resizeTriggerAreas={['left', 'right']}
            brushDirection="horizontal"
            initialBrushPosition={initialBrushPosition}
            onBrushEnd={handleBrushEnd} // Important: updates only on release
            selectedBoxStyle={{
              fill: 'var(--app-hover-bg)',
              stroke: 'var(--app-border-hover)',
            }}
            useWindowMoveEvents
          />
        </Group>
      </svg>
    </div>
  );
} 