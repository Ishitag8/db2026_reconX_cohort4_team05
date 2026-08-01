// File: static-dashboard/js/trades.js — TICKET-ADV106 sort + resize
(function () {
  const table = document.getElementById('trades-table');
  const tbody = document.getElementById('trades-tbody');
  let rows = []; // canonical data — sort operates on this

  // Fallback mock data in case the backend is down or returns 401
  const mockTrades = [
    { tradeRef: 'EQU-20260603-0001', symbol: 'SAP.DE',      qty: 1000, price: 125.50, side: 'BUY',  status: 'MATCHED' },
    { tradeRef: 'FX-20260603-0001',  symbol: 'EUR/USD',     qty: 500000, price: 1.0852, side: 'SELL', status: 'PENDING' },
    { tradeRef: 'EQU-20260603-0002', symbol: 'AAPL',        qty: 500,  price: 178.20, side: 'BUY',  status: 'BREAK' },
    { tradeRef: 'EQU-20260603-0003', symbol: 'RELIANCE.NS', qty: 1500, price: 2450.00, side: 'BUY',  status: 'MATCHED' },
    { tradeRef: 'EQU-20260603-0004', symbol: 'INFY.NS',     qty: 800,  price: 1540.25, side: 'SELL', status: 'MATCHED' },
    { tradeRef: 'EQU-20260603-0005', symbol: 'MSFT',        qty: 300,  price: 420.50, side: 'BUY',  status: 'BREAK' },
    { tradeRef: 'EQU-20260603-0006', symbol: 'TSLA',        qty: 1200, price: 185.00, side: 'SELL', status: 'PENDING' },
    { tradeRef: 'EQU-20260603-0007', symbol: 'BMW.DE',      qty: 600,  price: 92.40,  side: 'BUY',  status: 'MATCHED' }
  ];

  // ---------- sortable columns ----------
  table.querySelectorAll('thead th').forEach(th => {
    th.addEventListener('click', (e) => {
      if (e.target.classList.contains('resize-handle')) return; // ignore resize clicks
      const col = th.dataset.col;
      const type = th.dataset.type || 'string';
      const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';

      // clear all other sort markers, set this one
      table.querySelectorAll('thead th').forEach(o => o.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', dir);

      const mult = dir === 'ascending' ? 1 : -1;
      rows.sort((a, b) => {
        let av = a[col], bv = b[col];
        if (col === 'symbol') {
          av = a.instrumentSymbol || a.symbol || '';
          bv = b.instrumentSymbol || b.symbol || '';
        } else if (col === 'quantity') {
          av = a.quantity !== undefined ? a.quantity : a.qty;
          bv = b.quantity !== undefined ? b.quantity : b.qty;
        }
        if (type === 'number') return (Number(av) - Number(bv)) * mult;
        return String(av).localeCompare(String(bv)) * mult;
      });
      renderRows();
    });
  });

  // ---------- resizable columns ----------
  table.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const th = handle.closest('th');
      const startX = e.clientX;
      const startWidth = th.offsetWidth;

      // Listen on DOCUMENT so the drag survives leaving the handle.
      function onMove(ev) { 
        th.style.width = (startWidth + ev.clientX - startX) + 'px'; 
      }
      function onUp() { 
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp); 
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });

  function renderRows() {
    tbody.innerHTML = rows.map(r => {
      // Format pricing symbols dynamically
      let currency = '$';
      const sym = r.instrumentSymbol || r.symbol || '';
      if (sym.endsWith('.DE')) currency = '€';
      else if (sym.endsWith('.NS')) currency = '₹';

      const qty = r.quantity !== undefined ? r.quantity : r.qty;
      const formattedQty = Number(qty).toLocaleString();
      const formattedPrice = currency + Number(r.price).toLocaleString(undefined, { minimumFractionDigits: 2 });
      
      const sideClass = r.side === 'BUY' ? 'trade-badge--buy' : 'trade-badge--sell';
      const statusClass = 'trade-status-pill trade-status-pill--' + r.status.toLowerCase();

      return `
        <tr>
          <td><strong style="font-family: monospace; font-size:13px;">${r.tradeRef}</strong></td>
          <td><span class="trade-card__symbol">${sym}</span></td>
          <td style="font-family: monospace; font-size:13px;">${formattedQty}</td>
          <td style="font-family: monospace; font-size:13px;">${formattedPrice}</td>
          <td><span class="trade-badge ${sideClass}">${r.side}</span></td>
          <td><span class="${statusClass}">${r.status}</span></td>
        </tr>`;
    }).join('');
  }

  // Attempt backend API load (hits REST API) with dynamic fallback
  const token = localStorage.getItem('reconx-token'); // Check if a JWT is present
  const headers = {};
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  fetch('/api/v1/trades?size=200', { headers })
    .then(res => {
      if (!res.ok) throw new Error('Backend unauthorized or offline');
      return res.json();
    })
    .then(data => { 
      rows = data.content || data; 
      renderRows(); 
    })
    .catch(() => {
      // Graceful fallback to mock trades
      rows = [...mockTrades];
      renderRows();
    });
})();
