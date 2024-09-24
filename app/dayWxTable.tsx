//main page

import React, { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';

interface DayAverage {
  [key: string]: string | number;
}

interface DayAveragesTableProps {
  dayAverages: DayAverage[];
  title?: string; // Add this line
}

// Define the header structure for known categories
const knownCategories = [
  {
    category: 'Station',
    columns: [
      'Date Time',
      'Start Date Time',
      'End Date Time',
      'Station',
    ],
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
      'Snow Depth',
      'Snow Depth Max',
      'Snow Depth 24h Total',
      'Precip Accum One Hour',
    ],
  },
  { category: 'RH', columns: ['Relative Humidity'] },
];

function DayAveragesTable({
  dayAverages = [],
  title = 'Station Daily Weather Data', // Add a title prop with a default value
}: DayAveragesTableProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Memoize the header structure to avoid recalculating on every render
  const headerStructure = useMemo(() => {
    if (dayAverages.length === 0) return knownCategories;

    // Get all unique keys from the data
    const allKeys = Array.from(
      new Set(dayAverages.flatMap(Object.keys))
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
  }, [dayAverages]);

  useEffect(() => {
    if (!dayAverages || dayAverages.length === 0 || !ref.current)
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

    // Add caption to the table
    tableUpdate
      .selectAll('caption')
      .data([null])
      .enter()
      .append('caption')
      .text(title)
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
      .selectAll<HTMLTableHeaderCellElement, string>('th')
      .data(headers);
    headerCells
      .enter()
      .append('th')
      .merge(headerCells as any)
      .text((d) => d);
    headerCells.exit().remove();

    // Body
    const tbody = tableUpdate
      .selectAll<HTMLTableSectionElement, null>('tbody')
      .data([null]);
    const tbodyEnter = tbody.enter().append('tbody');
    const tbodyUpdate = tbodyEnter.merge(tbody as any);

    const rows = tbodyUpdate
      .selectAll<HTMLTableRowElement, DayAverage>('tr')
      .data(dayAverages);
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
      .selectAll<
        HTMLTableDataCellElement,
        { key: string; value: string | number }
      >('td')
      .data((d) =>
        headers.map((header) => ({ key: header, value: d[header] }))
      );
    cells
      .enter()
      .append('td')
      .merge(cells as any)
      .text((d) => d.value);
    cells.exit().remove();
  }, [dayAverages, title, headerStructure]); // Add title and headerStructure to the dependency array

  return (
    <div className="table-container">
      <div ref={ref}></div>
    </div>
  );
}

export default DayAveragesTable;
