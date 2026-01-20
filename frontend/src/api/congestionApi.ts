import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * 혼잡도 데이터 타입 정의
 */
export interface CongestionData {
  placeCode: string;
  placeName: string;
  areaName: string;
  latitude: number;
  longitude: number;
  congestionLevel: number; // 1-5
  congestionText: string; // "여유", "보통", "혼잡" 등
  badgeColor: string; // "green", "blue", "yellow", "orange", "red"
  currentPopulation: number | null;
  weatherCondition: string | null;
  temperature: number | null;
  lastUpdated: string; // ISO 8601 datetime
  isValid: boolean;
}

/**
 * 혼잡도 통계 타입 정의
 */
export interface CongestionStats {
  totalPlaces: number;
  smoothCount: number;
  normalCount: number;
  slightlyCrowdedCount: number;
  crowdedCount: number;
  veryCrowdedCount: number;
  averageCongestionLevel: number;
}

/**
 * 특정 장소의 혼잡도 조회
 *
 * @param placeCode - 장소 코드 (예: "POI000001")
 * @returns 혼잡도 데이터
 *
 * @example
 * const congestion = await getCongestionByPlaceCode('POI000001');
 * console.log(congestion.congestionText); // "보통"
 */
export const getCongestionByPlaceCode = async (
  placeCode: string
): Promise<CongestionData> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/seoul/congestion/${placeCode}`
  );
  return response.data;
};

/**
 * 반경 내 모든 장소의 혼잡도 조회
 *
 * @param latitude - 사용자 위도
 * @param longitude - 사용자 경도
 * @param radiusKm - 검색 반경 (km, 기본값: 5)
 * @returns 혼잡도 데이터 배열 (거리순 정렬)
 *
 * @example
 * const nearbyPlaces = await getNearbyCongestion(37.5665, 126.9780, 5);
 * nearbyPlaces.forEach(place => {
 *   console.log(`${place.placeName}: ${place.congestionText}`);
 * });
 */
export const getNearbyCongestion = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<CongestionData[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/seoul/congestion/nearby`,
    {
      params: { lat: latitude, lng: longitude, radius: radiusKm }
    }
  );
  return response.data;
};

/**
 * 반경 내 혼잡도 낮은 장소만 조회
 *
 * @param latitude - 사용자 위도
 * @param longitude - 사용자 경도
 * @param radiusKm - 검색 반경 (km, 기본값: 5)
 * @returns 혼잡도 2(보통) 이하 장소 배열
 *
 * @example
 * const uncrowdedPlaces = await getLowCongestionNearby(37.5665, 126.9780, 3);
 */
export const getLowCongestionNearby = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<CongestionData[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/seoul/congestion/nearby/low`,
    {
      params: { lat: latitude, lng: longitude, radius: radiusKm }
    }
  );
  return response.data;
};

/**
 * 장소명으로 검색
 *
 * @param placeName - 검색할 장소명 (부분 일치)
 * @returns 검색된 장소의 혼잡도 데이터 배열
 *
 * @example
 * const results = await searchCongestionByName('강남');
 * // 강남역, 강남구청 등 "강남"이 포함된 모든 장소 반환
 */
export const searchCongestionByName = async (
  placeName: string
): Promise<CongestionData[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/seoul/congestion/search`,
    {
      params: { name: placeName }
    }
  );
  return response.data;
};

/**
 * 전체 장소 혼잡도 조회 (관리자용)
 *
 * @returns 전체 장소의 혼잡도 데이터 배열
 */
export const getAllCongestion = async (): Promise<CongestionData[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/seoul/congestion/all`
  );
  return response.data;
};

/**
 * 혼잡도 통계 조회
 *
 * @returns 혼잡도 통계
 *
 * @example
 * const stats = await getCongestionStats();
 * console.log(`평균 혼잡도: ${stats.averageCongestionLevel}`);
 * console.log(`여유 있는 장소: ${stats.smoothCount}개`);
 */
export const getCongestionStats = async (): Promise<CongestionStats> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/seoul/congestion/stats`
  );
  return response.data;
};
