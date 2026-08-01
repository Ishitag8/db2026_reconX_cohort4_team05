// TICKET-ADV114 — Compound <DataTable> with Header / Body / Pagination subcomponents.
import React, { createContext, useContext } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DataTableContext = createContext({ sort: null, page: 0, size: 20 });

export default function DataTable({ children, sort, page = 0, size = 20, onSortChange }) {
  // TODO(TICKET-ADV114): wrap `children` in DataTableContext.Provider so the
  //                     Header / Body / Pagination subcomponents can read
  //                     sort/page/size/onSortChange without prop drilling.
  return (
    <DataTableContext.Provider value={{ sort, page, size, onSortChange }}>
      <div className="data-table">{children}</div>
    </DataTableContext.Provider>
  );
}

DataTable.Header = function Header({ columns }) {
  const { sort, onSortChange } = useContext(DataTableContext);
  return (
    <div className="data-table__header" role="row">
      {columns.map((c) => (
        <button
          key={c.key}
          className={`data-table__th data-table__th--${sort === c.key ? 'active' : 'idle'}`}
          onClick={() => onSortChange && onSortChange(c.key)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
};

DataTable.Body = function Body({ rows, render }) {
  return (
    <div className="data-table__body">
      {rows.map((row, i) => (
        <div key={row.id ?? i} className="data-table__row" role="row">
          {render(row, i)}
        </div>
      ))}
    </div>
  );
};

DataTable.Pagination = function Pagination({ page, totalPages, onChange }) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(0, page), safeTotalPages - 1);
  const maxVisiblePages = 4;
  const pages = [];

  if (safeTotalPages <= maxVisiblePages) {
    for (let index = 0; index < safeTotalPages; index += 1) {
      pages.push(index);
    }
  } else if (safePage <= 1) {
    for (let index = 0; index < maxVisiblePages; index += 1) {
      pages.push(index);
    }
  } else if (safePage >= safeTotalPages - 2) {
    for (let index = safeTotalPages - maxVisiblePages; index < safeTotalPages; index += 1) {
      pages.push(index);
    }
  } else {
    pages.push(safePage - 1, safePage, safePage + 1, safePage + 2);
  }

  return (
    <nav className="data-table__pagination" aria-label="Pagination">
      <button type="button" className="data-table__pagination-nav" disabled={safePage === 0} onClick={() => onChange(safePage - 1)} aria-label="Previous page">
        <ChevronLeft size={16} strokeWidth={2.4} />
        <span>Prev</span>
      </button>

      <div className="data-table__page-strip" aria-label={`Page ${safePage + 1} of ${safeTotalPages}`}>
        {pages.map((index) => (
          <button
            key={index}
            type="button"
            className={`data-table__page-btn ${index === safePage ? 'data-table__page-btn--active' : ''}`}
            aria-current={index === safePage ? 'page' : undefined}
            onClick={() => onChange(index)}
          >
            {index + 1}
          </button>
        ))}
        {safeTotalPages > maxVisiblePages && safePage < safeTotalPages - 2 && <span className="data-table__ellipsis" aria-hidden="true">…</span>}
      </div>

      <button
        type="button"
        className="data-table__pagination-nav"
        disabled={safePage >= safeTotalPages - 1}
        onClick={() => onChange(safePage + 1)}
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight size={16} strokeWidth={2.4} />
      </button>
    </nav>
  );
};
