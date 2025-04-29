//main page

import React, { useRef, useEffect, useMemo, memo, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { Tooltip } from 'react-tooltip';
import { createRoot } from 'react-dom/client';
import { FixedSizeList } from 'react-window';
//import { Button } from '@mui/material';

interface DayAverage {
  [key: string]: string | number;
}

interface DayAveragesTableProps {
  dayAverages: {
    data: any[];
    title: string;
  };
  onStationClick: (stationId: string) => void;
  mode: 'summary' | 'daily';
}

// Add this near the top of your file
const measurementDescriptions: Record<string, string> = {
  'Cur Air Temp':
    'Current Air Temperature - The most recent temperature during selected period',
  'Air Temp Min':
    'Minimum Air Temperature - The lowest temperature during selected period',
  'Air Temp Max':
    'Maximum Air Temperature - The highest temperature during selected period',
  'Wind Speed Avg':
    'Average Wind Speed - Average of wind speed readings during selected period',
  'Cur Wind Speed':
    'Current Wind Speed - The most recent wind speed reading',
  'Max Wind Gust':
    'Maximum Wind Gust - The highest wind speed recorded during selected period',
  'Wind Direction':
    'Predominant Wind Direction - The average of all wind direction readings',
  'Total Snow Depth Change':
    'Net Change in Snow Depth - The difference between final and initial readings, filtering out values greater than twice the standard deviation',
  '24h Snow Accumulation':
    'Total New Snow - Calculated by adding up the positive snow changes every hour, filtering out values greater than twice the standard deviation, filtered out values less than -1',
  'Precip Accum One Hour':
    'Total Liquid Precipitation - Sum of hourly precipitation readings over the selected period',
  'Relative Humidity':
    'Current Relative Humidity - The most recent humidity reading',
  'Total Snow Depth':
    'Current Snow Depth - The last snow depth reading',
  'Solar Radiation Avg':
    'Average Solar Radiation - The average of all solar radiation readings',
    'Api Fetch Time':
    'Api Fetch Time - The most recent time that station data has been fetched from the API storing sensor data',
};

// Define the header structure for known categories
const getKnownCategories = (mode: 'summary' | 'daily') => {
  const commonCategories = [
    {
      category: 'Temperatures',
      columns: ['Cur Air Temp', 'Air Temp Min', 'Air Temp Max'],
    },
    {
      category: 'Winds',
      columns: [
        'Cur Wind Speed',
        'Wind Speed Avg',
        'Max Wind Gust',
        'Wind Direction',
      ],
    },
    {
      category: 'Estimated Precipitation',
      columns: [
        'Total Snow Depth',
        'Total Snow Depth Change',
        '24h Snow Accumulation',
        'Precip Accum One Hour'      ],
    },
    { category: '', columns: ['Relative Humidity', 'Solar Radiation Avg', 'Api Fetch Time'] },  ];

  if (mode === 'summary') {
    return [
      {
        category: 'Station',
        columns: [
          { key: 'Station', displayName: 'Name' },
          'Elevation',
        ] as Column[],
      },
      ...commonCategories,
    ];
  } else {
    return [
      {
        category: '',
        columns: ['Date'] as Column[],
      },
      ...commonCategories,
    ];
  }
};

type Column = string | { key: string; displayName: string };

// Memoized Station Button Component
const StationButton = memo(({ stationName, stid, onClick }: { 
  stationName: string, 
  stid: string,
  onClick: (stid: string) => void 
}) => {
  const handleClick = useCallback(() => {
    requestAnimationFrame(() => onClick(stid));
  }, [stid, onClick]);

  return (
    <button
      onClick={handleClick}
      className={`
        MuiButton-root 
        MuiButton-outlined 
        MuiButton-sizeSmall 
        MuiButton-outlinedPrimary
        bg-transparent
        transition-all
        duration-200
        min-w-[120px]
        text-left
        px-2
        py-1
        rounded
        border
        border-solid
        border-[#49597F]
        hover:border-2
        hover:border-[#6B7BA4]
      `}
    >
      {stationName}
    </button>
  );
});

StationButton.displayName = 'StationButton';

function DayAveragesTable({ dayAverages, onStationClick, mode }: DayAveragesTableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());

  // Memoize the header structure
  const headerStructure = useMemo(() => {
    if (dayAverages.data.length === 0) return getKnownCategories(mode);

    // Get all unique keys from the data
    const allKeys = Array.from(
      new Set(dayAverages.data.flatMap(Object.keys))
    );

    // Get all keys already included in the known categories
    const includedKeys = new Set(
      getKnownCategories(mode).flatMap((category) => category.columns)
    );

    // Find keys not yet included
    const otherKeys = allKeys.filter((key) => !includedKeys.has(key));

    // Add the 'Other' category with remaining columns
    return [
      ...getKnownCategories(mode),
      //{ category: 'Other', columns: otherKeys },
    ];
  }, [dayAverages.data, mode]);

  // Memoize the data
  const memoizedData = useMemo(() => {
    if (!dayAverages.data || dayAverages.data.length === 0) return [];
    return dayAverages.data;
  }, [dayAverages.data]);

  // Use an effect to track data changes and force refreshes
  useEffect(() => {
    if (dayAverages?.data?.length) {
      setRefreshTimestamp(Date.now());
    }
  }, [dayAverages]);

  useEffect(() => {
    if (!memoizedData.length || !ref.current) return;

    const node = ref.current;

    const renderTable = () => {
      // Instead of clearing the container, let D3's update pattern handle transitions
      // if (ref.current) {
      //   // Start with a clean slate
      //   d3.select(ref.current).selectAll('table').remove();
      // }
      
      // Batch DOM updates
      const batchUpdate = () => {
        // Use D3's enter/update/exit pattern for smooth updates
        const table = d3
          .select(node)
          .selectAll<HTMLTableElement, null>('table')
          .data([null]);
          
        const tableEnter = table
          .enter()
          .append('table')
          .attr('class', 'weatherTable');
          
        const tableUpdate = tableEnter.merge(table as any);

      // Update caption
      tableUpdate
        .selectAll('caption')
        .data([null])
        .join('caption')
        .html(dayAverages.title.replace('\n', '<br/>'))
        .style('caption-side', 'top')
        .style('white-space', 'pre-line');

      // Headers
      const thead = tableUpdate
        .selectAll<HTMLTableSectionElement, null>('thead')
        .data([null]);
        
      const theadEnter = thead.enter().append('thead');
      const theadUpdate = theadEnter.merge(thead as any);

      // Category row
      const categoryRow = theadUpdate
        .selectAll<HTMLTableRowElement, null>('tr.category-row')
        .data([null]);
        
      const categoryRowEnter = categoryRow
        .enter()
        .append('tr')
        .attr('class', 'category-row');
        
      const categoryRowUpdate = categoryRowEnter.merge(categoryRow as any);

      // Category cells
      const categoryCells = categoryRowUpdate
        .selectAll<HTMLTableHeaderCellElement, any>('th')
        .data(headerStructure);
        
      categoryCells
        .enter()
        .append('th')
        .merge(categoryCells as any)
        .attr('colspan', (d) => d.columns.length)
        .text((d) => d.category);
        
      categoryCells.exit().remove();

      // Column headers
      const headerRow = theadUpdate
        .selectAll<HTMLTableRowElement, null>('tr.column-row')
        .data([null]);
        
      const headerRowEnter = headerRow
        .enter()
        .append('tr')
        .attr('class', 'column-row');
        
      const headerRowUpdate = headerRowEnter.merge(headerRow as any);

      const headerCells = headerRowUpdate
        .selectAll<HTMLTableHeaderCellElement, any>('th')
        .data(headerStructure.flatMap((category) => category.columns));

      headerCells
        .enter()
        .append('th')
        .merge(headerCells as any)
        .attr('data-tooltip-id', 'daily-measurement-tooltip')
        .attr('data-tooltip-content', (d) => {
          const key = typeof d === 'string' ? d : d.displayName;
          return measurementDescriptions[key] || '';
        })
        .text((d) => {
          if (typeof d === 'string') return d;
          return d?.displayName || '';
        });

    headerCells.exit().remove();

      // Body
      const tbody = tableUpdate
        .selectAll<HTMLTableSectionElement, null>('tbody')
        .data([null]);
        
      const tbodyEnter = tbody.enter().append('tbody');
      const tbodyUpdate = tbodyEnter.merge(tbody as any);

      // Rows
      const rows = tbodyUpdate
        .selectAll<HTMLTableRowElement, DayAverage>('tr')
        .data(memoizedData);
        
      const rowsEnter = rows
        .enter()
        .append('tr')
        .attr('class', (d, i) => i % 2 === 0 ? 'even-row' : 'odd-row');
        
      const rowsUpdate = rowsEnter.merge(rows as any);
      rows.exit().remove();

      // Cells
      const cells = rowsUpdate
        .selectAll<HTMLTableDataCellElement, any>('td')
        .data((d) =>
          headerStructure.flatMap((category) =>
            category.columns.map((col) => {
              const key = typeof col === 'string' ? col : col.key;
              return {
                key,
                value: d[key],
                isStation: key === 'Station',
                stid: d.Stid
              };
            })
          )
        );

      const cellsEnter = cells
        .enter()
        .append('td');

      cellsEnter.merge(cells as any)
        .each(function(d) {
          const cell = d3.select(this);
          if (d.isStation && d.stid) {
            cell.html('').append(() => {
              const container = document.createElement('div');
              const root = createRoot(container);
              root.render(
                <StationButton 
                  stationName={d.value} 
                  stid={d.stid} 
                  onClick={onStationClick}
                />
              );
              return container;
            });
          } else {
            cell.text(d.value);
          }
        });

      cells.exit().remove();
    };

      // Skip requestIdleCallback and directly run the update for more reliability
      setTimeout(batchUpdate, 0);
    };

    // Force render immediately instead of using setTimeout
    renderTable();
    
    // Return a cleanup function
    return () => {
      // Only clean up on unmount, not on every update
      // This helps prevent the visible "blinking"
      if (node && !memoizedData.length) {
        d3.select(node).selectAll('*').remove();
      }
    };
  }, [memoizedData, headerStructure, onStationClick, dayAverages.title, refreshTimestamp]);

  if (memoizedData.length > 100) {
    // Use virtualized list for large datasets
    return (
      <FixedSizeList
        height={400}
        width="100%"
        itemCount={memoizedData.length}
        itemSize={35}
      >
        {({ index, style }) => (
          <div style={style}>
            {/* Your row rendering logic */}
          </div>
        )}
      </FixedSizeList>
    );
  }

  return (
    <div className="table-container" ref={ref}>
      <Tooltip
        id="daily-measurement-tooltip"
        place="top"
        className="measurement-tooltip"
      />
    </div>
  );
}

export default memo(DayAveragesTable);
