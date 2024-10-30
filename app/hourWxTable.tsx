import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';

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
  {
    category: 'Station',
    columns: [
      { key: 'Station', displayName: 'Name' }, // Change this line
      'Elevation',
    ] as Column[],
  },
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
  { category: 'RH', columns: ['Relative Humidity'] },
];

// Rest of the component similar to DayAveragesTable

type Column = string | { key: string; displayName: string };

function HourWxTable({ hourAverages }: DayAveragesTableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [sortedData, setSortedData] = useState(hourAverages.data);

  // Add sorting function
  useEffect(() => {
    const sorted = [...hourAverages.data].sort((a, b) => {
      const stationA = String(a.Station).toLowerCase();
      const stationB = String(b.Station).toLowerCase();
      return stationA.localeCompare(stationB);
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
      .attr('class', 'weatherTable');
    const tableUpdate = tableEnter.merge(table as any);

    // Update the caption text
    tableUpdate
      .selectAll('caption')
      .data([null])
      .join('caption')
      .text(hourAverages.title)
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
      .text((d) => {
        if (typeof d === 'string') {
          return d;
        } else if (d && typeof d === 'object' && 'displayName' in d) {
          return d.displayName;
        } else {
          return ''; // or some default value
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
  }, [sortedData, headerStructure]);

  return (
    <div className="table-container">
      <div ref={ref}></div>
    </div>
  );
}

export default HourWxTable;
