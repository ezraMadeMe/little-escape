import { useEffect, useRef, RefObject } from 'react';

interface UseInfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
}

/**
 * IntersectionObserver를 사용한 무한 스크롤 훅
 * @param onLoadMore - 더 많은 데이터를 로드하는 콜백 함수
 * @param hasMore - 더 많은 데이터가 있는지 여부
 * @param loading - 현재 로딩 중인지 여부
 * @param threshold - 관찰 요소가 몇 %만큼 보일 때 트리거할지 (0.0 ~ 1.0)
 * @returns 마지막 요소에 연결할 ref
 */
export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  loading,
  threshold = 0.5,
}: UseInfiniteScrollProps): RefObject<HTMLDivElement> => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 타겟이 화면에 보이고, 로딩 중이 아니며, 더 많은 데이터가 있을 때
        if (entries[0].isIntersecting && !loading && hasMore) {
          onLoadMore();
        }
      },
      {
        threshold,
        rootMargin: '100px', // 100px 전에 미리 로드
      }
    );

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [onLoadMore, hasMore, loading, threshold]);

  return observerTarget;
};
