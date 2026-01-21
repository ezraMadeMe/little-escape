import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

// 서울 주요 핫플 프리셋
const HOTSPOTS = [
  { name: '성수', lat: 37.5445, lng: 127.0557 },
  { name: '홍대', lat: 37.5563, lng: 126.9234 },
  { name: '강남', lat: 37.4979, lng: 127.0276 },
  { name: '이태원', lat: 37.5346, lng: 126.9947 },
  { name: '을지로', lat: 37.5663, lng: 126.991 },
];

const LocationSetting = () => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Auto-fetch on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: '현재 위치',
          });
          setIsLoadingGeo(false);
        },
        (error) => {
          console.warn('위치 확인 실패:', error);
          setGeoError('위치 확인 실패. 아래에서 핫플을 선택해주세요.');
          // 기본값: 성수
          setSelectedLocation({
            lat: 37.5445,
            lng: 127.0557,
            name: '성수',
          });
          setIsLoadingGeo(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      setGeoError('브라우저가 위치 정보를 지원하지 않습니다.');
      setSelectedLocation({
        lat: 37.5445,
        lng: 127.0557,
        name: '성수',
      });
      setIsLoadingGeo(false);
    }
  }, []);

  // 핫플 선택
  const handleHotspotClick = (hotspot: Location) => {
    setSelectedLocation(hotspot);
  };

  // 미션 받기
  const handleConfirm = () => {
    if (!selectedLocation) return;

    // localStorage에 위치 저장
    localStorage.setItem('user_location', JSON.stringify(selectedLocation));
    console.log('✅ 위치 저장됨:', selectedLocation);

    // 미션 페이지로 이동
    navigate('/missions');
  };

  return (
    <div className="min-h-screen bg-deep-charcoal flex flex-col">
      {/* Header */}
      <header className="container-solotion py-6">
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
        {/* Section A: Current Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-off-white text-xl font-bold flex items-center gap-2">
            <span>📍</span>
            <span>현위치</span>
          </h2>

          {isLoadingGeo ? (
            <div className="card bg-charcoal-soft p-6 flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-6 h-6 border-2 border-electric-lime/30 border-t-electric-lime rounded-full"
              />
              <p className="text-text-gray">위치 확인 중...</p>
            </div>
          ) : geoError ? (
            <div className="card bg-charcoal-soft p-6">
              <p className="text-text-gray text-sm">{geoError}</p>
            </div>
          ) : selectedLocation?.name === '현재 위치' ? (
            <div
              onClick={() =>
                setSelectedLocation({
                  lat: selectedLocation.lat,
                  lng: selectedLocation.lng,
                  name: '현재 위치',
                })
              }
              className={`card p-6 cursor-pointer transition-all ${
                selectedLocation?.name === '현재 위치'
                  ? 'bg-electric-lime/10 border-2 border-electric-lime'
                  : 'bg-charcoal-soft hover:bg-charcoal-lighter'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="text-off-white font-bold">현재 위치 확인됨</p>
                    <p className="text-text-gray text-sm">
                      {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
                {selectedLocation?.name === '현재 위치' && (
                  <span className="text-electric-lime text-xl">✓</span>
                )}
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Section B: Hotspots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-off-white text-xl font-bold">
            다른 곳에서 놀고 싶다면?
          </h2>

          <div className="flex flex-wrap gap-3">
            {HOTSPOTS.map((hotspot) => (
              <motion.button
                key={hotspot.name}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleHotspotClick(hotspot)}
                className={`px-6 py-4 rounded-2xl font-bold text-lg transition-all ${
                  selectedLocation?.name === hotspot.name
                    ? 'bg-electric-lime text-deep-charcoal shadow-lg shadow-electric-lime/20'
                    : 'bg-charcoal-soft text-off-white hover:bg-charcoal-lighter border-2 border-transparent hover:border-electric-lime/30'
                }`}
              >
                {hotspot.name}
                {selectedLocation?.name === hotspot.name && (
                  <span className="ml-2">✓</span>
                )}
              </motion.button>
            ))}
          </div>

          {selectedLocation && selectedLocation.name !== '현재 위치' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="card bg-charcoal-soft/50 p-4"
            >
              <p className="text-text-gray text-sm">
                선택된 위치: <span className="text-electric-lime font-bold">{selectedLocation.name}</span>
              </p>
              <p className="text-text-gray-dark text-xs mt-1">
                {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
              </p>
            </motion.div>
          )}
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
            ? `${selectedLocation.name}에서 미션 받기 🚀`
            : '위치를 선택해주세요'}
        </motion.button>
      </footer>
    </div>
  );
};

export default LocationSetting;
