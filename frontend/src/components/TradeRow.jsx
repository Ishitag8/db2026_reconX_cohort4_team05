import React from 'react';

function TradeRowImpl({ trade, onClick, selected = false }) {
  return (
    <div
      role="row"
      tabIndex={0}
      className={`trade-row${selected ? ' trade-row--selected' : ''}`}
      onClick={() => onClick?.(trade.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.(trade.id);
        }
      }}
    >
      <span className="trade-row__cell">{trade.tradeRef}</span>
      <span className="trade-row__cell">{trade.symbol}</span>
      <span className="trade-row__cell">{trade.qty}</span>
      <span className="trade-row__cell">{trade.price}</span>
      <span className="trade-row__cell">{trade.status}</span>
    </div>
  );
}

function areEqual(prev, next) {
  return (
    prev.trade.id === next.trade.id &&
    prev.trade.status === next.trade.status &&
    prev.trade.price === next.trade.price &&
    prev.trade.qty === next.trade.qty &&
    prev.selected === next.selected &&
    prev.onClick === next.onClick
  );
}

export const TradeRow = React.memo(TradeRowImpl, areEqual);
