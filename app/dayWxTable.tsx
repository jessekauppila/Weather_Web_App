import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DayAverage {
  [key: string]: string | number;
}

interface DayAveragesTableProps {
  dayAverages: DayAverage[];
}

function DayAveragesTable({
  dayAverages = [],
}: DayAveragesTableProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dayAverages || dayAverages.length === 0 || !ref.current)
      return;

    const table = d3
      .select(ref.current)
      .selectAll('table')
      .data([null]);
    const tableEnter = table
      .enter()
      .append('table')
      .attr('class', 'weatherTable');
    const tableUpdate = tableEnter.merge(table);

    const headers = Object.keys(dayAverages[0]);

    // Headers
    const thead = tableUpdate.selectAll('thead').data([null]);
    const theadEnter = thead.enter().append('thead');
    const theadUpdate = theadEnter.merge(thead);

    const headerRow = theadUpdate.selectAll('tr').data([null]);
    const headerRowEnter = headerRow.enter().append('tr');
    const headerRowUpdate = headerRowEnter.merge(headerRow);

    const headerCells = headerRowUpdate.selectAll('th').data(headers);
    headerCells
      .enter()
      .append('th')
      .merge(headerCells)
      .text((d) => d)
      .style('background-color', 'cornflowerblue'); // Set a background color for the header

    headerCells.exit().remove();

    // Body
    const tbody = tableUpdate.selectAll('tbody').data([null]);
    const tbodyEnter = tbody.enter().append('tbody');
    const tbodyUpdate = tbodyEnter.merge(tbody);

    const rows = tbodyUpdate.selectAll('tr').data(dayAverages);
    const rowsEnter = rows
      .enter()
      .append('tr')
      .attr('class', (d, i) =>
        i % 2 === 0 ? 'even-row' : 'odd-row'
      ); // Apply alternating row classes
    const rowsUpdate = rowsEnter.merge(rows);
    rows.exit().remove();

    const cells = rowsUpdate
      .selectAll('td')
      .data((d) =>
        headers.map((header) => ({ key: header, value: d[header] }))
      );
    cells
      .enter()
      .append('td')
      .merge(cells)
      .text((d) => d.value);
    cells.exit().remove();
  }, [dayAverages]);

  return (
    <div className="table-container">
      {' '}
      {/* Add this div for scrolling */}
      <div ref={ref}></div>
    </div>
  );
}

export default DayAveragesTable;
