//main page

import React, { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { Tooltip } from 'react-tooltip';

interface DayAverage {
  [key: string]: string | number;
}

interface DayAveragesTableProps {
  dayAverages: {
    data: DayAverage[];
    title: string;
  };
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
    'Total New Snow - Calculated by adding up the positive snow changes every hour, filtering out values greater than twice the standard deviation and values less than -1',
  'Precip Accum':
    'Total Liquid Precipitation - Sum of hourly precipitation readings',
  // 'Precipitation':
  //   'Total Liquid Precipitation - Sum of hourly precipitation readings',
  'Relative Humidity':
    'Current Relative Humidity - The most recent humidity reading',
};

// Define the header structure for known categories
const knownCategories = [
  {
    category: 'Station',
    columns: [
      { key: 'Station', displayName: 'Name' },
      'Elevation',
    ] as Column[],
  },
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
      'Total Snow Depth Change',
      //'Snow Depth Max',
      '24h Snow Accumulation',
      'Precip Accum',
    ],
  },
  { category: 'RH', columns: ['Relative Humidity'] },
];

type Column = string | { key: string; displayName: string };

function DayAveragesTable({ dayAverages }: DayAveragesTableProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Memoize the header structure to avoid recalculating on every render
  const headerStructure = useMemo(() => {
    if (dayAverages.data.length === 0) return knownCategories;

    // Get all unique keys from the data
    const allKeys = Array.from(
      new Set(dayAverages.data.flatMap(Object.keys))
    );

    // Get all keys already included in the known categories
    const includedKeys = new Set(
      knownCategories.flatMap((category) => category.columns)
    );

    // Find keys not yet included
    const otherKeys = allKeys.filter((key) => !includedKeys.has(key));

    // Add the 'Other' category with remaining columns
    return [
      ...knownCategories,
      //{ category: 'Other', columns: otherKeys },
    ];
  }, [dayAverages.data]);

  useEffect(() => {
    if (
      !dayAverages.data ||
      dayAverages.data.length === 0 ||
      !ref.current
    )
      return;

    // Derive headers from headerStructure
    const headers = headerStructure.flatMap(
      (category) => category.columns
    );

    const table = d3
      .select(ref.current)
      .selectAll<HTMLTableElement, null>('table')
      .data([null]);
    const tableEnter = table
      .enter()
      .append('table')
      .attr('class', 'weatherTable');
    const tableUpdate = tableEnter.merge(table as any);

    // Update the caption text
    tableUpdate
      .selectAll('caption')
      .data([null])
      .join('caption')
      .text(dayAverages.title)
      .style('caption-side', 'top');

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
    const categoryRowUpdate = categoryRowEnter.merge(
      categoryRow as any
    );

    const categoryCells = categoryRowUpdate
      .selectAll<
        HTMLTableHeaderCellElement,
        (typeof headerStructure)[0]
      >('th')
      .data(headerStructure);
    categoryCells
      .enter()
      .append('th')
      .merge(categoryCells as any)
      .attr('colspan', (d) => d.columns.length)
      .text((d) => d.category);
    categoryCells.exit().remove();

    // Column headers row
    const headerRow = theadUpdate
      .selectAll<HTMLTableRowElement, null>('tr.column-row')
      .data([null]);
    const headerRowEnter = headerRow
      .enter()
      .append('tr')
      .attr('class', 'column-row');
    const headerRowUpdate = headerRowEnter.merge(headerRow as any);

    const headerCells = headerRowUpdate
      .selectAll<HTMLTableHeaderCellElement, Column>('th')
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
        if (typeof d === 'string') {
          return d;
        } else if (d && typeof d === 'object' && 'displayName' in d) {
          return d.displayName;
        } else {
          return '';
        }
      });

    headerCells.exit().remove();

    // Body
    const tbody = tableUpdate
      .selectAll<HTMLTableSectionElement, null>('tbody')
      .data([null]);
    const tbodyEnter = tbody.enter().append('tbody');
    const tbodyUpdate = tbodyEnter.merge(tbody as any);

    const rows = tbodyUpdate
      .selectAll<HTMLTableRowElement, DayAverage>('tr')
      .data(dayAverages.data);
    const rowsEnter = rows
      .enter()
      .append('tr')
      .attr('class', (d, i) =>
        i % 2 === 0 ? 'even-row' : 'odd-row'
      );
    const rowsUpdate = rowsEnter.merge(rows as any);
    rows.exit().remove();

    // Update the cells creation part
    const cells = rowsUpdate
      .selectAll<HTMLTableDataCellElement, any>('td')
      .data((d) =>
        headerStructure.flatMap((category) =>
          category.columns.map((col) => {
            const key = typeof col === 'string' ? col : col.key;
            return { key, value: d[key] };
          })
        )
      );
    cells
      .enter()
      .append('td')
      .merge(cells as any)
      .text((d) => d.value);
    cells.exit().remove();
  }, [dayAverages, headerStructure]);

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

export default DayAveragesTable;
