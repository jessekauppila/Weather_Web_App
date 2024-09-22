import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DayAverage {
  [key: string]: string | number;
}

interface DayAveragesTableProps {
  dayAverages: DayAverage[];
  title?: string; // Add this line
}

function DayAveragesTable({
  dayAverages = [],
  title = 'Station Daily Weather Data', // Add a title prop with a default value
}: DayAveragesTableProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dayAverages || dayAverages.length === 0 || !ref.current)
      return;

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
      .style('caption-side', 'top')
      .style('font-weight', 'bold')
      .style('font-size', '1.2em')
      .style('margin-bottom', '10px');

    const headers = Object.keys(dayAverages[0]);

    // Headers
    const thead = tableUpdate
      .selectAll<HTMLTableSectionElement, null>('thead')
      .data([null]);
    const theadEnter = thead.enter().append('thead');
    const theadUpdate = theadEnter.merge(thead as any);

    const headerRow = theadUpdate
      .selectAll<HTMLTableRowElement, null>('tr')
      .data([null]);
    const headerRowEnter = headerRow.enter().append('tr');
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
  }, [dayAverages, title]); // Add title to the dependency array

  return (
    <div className="table-container">
      <div ref={ref}></div>
    </div>
  );
}

export default DayAveragesTable;
