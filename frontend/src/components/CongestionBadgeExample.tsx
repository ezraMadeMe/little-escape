import { useState, useEffect } from 'react';
import CongestionBadge from './CongestionBadge';
import { getNearbyCongestion, CongestionData } from '../api/congestionApi';

/**
 * CongestionBadge 사용 예시 컴포넌트
 *
 * 다양한 variant와 실제 API 연동 예시를 보여줍니다.
 */
const CongestionBadgeExample = () => {
  const [nearbyPlaces, setNearbyPlaces] = useState<CongestionData[]>([]);
  const [loading, setLoading] = useState(false);

  // 예시: 광화문 근처 장소 조회
  const fetchNearbyPlaces = async () => {
    setLoading(true);
    try {
      const places = await getNearbyCongestion(37.5665, 126.9780, 5);
      setNearbyPlaces(places.slice(0, 5)); // 상위 5개만 표시
    } catch (error) {
      console.error('혼잡도 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyPlaces();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* 섹션 1: 기본 사용법 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            기본 배지 (Default)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            미션 카드 본문에 표시하기 적합한 기본 스타일
          </p>
          <div className="space-y-3">
            <CongestionBadge level={1} placeName="광화문·덕수궁" />
            <CongestionBadge level={2} placeName="강남역" />
            <CongestionBadge level={3} placeName="홍대입구역" />
            <CongestionBadge level={4} placeName="명동" />
            <CongestionBadge level={5} placeName="이태원역" />
          </div>
        </section>

        {/* 섹션 2: 컴팩트 배지 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            컴팩트 배지 (Compact)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            미션 카드 헤더나 리스트 아이템에 표시하기 적합한 작은 배지
          </p>
          <div className="flex flex-wrap gap-2">
            <CongestionBadge level={1} placeName="광화문" variant="compact" />
            <CongestionBadge level={2} placeName="강남역" variant="compact" />
            <CongestionBadge level={3} placeName="홍대" variant="compact" />
            <CongestionBadge level={4} placeName="명동" variant="compact" />
            <CongestionBadge level={5} placeName="이태원" variant="compact" />
          </div>
        </section>

        {/* 섹션 3: 상세 배지 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            상세 배지 (Detailed)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            장소 정보를 강조하는 그라디언트 배지 (추천 장소 표시용)
          </p>
          <div className="space-y-3">
            <CongestionBadge level={1} placeName="광화문·덕수궁" variant="detailed" />
            <CongestionBadge level={2} placeName="강남역 일대" variant="detailed" />
            <CongestionBadge level={3} placeName="홍대입구역" variant="detailed" />
          </div>
        </section>

        {/* 섹션 4: 미션 카드 통합 예시 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            미션 카드 통합 예시
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            실제 미션 카드에 혼잡도 배지를 표시하는 예시
          </p>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* 미션 카드 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
                <span className="font-bold text-gray-900">
                  북촌 한옥마을 산책하기
                </span>
              </div>
              <div className="flex gap-2">
                <CongestionBadge level={1} placeName="북촌" variant="compact" />
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  ⏳ D-2
                </span>
              </div>
            </div>

            {/* 미션 카드 본문 */}
            <div className="px-4 py-3">
              <div className="font-bold text-gray-900 text-base mb-1">
                📍 북촌 한옥마을
              </div>
              <div className="text-sm text-gray-600 mb-3">
                2026년 1월 22일 (수) 오후 2:00
              </div>
              <div className="mb-3">
                <CongestionBadge level={1} placeName="북촌" />
              </div>
              <div className="text-xs text-gray-500">
                서울특별시 종로구 북촌로 37
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 5: 실시간 API 연동 예시 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            실시간 API 연동
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            서울시 도시데이터 API를 통해 실시간 혼잡도 표시
          </p>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              데이터 로딩 중...
            </div>
          ) : nearbyPlaces.length > 0 ? (
            <div className="space-y-3">
              {nearbyPlaces.map((place) => (
                <div
                  key={place.placeCode}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      {place.placeName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {place.areaName} • 인구: {place.currentPopulation?.toLocaleString() || 'N/A'}명
                    </div>
                  </div>
                  <CongestionBadge
                    level={place.congestionLevel}
                    placeName={place.placeName}
                    variant="compact"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              근처에 데이터가 없습니다.
            </div>
          )}

          <button
            onClick={fetchNearbyPlaces}
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? '새로고침 중...' : '🔄 데이터 새로고침'}
          </button>
        </section>

        {/* 섹션 6: 사용법 안내 */}
        <section className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            💡 사용법
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <code className="bg-white px-2 py-1 rounded text-purple-600 font-mono">
                &lt;CongestionBadge level=&#123;1&#125; placeName="광화문" /&gt;
              </code>
              <p className="mt-1 text-gray-600">기본 배지</p>
            </div>
            <div>
              <code className="bg-white px-2 py-1 rounded text-purple-600 font-mono">
                &lt;CongestionBadge level=&#123;2&#125; placeName="강남" variant="compact" /&gt;
              </code>
              <p className="mt-1 text-gray-600">컴팩트 배지 (작은 크기)</p>
            </div>
            <div>
              <code className="bg-white px-2 py-1 rounded text-purple-600 font-mono">
                &lt;CongestionBadge level=&#123;3&#125; placeName="홍대" variant="detailed" /&gt;
              </code>
              <p className="mt-1 text-gray-600">상세 배지 (그라디언트 강조)</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default CongestionBadgeExample;
