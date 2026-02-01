import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // 위치 정보 가져오기 (권한 요청)
  const handleGetCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('브라우저가 위치 정보를 지원하지 않습니다.');
      setIsLoadingGeo(false);
      return;
    }

    // HTTPS 체크 (localhost와 127.0.0.1 제외)
    const isSecureContext = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (!isSecureContext && !isLocalhost) {
      setGeoError('위치 정보는 HTTPS 연결에서만 사용할 수 있습니다. HTTPS로 접속해주세요.');
      setIsLoadingGeo(false);
      console.error('❌ Geolocation requires HTTPS. Current protocol:', window.location.protocol);
      showToast('HTTPS 연결이 필요합니다');
      return;
    }

    setIsLoadingGeo(true);
    setGeoError(null);

    console.log('📍 위치 권한 요청 시작...');
    console.log('  - Protocol:', window.location.protocol);
    console.log('  - Secure context:', isSecureContext);
    console.log('  - User agent:', navigator.userAgent);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ 위치 확인 성공:', position.coords);
        console.log('  - Latitude:', position.coords.latitude);
        console.log('  - Longitude:', position.coords.longitude);
        console.log('  - Accuracy:', position.coords.accuracy, 'm');

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
        console.error('  - Error code:', error.code);
        console.error('  - Error message:', error.message);
        setIsLoadingGeo(false);

        let errorMessage = '위치를 가져올 수 없습니다.';
        let detailMessage = '';

        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = '위치 권한이 거부되었습니다.';
          detailMessage = '설정 > 사이트 설정 > 위치에서 권한을 허용해주세요.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = '위치 정보를 사용할 수 없습니다.';
          detailMessage = 'GPS가 켜져있는지, 실내가 아닌지 확인해주세요.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = '요청 시간이 초과되었습니다.';
          detailMessage = '다시 시도해주세요.';
        }

        setGeoError(`${errorMessage} ${detailMessage}`);
        showToast(errorMessage);

        // 실패 시 기본값(성수)으로 자동 설정하지 않고, 사용자가 선택하도록 유도하거나 재시도 버튼 제공
      },
      {
        enableHighAccuracy: true, // GPS 사용 (배터리 소모 증가)
        timeout: 15000, // 15초로 증가 (모바일에서 GPS 잡는데 시간 소요)
        maximumAge: 0, // 캐시 사용 안 함 (항상 최신 위치)
      }
    );
  };

  // 초기 로드 시 자동 시도
  useEffect(() => {
    handleGetCurrentLocation();
  }, []);

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
            <div className="card bg-charcoal-soft p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-off-white font-bold mb-1">위치 확인 실패</p>
                  <p className="text-text-gray text-sm mb-2">{geoError}</p>

                  {/* HTTPS 관련 에러인 경우 추가 안내 */}
                  {geoError.includes('HTTPS') && (
                    <div className="mt-3 p-3 bg-charcoal-lighter rounded-lg">
                      <p className="text-xs text-text-gray-dark">
                        💡 <strong>해결 방법:</strong><br/>
                        1. HTTPS 도메인으로 접속하거나<br/>
                        2. 아래 핫플 지역을 선택해주세요
                      </p>
                    </div>
                  )}

                  {/* 권한 거부 시 추가 안내 */}
                  {geoError.includes('권한') && (
                    <div className="mt-3 p-3 bg-charcoal-lighter rounded-lg">
                      <p className="text-xs text-text-gray-dark">
                        💡 <strong>권한 허용 방법:</strong><br/>
                        <strong>Chrome:</strong> 주소창 왼쪽 🔒 클릭 → 위치 → 허용<br/>
                        <strong>Safari:</strong> 설정 → Safari → 위치 → 허용
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleGetCurrentLocation}
                className="w-full py-3 bg-charcoal-lighter hover:bg-charcoal-soft border border-charcoal-lighter rounded-lg text-electric-lime font-bold transition-colors"
              >
                🔄 다시 시도하기
              </button>
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

        {/* Section B: 구 > 지역 Selectbox */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-off-white text-xl font-bold">
            다른 곳에서 놀고 싶다면?
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
              className="card bg-charcoal-soft/50 p-4"
            >
              <p className="text-text-gray text-sm">
                선택된 위치:{' '}
                {selectedLocation.district && (
                  <span className="text-text-gray-dark">{selectedLocation.district} &gt; </span>
                )}
                <span className="text-electric-lime font-bold">{selectedLocation.name}</span>
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
            ? `${selectedLocation.name}에서 출발하기 🚀`
            : '위치를 선택해주세요'}
        </motion.button>
      </footer>
    </div>
  );
};

export default LocationSetting;
