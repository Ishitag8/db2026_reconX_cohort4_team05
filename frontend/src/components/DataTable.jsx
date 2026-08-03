// TICKET-ADV114 — Compound <DataTable> with Header / Body / Pagination subcomponents.
import React, { createContext, useContext } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DataTableContext = createContext({ sort: null, page: 0, size: 20 });

export default function DataTable({ children, sort, page = 0, size = 20, onSortChange }) {
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
  const delta = 2; // Window threshold around current page
  
  const range = [];
  for (let i = 0; i < safeTotalPages; i++) {
    if (
      i === 0 ||
      i === safeTotalPages - 1 ||
      (i >= safePage - delta && i <= safePage + delta)
    ) {
      range.push(i);
    }
  }

  const pages = [];
  let prev = null;
  for (const i of range) {
    if (prev !== null) {
      if (i - prev === 2) {
        pages.push(prev + 1);
      } else if (i - prev > 2) {
        pages.push('...');
      }
    }
    pages.push(i);
    prev = i;
  }

  return (
    <nav className="data-table__pagination" aria-label="Pagination Navigation">
      <button
        type="button"
        className="data-table__pagination-nav"
        disabled={safePage === 0}
        onClick={() => onChange(safePage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} strokeWidth={2.4} />
        <span>Prev</span>
      </button>

      <div className="data-table__page-strip" aria-label={`Page ${safePage + 1} of ${safeTotalPages}`}>
        {pages.map((p, index) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${index}`} className="data-table__ellipsis" aria-hidden="true">
                …
              </span>
            );
          }
          return (
            <button
              key={`page-${p}`}
              type="button"
              className={`data-table__page-btn ${p === safePage ? 'data-table__page-btn--active' : ''}`}
              aria-current={p === safePage ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {p + 1}
            </button>
          );
        })}
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
