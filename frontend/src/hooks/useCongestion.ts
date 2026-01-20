import { useState, useEffect } from 'react';
import {
  getNearbyCongestion,
  getLowCongestionNearby,
  searchCongestionByName,
  getCongestionByPlaceCode,
  CongestionData
} from '../api/congestionApi';

/**
 * 혼잡도 데이터 관리 React Hook
 *
 * 실시간 혼잡도 데이터를 조회하고 관리하는 커스텀 훅
 *
 * @example
 * const { data, loading, error, refetch } = useCongestion({
 *   latitude: 37.5665,
 *   longitude: 126.9780,
 *   radius: 5
 * });
 */

interface UseCongestionOptions {
  latitude?: number;
  longitude?: number;
  radius?: number;
  placeCode?: string;
  searchQuery?: string;
  lowCongestionOnly?: boolean;
  autoFetch?: boolean; // 자동으로 데이터 가져올지 여부 (기본값: true)
}

interface UseCongestionReturn {
  data: CongestionData[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useCongestion = (
  options: UseCongestionOptions = {}
): UseCongestionReturn => {
  const {
    latitude,
    longitude,
    radius = 5,
    placeCode,
    searchQuery,
    lowCongestionOnly = false,
    autoFetch = true
  } = options;

  const [data, setData] = useState<CongestionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    // 조회 조건이 없으면 스킵
    if (!latitude && !longitude && !placeCode && !searchQuery) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result: CongestionData[] = [];

      // 1순위: 장소 코드로 조회
      if (placeCode) {
        const singlePlace = await getCongestionByPlaceCode(placeCode);
        result = [singlePlace];
      }
      // 2순위: 장소명 검색
      else if (searchQuery) {
        result = await searchCongestionByName(searchQuery);
      }
      // 3순위: 위치 기반 조회
      else if (latitude !== undefined && longitude !== undefined) {
        if (lowCongestionOnly) {
          result = await getLowCongestionNearby(latitude, longitude, radius);
        } else {
          result = await getNearbyCongestion(latitude, longitude, radius);
        }
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('혼잡도 조회 실패'));
      console.error('혼잡도 조회 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [latitude, longitude, radius, placeCode, searchQuery, lowCongestionOnly, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * 단일 장소 혼잡도 조회 Hook
 *
 * @example
 * const { data, loading } = useSingleCongestion('POI000001');
 */
export const useSingleCongestion = (placeCode: string | null) => {
  const [data, setData] = useState<CongestionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!placeCode) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getCongestionByPlaceCode(placeCode);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('혼잡도 조회 실패'));
        console.error('혼잡도 조회 에러:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [placeCode]);

  return { data, loading, error };
};
