import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Tooltip } from 'react-tooltip';
import moment from 'moment';

interface HourlyAverage {
  [key: string]: string | number;
}

interface DayAveragesTableProps {
  hourAverages: {
    data: HourlyAverage[];
    title: string;
  };
}

// Similar to dayWxTable.tsx but with modified column structure for hourly data
const knownCategories = [
  // {
  //   category: 'Station',
  //   columns: [
  //     { key: 'Station', displayName: 'Name' }, // Change this line
  //     'Elevation',
  //   ] as Column[],
  // },
  {
    category: 'Time',
    columns: ['Day', 'Hour'],
  },
  {
    category: 'Temperatures',
    columns: ['Air Temp'],
  },
  {
    category: 'Winds',
    columns: ['Wind Speed', 'Wind Gust', 'Wind Direction'],
  },
  {
    category: 'Precipitation',
    columns: ['Total Snow Depth', '24h Snow Depth', 'Precip Accum'],
  },
  { category: '', columns: ['Relative Humidity', 'Solar Radiation', 'API Fetch Time'] },
];

// Rest of the component similar to DayAveragesTable

type Column = string | { key: string; displayName: string };

const measurementDescriptions: Record<string, string> = {
  Time: 'Local time of the measurement',
  'Air Temp': 'Air temperature each hour in degrees Fahrenheit',
  'Wind Speed': 'Wind speed each hour in miles per hour',
  'Wind Gust':
    'Maximum wind gust over measurement period in miles per hour',
  'Wind Direction':
    'Wind direction in degrees (0 is North, 90 is East, 180 is South, 270 is West)',
  'Total Snow Depth':
    'Total depth of snow on the ground in inches. (This the depth of the snow pack from the surface of the snow to the ground.) (This is susceptible to sensor errors in summer.)',
  '24h Snow Depth':
    'Record of snow accumulated over 24hrs. (Snow board cleared in the morning to provide record of hourly snow accumulation over 24hrs.)',
  'Precip Accum':
    'Liquid precipitation accumulated during the hour in inches. Also known as "snow water equivalent".',
  'Relative Humidity': 'Relative humidity as a percentage (0-100%)',
  'Solar Radiation': 'Radiation emitted by the sun in W/m²',
  'API Fetch Time': 'Time of the acquisition of the data from the API',
};

function HourWxTable({ hourAverages }: DayAveragesTableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [sortedData, setSortedData] = useState(hourAverages.data);



  // Update sorting function
  useEffect(() => {
    const sorted = [...hourAverages.data].sort((a, b) => {
      const dateA = moment(a.Day + ' ' + a.Hour, 'MMM D h:mm A');
      const dateB = moment(b.Day + ' ' + b.Hour, 'MMM D h:mm A');
      return dateB.valueOf() - dateA.valueOf(); // Reverse chronological order
    });
    setSortedData(sorted);
  }, [hourAverages.data]);

  // Memoize the header structure to avoid recalculating on every render
  const headerStructure = useMemo(() => {
    if (hourAverages.data.length === 0) return knownCategories;

    // Get all unique keys from the data
    const allKeys = Array.from(
      new Set(hourAverages.data.flatMap(Object.keys))
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
  }, [hourAverages.data]);

  useEffect(() => {
    if (!sortedData || sortedData.length === 0 || !ref.current)
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
      .attr('class', 'weatherTable hourly-table');
    const tableUpdate = tableEnter.merge(table as any);

    // Update the caption text with unique tooltip ID
    tableUpdate
      .selectAll('caption')
      .data([null])
      .join('caption')
      .text(hourAverages.title)
      .style('caption-side', 'top')
      .attr('data-tooltip-id', 'hourly-measurement-tooltip')
      // .attr(
      //   'data-tooltip-content',
      //   'Raw weather station data'
      // );

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
      .attr('data-tooltip-id', 'hourly-measurement-tooltip')
      .attr(
        'data-tooltip-content',
        (d) => measurementDescriptions[d] || ''
      )
      .text((d: Column) => {
        if (typeof d === 'string') {
          return d;
        }
        return d.displayName;
      });

    headerCells.exit().remove();

    // Body
    const tbody = tableUpdate
      .selectAll<HTMLTableSectionElement, null>('tbody')
      .data([null]);
    const tbodyEnter = tbody.enter().append('tbody');
    const tbodyUpdate = tbodyEnter.merge(tbody as any);

    const rows = tbodyUpdate
      .selectAll<HTMLTableRowElement, HourlyAverage>('tr')
      .data(sortedData);
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
          category.columns.map((col: Column) => {
            // Add the type annotation here
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
  }, [sortedData, headerStructure, hourAverages.title]);

  useEffect(() => {
    console.log('Hourly data:', hourAverages.data);
  }, [hourAverages.data]);

  return (
    <div className="table-container" ref={ref}>
      <Tooltip
        id="hourly-measurement-tooltip"
        place="top"
        className="measurement-tooltip"
      />
    </div>
  );
}

export default HourWxTable;
