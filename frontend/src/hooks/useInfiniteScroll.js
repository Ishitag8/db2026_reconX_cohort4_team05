// TICKET-ADV118 — useInfiniteScroll: invokes loadMore() when sentinel is visible.

import { useEffect, useRef } from 'react';


export function useInfiniteScroll(loadMore, { rootMargin = '200px' } = {}) {

  const sentinelRef = useRef(null);

  const loadMoreRef = useRef(loadMore);



  // Keep the latest loadMore callback
  // Prevents stale closures without recreating observer
  useEffect(() => {

    loadMoreRef.current = loadMore;

  }, [loadMore]);



  // Create IntersectionObserver once
  useEffect(() => {

    const sentinel = sentinelRef.current;


    if (!sentinel) return undefined;



    const observer = new IntersectionObserver(
      (entries) => {

        const entry = entries[0];


        if (entry.isIntersecting) {

          loadMoreRef.current();

        }

      },
      {
        rootMargin
      }
    );



    observer.observe(sentinel);



    return () => {

      observer.disconnect();

    };


  }, [rootMargin]);



  return sentinelRef;

}