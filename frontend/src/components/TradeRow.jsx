// TICKET-ADV119 — React.memo on <TradeRow />
import React from 'react';

function TradeRowImpl({ trade, onClick, rowNumber }) {
  const sym = trade.instrumentSymbol || trade.symbol || '';
  const qty = trade.quantity !== undefined ? trade.quantity : trade.qty;

  return (
    <div className="trade-row-content" onClick={() => onClick && onClick(trade.id)}>
      <span className="trade-row__index">{rowNumber}</span>
      <span><strong>{trade.tradeRef}</strong></span>
      <span>{sym}</span>
      <span>{qty}</span>
      <span>{trade.price}</span>
      <span><span className={`status-pill ${trade.status.toLowerCase()}`}>{trade.status}</span></span>
    </div>
  );
}

function areEqual(prev, next) {
  return prev.trade.id            === next.trade.id
      && prev.trade.status        === next.trade.status
      && prev.trade.price         === next.trade.price
      && prev.rowNumber           === next.rowNumber
      && prev.onClick             === next.onClick;
}

export const TradeRow = React.memo(TradeRowImpl, areEqual);
