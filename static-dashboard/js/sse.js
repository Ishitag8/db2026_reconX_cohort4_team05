// TICKET-ADV106 / ADV107 — EventSource live feed with prepend + slide-in animation.
(function () {
  const feed = document.getElementById('trade-feed');
  if (!feed) return;

  // Mock events structured like enterprise trade executions
  const demoEvents = [
    { tradeRef: 'EQU-20260603-0001', symbol: 'SAP.DE',      qty: 1000, price: 125.50, side: 'BUY',  status: 'MATCHED' },
    { tradeRef: 'FX-20260603-0001',  symbol: 'EUR/USD',     qty: 500000, price: 1.0852, side: 'SELL', status: 'PENDING' },
    { tradeRef: 'EQU-20260603-0002', symbol: 'AAPL',        qty: 500,  price: 178.20, side: 'BUY',  status: 'BREAK' },
    { tradeRef: 'EQU-20260603-0003', symbol: 'RELIANCE.NS', qty: 1500, price: 2450.00, side: 'BUY',  status: 'MATCHED' },
  ];

  function prepend(trade) {
    const el = document.createElement('article');
    el.className = 'trade-card trade-card--' + trade.status.toLowerCase();
    
    // Detect currency symbol dynamically based on stock exchanges
    let currency = '$';
    const sym = trade.instrumentSymbol || trade.symbol || '';
    if (sym.endsWith('.DE')) {
      currency = '€';
    } else if (sym.endsWith('.NS')) {
      currency = '₹';
    } else if (sym === 'EUR/USD') {
      currency = '$'; // FX rate is quoted in quote currency (USD)
    }
    
    // Format numeric values
    const qty = trade.quantity !== undefined ? trade.quantity : trade.qty;
    const formattedQty = Number(qty).toLocaleString();
    const formattedPrice = currency + Number(trade.price).toLocaleString(undefined, { minimumFractionDigits: 2 });
    const calculatedNotional = Number(qty) * Number(trade.price);
    const formattedNotional = currency + calculatedNotional.toLocaleString(undefined, { minimumFractionDigits: 2 });
    
    // Styling classes
    const sideClass = trade.side === 'BUY' ? 'trade-badge--buy' : 'trade-badge--sell';
    
    el.innerHTML = `
      <div class="trade-card__header">
        <strong class="trade-card__ref">${trade.tradeRef}</strong>
        <span class="trade-card__symbol">${sym}</span>
        <span class="trade-badge ${sideClass}">${trade.side}</span>
        <span class="trade-card__status">${trade.status}</span>
      </div>
      <div class="trade-card__details">
        <span class="trade-card__detail">Qty: <strong>${formattedQty}</strong></span>
        <span class="trade-card__detail">Price: <strong>${formattedPrice}</strong></span>
        <span class="trade-card__detail trade-card__detail--total">Total Value: <strong>${formattedNotional}</strong></span>
      </div>
    `;
    
    feed.prepend(el);
  }

  demoEvents.forEach((e, i) => setTimeout(() => prepend(e), 500 * i));
})();
