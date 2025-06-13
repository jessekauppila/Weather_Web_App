import React, { useRef, useEffect, useState } from 'react';
import { LinePath } from '@visx/shape';
import { Axis } from '@visx/axis';
import { Grid } from '@visx/grid';
import { Group } from '@visx/group';
import { Line } from '@visx/shape';
import { Text } from '@visx/text';
import { scaleTime, scaleLinear } from '@visx/scale';
import { extent } from 'd3-array';
import { useParentSize } from '@visx/responsive';
import moment from 'moment-timezone';
import { formatValueWithUnit } from "@/app/utils/formatValueWithUnit";
import { UnitType } from "@/app/utils/units";

// Internal styling - keeping same dimensions but self-contained
const dimensions = {
  containerHeight: 400,
  margin: { 
    top: 30, 
    right: 60, 
    bottom: 30, 
    left: 60 
  }
};

// Extended color scheme with 4 additional colors
const stationColors = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'  // 4 additional colors
];

interface StationData {
  [key: string]: any[];
}

interface MultiStationProps {
  stationData: {
    data: any[];
    stationData: StationData;
  };
  isHourly?: boolean;
  isMetric?: boolean;
}

function WxMultiStationSnowDepthVisx({ 
  stationData, 
  isHourly = false, 
  isMetric = false 
}: MultiStationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Update width when container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      const width = containerRef.current?.getBoundingClientRect().width || 0;
      setContainerWidth(width);
    };

    // Initial width
    updateWidth();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Process data similar to original component
  const processedData = Object.entries(stationData.stationData).map(([stationName, data]) => ({
    stationName,
    data: data.map(d => ({
      date: new Date(`${d.Day} ${d.Hour}`),
      snowDepth: Number(d['Total Snow Depth'].toString().split(' ')[0])
    })).filter(d => !isNaN(d.snowDepth))
  }));

  // Calculate dimensions based on actual container width
  const width = containerWidth;
  const height = dimensions.containerHeight - dimensions.margin.top - dimensions.margin.bottom;

  // Create scales
  const xScale = scaleTime({
    domain: extent(processedData.flatMap(d => d.data), d => d.date) as [Date, Date],
    range: [dimensions.margin.left, width - dimensions.margin.right],
  });

  const yScale = scaleLinear({
    domain: [
      0,
      Math.max(...processedData.flatMap(d => d.data).map(d => d.snowDepth)) * 1.2
    ],
    range: [height + dimensions.margin.top, dimensions.margin.top],
  });

  // Calculate legend layout
  const calculateLegendLayout = () => {
    const numStations = processedData.length;
    const maxItemsPerRow = 4; // Maximum number of items per row
    const itemWidth = 200; // Approximate width of each legend item
    const itemHeight = 20; // Height of each legend item
    const horizontalGap = 20; // Gap between items horizontally
    const verticalGap = 10; // Gap between rows

    const numRows = Math.ceil(numStations / maxItemsPerRow);
    const itemsPerRow = Math.min(maxItemsPerRow, numStations);
    
    return {
      numRows,
      itemsPerRow,
      itemWidth,
      itemHeight,
      horizontalGap,
      verticalGap,
      totalWidth: itemsPerRow * (itemWidth + horizontalGap),
      totalHeight: numRows * (itemHeight + verticalGap)
    };
  };

  const legendLayout = calculateLegendLayout();

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%',
        height: dimensions.containerHeight + legendLayout.totalHeight,
      }}
    >
      {containerWidth > 0 && (
        <svg 
          width={width} 
          height={dimensions.containerHeight + legendLayout.totalHeight}
        >
          {/* Title */}
          <Text
            x={width / 2}
            y={dimensions.margin.top / 2}
            textAnchor="middle"
            fontSize={16}
            fontWeight="bold"
            fill="var(--app-text-primary)"
          >
            {`Snow Depth (${isMetric ? 'cm' : 'in'})`}
          </Text>

          {/* Grid lines */}
          <Grid
            xScale={xScale}
            yScale={yScale}
            width={width - dimensions.margin.left - dimensions.margin.right}
            height={height}
            strokeDasharray="2,2"
            stroke="var(--app-text-secondary)"
            strokeOpacity={0.3}
          />

          {/* Lines for each station */}
          {processedData.map((station, i) => (
            <LinePath
              key={station.stationName}
              data={station.data}
              x={d => xScale(d.date)}
              y={d => yScale(d.snowDepth)}
              stroke={stationColors[i % stationColors.length]}
              strokeWidth={2}
            />
          ))}

          {/* Axes */}
          <Axis
            orientation="bottom"
            scale={xScale}
            top={height + dimensions.margin.top}
            tickFormat={d => moment(d as Date).format('MM/DD HH:mm')}
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
          <Axis
            orientation="left"
            scale={yScale}
            left={dimensions.margin.left}
            tickFormat={d => formatValueWithUnit(d, UnitType.PRECIPITATION, isMetric)}
            stroke="var(--app-text-secondary)"
            tickStroke="var(--app-text-secondary)"
            tickLength={4}
            tickLabelProps={() => ({
              fill: "var(--app-text-primary)",
              fontSize: 10,
              textAnchor: 'end',
              dx: '-0.5em',
              dy: '0.25em',
            })}
          />

          {/* Adaptive legend */}
          <Group 
            left={dimensions.margin.left} 
            top={height + dimensions.margin.top + 30}
          >
            {processedData.map((station, i) => {
              const row = Math.floor(i / legendLayout.itemsPerRow);
              const col = i % legendLayout.itemsPerRow;
              const x = col * (legendLayout.itemWidth + legendLayout.horizontalGap);
              const y = row * (legendLayout.itemHeight + legendLayout.verticalGap);

              return (
                <Group 
                  key={station.stationName} 
                  transform={`translate(${x}, ${y})`}
                >
                  <Line
                    from={{ x: 0, y: 5 }}
                    to={{ x: 15, y: 5 }}
                    stroke={stationColors[i % stationColors.length]}
                    strokeWidth={2}
                  />
                  <Text
                    x={20}
                    y={10}
                    fontSize={12}
                    fill="var(--app-text-primary)"
                    style={{ 
                      maxWidth: legendLayout.itemWidth - 20,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {station.stationName}
                  </Text>
                </Group>
              );
            })}
          </Group>
        </svg>
      )}
    </div>
  );
}

export default WxMultiStationSnowDepthVisx; 