// TICKET-ADV118 — useInfiniteScroll: invokes loadMore() when sentinel is visible.
import { useEffect, useRef } from 'react';

export function useInfiniteScroll(loadMore) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current || typeof loadMore !== 'function') {
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadMore();
      }
    });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  return sentinelRef;
}
