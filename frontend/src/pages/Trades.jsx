import React, { useState, useEffect, useCallback } from 'react';
import { withAuth } from '@components/withAuth.jsx';
import DataTable from '@components/DataTable.jsx';
import { useDebouncedSearch } from '@hooks/useDebouncedSearch.js';
import { api } from '@services/apiService.js';
import { TradeRow } from '@components/TradeRow.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { Calendar, Filter, Search } from 'lucide-react';

function Trades() {
  const [status, setStatus] = useState('');
  const [counterpartyId, setCounterpartyId] = useState('');
  const [fromDate, setFromDate] = useState('');
  
  const debouncedCounterpartyId = useDebouncedSearch(counterpartyId, 300);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ items: [], totalPages: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    let active = true;
    let params = `?page=${page}&size=10`;
    if (status) params += `&status=${status}`;
    if (debouncedCounterpartyId) params += `&counterpartyId=${debouncedCounterpartyId}`;
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
        toast.error(err.message || 'Failed to load trades');
        if (active) {
          setData({ items: [], totalPages: 0 });
        }
      });
    return () => {
      active = false;
    };
  }, [page, status, debouncedCounterpartyId, fromDate, toast]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const clearFilters = useCallback(() => {
    setStatus('');
    setCounterpartyId('');
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
            <p>Refine the trade set with status, counterparty, and date criteria.</p>
          </div>
          <button type="button" className="secondary filter-card__clear" onClick={clearFilters}>
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
            <label htmlFor="counterparty"><Search size={14} strokeWidth={2.2} /> Counterparty</label>
            <div className="control-shell">
              <span className="control-shell__icon"><Search size={16} strokeWidth={2.2} /></span>
              <input
                id="counterparty"
                type="number"
                placeholder="Enter Counterparty ID"
                value={counterpartyId}
                onChange={(e) => {
                  setCounterpartyId(e.target.value);
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

      {selectedId && (
        <div className="page-card selected-trade-panel">
          <div className="section-card__header section-card__header--tight">
            <div>
              <h2>Selected Trade</h2>
              <p>Current row selection remains unchanged.</p>
            </div>
          </div>
          <div className="selected-trade-panel__value">Selected Trade ID: <strong>{selectedId}</strong></div>
        </div>
      )}
    </section>
  );
}

export default withAuth(Trades);
