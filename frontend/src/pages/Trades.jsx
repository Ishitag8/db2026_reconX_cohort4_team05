import React, { useState, useEffect, useCallback } from 'react';
import { withAuth } from '@components/withAuth.jsx';
import DataTable from '@components/DataTable.jsx';
import { useDebouncedSearch } from '@hooks/useDebouncedSearch.js';
import { api } from '@services/apiService.js';
import { TradeRow } from '@components/TradeRow.jsx';
import { Calendar, Filter, Search } from 'lucide-react';

function Trades() {
  const [status, setStatus] = useState('');
  const [tradeRef, setTradeRef] = useState('');
  const [fromDate, setFromDate] = useState('');
  
  const debouncedTradeRef = useDebouncedSearch(tradeRef, 300);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ items: [], totalPages: 0 });
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let active = true;

    if (debouncedTradeRef) {
      api.searchTrade(debouncedTradeRef)
        .then(res => {
          if (active) {
            setData({ items: res || [], totalPages: res && res.length > 0 ? 1 : 0 });
          }
        })
        .catch(err => {
          // eslint-disable-next-line no-console
          console.error('Failed to search trade by ref:', err);
          if (active) {
            setData({ items: [], totalPages: 0 });
          }
        });
    } else {
      let params = `?page=${page}&size=10`;
      if (status) params += `&status=${status}`;
      if (fromDate) params += `&from=${fromDate}`;

      api.listTrades(params)
        .then(res => {
          if (active) {
            setData(res || { items: [], totalPages: 0 });
          }
        })
        .catch(err => {
          // eslint-disable-next-line no-console
          console.error('Failed to list trades:', err);
          if (active) {
            setData({ items: [], totalPages: 0 });
          }
        });
    }

    return () => {
      active = false;
    };
  }, [page, status, debouncedTradeRef, fromDate]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const clearFilters = useCallback(() => {
    setStatus('');
    setTradeRef('');
    setFromDate('');
    setSelectedId(null);
    setPage(0);
  }, []);

  return (
    <section className="trades-page">
      <section className="page-card filter-card">
        <div className="section-card__header">
          <div>
            <h2>Filters</h2>
            <p>Refine the trade set with status, trade reference, and date criteria.</p>
          </div>
          <button 
            type="button" 
            className="secondary filter-card__clear" 
            onClick={clearFilters}
            disabled={!status && !tradeRef && !fromDate}
          >
            Clear Filters
          </button>
        </div>

        <div className="filter-grid">
          <div className="filter-group">
            <label htmlFor="status"><Filter size={14} strokeWidth={2.2} /> Status</label>
            <div className="control-shell">
              <span className="control-shell__icon"><Filter size={16} strokeWidth={2.2} /></span>
              <select
                id="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="MATCHED">Matched</option>
                <option value="UNMATCHED">Unmatched</option>
                <option value="DISPUTED">Disputed</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="tradeRef"><Search size={14} strokeWidth={2.2} /> Trade Reference</label>
            <div className="control-shell">
              <span className="control-shell__icon"><Search size={16} strokeWidth={2.2} /></span>
              <input
                id="tradeRef"
                type="text"
                placeholder="EQU-20260803-1234"
                value={tradeRef}
                onChange={(e) => {
                  setTradeRef(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="tradeDate"><Calendar size={14} strokeWidth={2.2} /> Trade Date</label>
            <div className="control-shell">
              <span className="control-shell__icon"><Calendar size={16} strokeWidth={2.2} /></span>
              <input
                id="tradeDate"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="page-card table-card">
        <div className="section-card__header section-card__header--tight">
          <div>
            <h2>Trade List</h2>
            <p>Recent items are shown with inline status and key execution details.</p>
          </div>
          <span className="results-count">Showing page {page + 1} of {Math.max(1, data.totalPages)}</span>
        </div>

        <DataTable>
          <DataTable.Header columns={[
            { key: 'slNo',     label: 'Sl No' },
            { key: 'tradeRef', label: 'Trade Ref' },
            { key: 'symbol',   label: 'Symbol' },
            { key: 'qty',      label: 'Qty' },
            { key: 'price',    label: 'Price' },
            { key: 'status',   label: 'Status' },
          ]} />
          <DataTable.Body
            rows={data.items}
            render={(t, index) => (
              <TradeRow
                key={t.id}
                trade={t}
                onClick={handleSelect}
                rowNumber={(page * 10) + index + 1}
              />
            )}
          />
          <DataTable.Pagination
            page={page}
            totalPages={Math.max(1, data.totalPages)}
            onChange={setPage}
          />
        </DataTable>
      </section>
    </section>
  );
}

export default withAuth(Trades);
