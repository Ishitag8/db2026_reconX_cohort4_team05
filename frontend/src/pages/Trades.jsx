import React, { useState, useEffect, useCallback } from 'react';
import { withAuth } from '@components/withAuth.jsx';
import DataTable from '@components/DataTable.jsx';
import { useDebouncedSearch } from '@hooks/useDebouncedSearch.js';
import { api } from '@services/apiService.js';
import { TradeRow } from '@components/TradeRow.jsx';

function Trades() {
  const [status, setStatus] = useState('');
  const [counterpartyId, setCounterpartyId] = useState('');
  const [fromDate, setFromDate] = useState('');
  
  const debouncedCounterpartyId = useDebouncedSearch(counterpartyId, 300);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ items: [], totalPages: 0 });
  const [selectedId, setSelectedId] = useState(null);

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
        if (active) {
          setData({ items: [], totalPages: 0 });
        }
      });
    return () => {
      active = false;
    };
  }, [page, status, debouncedCounterpartyId, fromDate]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  return (
    <section>
      <div className="section-header">
        <h2>Trades</h2>
        <span className="results-count">
          Showing page {page + 1} of {Math.max(1, data.totalPages)}
        </span>
      </div>

      <div className="filter-panel">
        <div className="filter-group">
          <label>Status</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <option value="">ALL STATUSES</option>
            <option value="PENDING">PENDING</option>
            <option value="MATCHED">MATCHED</option>
            <option value="UNMATCHED">UNMATCHED</option>
            <option value="DISPUTED">DISPUTED</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Counterparty ID</label>
          <input
            type="number"
            placeholder="Search Counterparty"
            value={counterpartyId}
            onChange={(e) => { setCounterpartyId(e.target.value); setPage(0); }}
          />
        </div>

        <div className="filter-group">
          <label>Trade Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      <DataTable>
        <DataTable.Header columns={[
          { key: 'tradeRef', label: 'Ref' },
          { key: 'symbol',   label: 'Symbol' },
          { key: 'qty',      label: 'Qty' },
          { key: 'price',    label: 'Price' },
          { key: 'status',   label: 'Status' },
        ]} />
        <DataTable.Body
          rows={data.items}
          render={(t) => (
            <TradeRow
              key={t.id}
              trade={t}
              onClick={handleSelect}
            />
          )}
        />
        <DataTable.Pagination
          page={page}
          totalPages={Math.max(1, data.totalPages)}
          onChange={setPage}
        />
      </DataTable>
      {selectedId && (
        <div className="selected-trade-panel">
          Selected Trade ID: <strong>{selectedId}</strong>
        </div>
      )}
    </section>
  );
}

export default withAuth(Trades);
