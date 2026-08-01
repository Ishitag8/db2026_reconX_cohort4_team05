// TICKET-ADV114 — Compound DataTable.
// TICKET-ADV117 — useDebouncedSearch.
import React, { useCallback, useEffect, useState } from 'react';
import { withAuth } from '@components/withAuth.jsx';
import DataTable from '@components/DataTable.jsx';
import { TradeRow } from '@components/TradeRow.jsx';
import { useDebouncedSearch } from '@hooks/useDebouncedSearch.js';
import { api } from '@services/apiService.js';

function Trades() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [data, setData] = useState({ items: [], totalPages: 1 });
  const debounced = useDebouncedSearch(search, 300);

  useEffect(() => {
    const query = new URLSearchParams();
    if (debounced) {
      query.set('status', debounced);
    }
    query.set('page', String(page));
    query.set('size', '50');

    let active = true;
    api.listTrades(query.toString())
      .then((response) => {
        if (!active) return;
        const items = (response.content ?? []).map((trade) => ({
          id: trade.id,
          tradeRef: trade.tradeRef,
          symbol: trade.instrumentSymbol,
          qty: trade.quantity,
          price: trade.price,
          status: trade.status,
        }));
        setData({
          items,
          totalPages: Math.max(1, response.totalPages ?? 1),
        });
      })
      .catch(() => {
        if (!active) return;
        setData({ items: [], totalPages: 1 });
      });

    return () => {
      active = false;
    };
  }, [debounced, page]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const handleRowClick = useCallback((id) => {
    setSelectedId(id);
  }, []);

  return (
    <section>
      <h2>Trades</h2>
      <input
        aria-label="Filter by status"
        placeholder="status filter (PENDING/MATCHED/…)"
        value={search}
        onChange={(e) => handleSearchChange(e.target.value.toUpperCase())}
      />
      <DataTable data={data.items} page={page} pageSize={10} onPageChange={setPage}>
        <DataTable.Header columns={[
          { key: 'tradeRef', label: 'Ref' },
          { key: 'symbol',   label: 'Symbol' },
          { key: 'qty',      label: 'Qty' },
          { key: 'price',    label: 'Price' },
          { key: 'status',   label: 'Status' },
        ]} />
        <DataTable.Body
          render={(trade) => (
            <TradeRow
              trade={trade}
              selected={selectedId === trade.id}
              onClick={handleRowClick}
            />
          )}
        />
        <DataTable.Pagination />
      </DataTable>
    </section>
  );
}

export default withAuth(Trades);
