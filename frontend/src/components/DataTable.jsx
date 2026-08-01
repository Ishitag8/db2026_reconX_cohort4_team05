// TICKET-ADV114 — Compound <DataTable> with Header / Body / Pagination subcomponents.
import React, { createContext, useContext, useMemo, useState } from 'react';

const DataTableContext = createContext(null);

function useDataTable() {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error('DataTable components must be rendered inside <DataTable>');
  }
  return context;
}

export default function DataTable({ children, data = [], pageSize = 10, page: controlledPage, onPageChange, onSortChange }) {
  const [internalPage, setInternalPage] = useState(0);
  const page = controlledPage ?? internalPage;
  const setPage = onPageChange ?? setInternalPage;
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sortedData = useMemo(() => {
    if (!sortKey) {
      return data;
    }
    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const pagedData = useMemo(() => {
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const value = useMemo(
    () => ({
      rows: pagedData,
      page,
      pageSize,
      totalPages,
      sortKey,
      sortDir,
      setPage,
      setSortKey,
      setSortDir,
      onSortChange,
    }),
    [pagedData, page, pageSize, totalPages, sortKey, sortDir, onSortChange]
  );

  return (
    <DataTableContext.Provider value={value}>
      <div className="data-table">{children}</div>
    </DataTableContext.Provider>
  );
}

DataTable.Header = function Header({ columns }) {
  const { sortKey, sortDir, setSortKey, setSortDir, setPage, onSortChange } = useDataTable();

  function handleClick(key) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
    if (onSortChange) {
      onSortChange(key);
    }
  }

  return (
    <div className="data-table__header" role="row">
      {columns.map((column) => {
        const active = sortKey === column.key;
        const direction = active ? sortDir : 'asc';
        return (
          <button
            key={column.key}
            type="button"
            className={`data-table__th ${active ? 'data-table__th--active' : ''}`}
            onClick={() => handleClick(column.key)}
            aria-sort={active ? direction : 'none'}
          >
            {column.label}
          </button>
        );
      })}
    </div>
  );
};

DataTable.Body = function Body({ rows: explicitRows, render }) {
  const { rows: contextRows } = useDataTable();
  const rows = explicitRows ?? contextRows;
  return (
    <div className="data-table__body">
      {rows.map((row) => (
        <div key={row.id ?? row.tradeRef} className="data-table__row" role="row">
          {render(row)}
        </div>
      ))}
    </div>
  );
};

DataTable.Pagination = function Pagination() {
  const { page, totalPages, setPage } = useDataTable();

  return (
    <nav className="data-table__pagination" aria-label="Pagination">
      <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
        ‹
      </button>
      <span>
        {page + 1} / {totalPages}
      </span>
      <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
        ›
      </button>
    </nav>
  );
};
