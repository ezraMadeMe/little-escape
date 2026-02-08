import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { showToast } from '../utils/toast';
import LocationSelectbox from '../components/LocationSelectbox';
import type { LocationSelection } from '../components/LocationSelectbox';

interface Location {
  lat: number;
  lng: number;
  name: string;
  district?: string;
}

const LocationSetting = () => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  // 자동 위치 확인 비활성화 - 바로 수동 선택 모드로 시작
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showGeoSection, setShowGeoSection] = useState(false); // 현위치 섹션 표시 여부

  // 위치 정보 가져오기 (수동 트리거)
  const handleGetCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('브라우저가 위치 정보를 지원하지 않습니다.');
      setIsLoadingGeo(false);
      return;
    }

    // HTTPS 체크 완전 제거 - 모든 환경에서 시도
    setIsLoadingGeo(true);
    setGeoError(null);
    setShowGeoSection(true);

    console.log('📍 위치 권한 요청 시작...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ 위치 확인 성공:', position.coords);
        setSelectedLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: '현재 위치',
        });
        setIsLoadingGeo(false);
        showToast('현재 위치를 확인했어요!');
      },
      (error) => {
        console.error('❌ 위치 확인 실패:', error);
        setIsLoadingGeo(false);
        setGeoError('위치를 가져올 수 없습니다. 아래에서 직접 선택해주세요.');
        showToast('위치 확인 실패 - 직접 선택해주세요');
      },
      {
        enableHighAccuracy: false, // 빠른 응답 우선
        timeout: 5000, // 5초로 단축
        maximumAge: 60000, // 1분간 캐시 허용
      }
    );
  };

  // Selectbox 선택
  const handleSelectboxSelect = (selection: LocationSelection) => {
    setSelectedLocation({
      lat: selection.lat,
      lng: selection.lng,
      name: selection.name,
      district: selection.district,
    });
  };

  // 시간 선택으로 이동
  const handleConfirm = () => {
    if (!selectedLocation) return;

    // localStorage에 위치 저장
    localStorage.setItem('user_location', JSON.stringify(selectedLocation));
    console.log('✅ 위치 저장됨:', selectedLocation);

    // 시간 선택 페이지로 이동
    navigate('/time-picker');
  };

  // 뒤로가기 핸들러
  const handleGoBack = () => {
    showToast('나중에 피드에서 이어할 수 있어요!');
    navigate('/feed', { replace: true });
  };

  return (
    <div className="min-h-screen bg-deep-charcoal flex flex-col">
      {/* Header */}
      <header className="container-solotion py-6">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={handleGoBack}
          className="mb-4 text-text-gray hover:text-off-white transition flex items-center gap-2"
        >
          <ChevronLeft size={20} />
          <span>나중에 할래</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-2"
        >
          <h1 className="text-off-white text-3xl font-extra-bold">
            어디서 출발할래?
          </h1>
          <p className="text-text-gray text-base">
            미션 추천을 위해 기준 위치를 설정해줘.
          </p>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container-solotion py-6 space-y-8">
        {/* Section A: 지역 선택 (메인) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-off-white text-xl font-bold">
            🗺️ 어디 근처에서 놀래?
          </h2>

          <LocationSelectbox
            variant="dark"
            onSelect={handleSelectboxSelect}
            className="w-full"
          />

          {selectedLocation && selectedLocation.name !== '현재 위치' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="card bg-electric-lime/10 border-2 border-electric-lime p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-off-white font-bold">
                    {selectedLocation.district && (
                      <span className="text-text-gray">{selectedLocation.district} &gt; </span>
                    )}
                    {selectedLocation.name}
                  </p>
                  <p className="text-text-gray-dark text-xs mt-1">
                    {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                  </p>
                </div>
                <span className="text-electric-lime text-xl">✓</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Section B: 현재 위치 (옵션) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-4"
        >
          {!showGeoSection ? (
            <button
              onClick={handleGetCurrentLocation}
              className="w-full py-3 bg-charcoal-soft hover:bg-charcoal-lighter border border-charcoal-lighter rounded-lg text-text-gray hover:text-off-white font-medium transition-colors text-sm"
            >
              📍 현재 위치로 설정하기
            </button>
          ) : isLoadingGeo ? (
            <div className="card bg-charcoal-soft p-4 flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-5 h-5 border-2 border-electric-lime/30 border-t-electric-lime rounded-full"
              />
              <p className="text-text-gray text-sm">위치 확인 중...</p>
            </div>
          ) : geoError ? (
            <div className="card bg-charcoal-soft p-4">
              <p className="text-text-gray text-sm">{geoError}</p>
            </div>
          ) : selectedLocation?.name === '현재 위치' ? (
            <div className="card bg-electric-lime/10 border-2 border-electric-lime p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="text-off-white font-bold">현재 위치</p>
                    <p className="text-text-gray text-xs">
                      {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
                <span className="text-electric-lime text-xl">✓</span>
              </div>
            </div>
          ) : null}
        </motion.div>
      </main>

      {/* Bottom CTA */}
      <footer className="sticky bottom-0 left-0 right-0 bg-charcoal-soft/95 backdrop-blur-lg border-t border-charcoal-lighter p-6 pb-8">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onClick={handleConfirm}
          disabled={!selectedLocation}
          className="btn-primary w-full text-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedLocation
            ? `${selectedLocation.name}에서 출발하기 🚀`
            : '위치를 선택해주세요'}
        </motion.button>
      </footer>
    </div>
  );
};

export default LocationSetting;
