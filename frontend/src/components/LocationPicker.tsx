import { useState, useEffect } from 'react';

interface LocationPickerProps {
  onLocationSelect: (latitude: number, longitude: number, radius: number) => void;
  isLoading: boolean;
}

const LocationPicker = ({ onLocationSelect, isLoading }: LocationPickerProps) => {
  // 서울 시청 기본 좌표
  const DEFAULT_LAT = 37.5665;
  const DEFAULT_LNG = 126.9780;

  const [latitude, setLatitude] = useState<number>(DEFAULT_LAT); // 기본값으로 초기화
  const [longitude, setLongitude] = useState<number>(DEFAULT_LNG); // 기본값으로 초기화
  const [radius, setRadius] = useState<number>(5); // 기본 5km
  const [locationName, setLocationName] = useState<string>('서울 시청 (기본 위치)');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState<string>('');

  // 컴포넌트 마운트 시 자동으로 GPS 시도
  useEffect(() => {
    // HTTP 환경에서는 GPS가 차단되므로 에러 메시지 표시
    const isHttps = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isHttps && !isLocalhost) {
      setError('💡 GPS는 localhost 또는 HTTPS에서만 사용 가능합니다. 기본 위치(서울 시청)를 사용합니다.');
      return;
    }

    // HTTPS 또는 localhost에서는 자동으로 GPS 시도
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          setLocationName(`현재 위치 (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setError('');
        },
        (error) => {
          console.error('자동 GPS 실패:', error);
          // GPS 실패 시 기본 위치 유지, 에러 메시지 표시
          setError('GPS 접근이 차단되었습니다. 기본 위치(서울 시청)를 사용합니다.');
        },
        {
          enableHighAccuracy: false, // 빠른 응답을 위해
          timeout: 5000,
          maximumAge: 300000, // 5분간 캐시 사용
        }
      );
    }
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('GPS를 지원하지 않는 브라우저입니다.');
      // 기본 위치로 설정
      setLatitude(DEFAULT_LAT);
      setLongitude(DEFAULT_LNG);
      setLocationName('서울 시청 (기본 위치)');
      return;
    }

    setIsGettingLocation(true);
    setError('');

    // 먼저 빠른 위치 확인 시도 (정확도 낮음, 빠름)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocationName(`현재 위치 (GPS)`);
        setError('');
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('위치 정보 가져오기 실패:', error);
        let errorMessage = '위치 정보를 가져올 수 없습니다.';
        
        // 에러 타입별 메시지
        if (error.code === 1) {
          errorMessage = 'GPS 접근이 거부되었습니다. 💡 브라우저 설정에서 위치 권한을 허용해주세요.';
        } else if (error.code === 2) {
          errorMessage = '위치 정보를 사용할 수 없습니다. 실내이거나 GPS 신호가 약할 수 있습니다.';
        } else if (error.code === 3) {
          errorMessage = '위치 정보 요청 시간이 초과되었습니다. GPS 신호가 약하거나 실내일 수 있습니다.';
        }
        
        setError(errorMessage + ' 기본 위치(서울 시청)를 사용합니다.');
        // 기본 위치 유지 (이미 설정되어 있음)
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: false, // 빠른 응답을 위해 false
        timeout: 20000, // 20초로 증가
        maximumAge: 60000, // 1분 이내 캐시된 위치 사용 가능
      }
    );
  };

  const handleSubmit = () => {
    // latitude와 longitude는 이제 항상 값이 있음 (기본값으로 초기화됨)
    onLocationSelect(latitude, longitude, radius);
  };

  // 반경에 따른 설명 텍스트
  const getRadiusDescription = (km: number) => {
    if (km <= 2) return '도보 거리';
    if (km <= 5) return '자전거/대중교통';
    if (km <= 10) return '대중교통/자동차';
    return '자동차 권장';
  };

  return (
    <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          어디서 출발하시나요? 📍
        </p>
        <p className="text-xs text-gray-500 mb-3">
          주변 핫플레이스를 찾아드릴게요!
        </p>

        {/* 현재 위치 잡기 버튼 */}
        <button
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGettingLocation ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>위치 확인 중... (최대 20초)</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>현재 위치 다시 잡기</span>
            </>
          )}
        </button>
        
        {/* GPS 팁 */}
        {!error && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-600 leading-relaxed">
              💡 <strong>GPS 사용 팁:</strong> 실내보다는 창가나 야외에서 더 빠르고 정확해요. 
              기본 위치(서울 시청)를 사용해도 주변 미션을 찾아드립니다!
            </p>
          </div>
        )}

        {/* 위치 정보 표시 */}
        {locationName && (
          <div className="mt-2 p-2 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-700">
              ✅ {locationName}
            </p>
          </div>
        )}

        {/* 에러/안내 메시지 */}
        {error && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              {error}
            </p>
            <div className="mt-2 pt-2 border-t border-amber-200">
              <p className="text-[10px] text-amber-700 leading-relaxed">
                <strong>GPS가 안 될 때:</strong>
              </p>
              <ul className="text-[10px] text-amber-700 leading-relaxed mt-1 ml-3 space-y-1">
                <li>• 실내인 경우: 창가나 야외로 이동해보세요</li>
                <li>• HTTP 접속: <code className="bg-amber-100 px-1 rounded">localhost:5173</code>으로 접속하세요</li>
                <li>• 그냥 진행: 기본 위치로도 충분히 미션을 찾아드려요!</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 거리 슬라이더 - 항상 표시 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">
            검색 반경
          </label>
          <span className="text-sm font-bold text-purple-600">
            {radius}km
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1km</span>
          <span className="text-purple-600 font-semibold">{getRadiusDescription(radius)}</span>
          <span>10km</span>
        </div>
      </div>

      {/* 확인 버튼 - 항상 표시 */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
      >
        {isLoading ? '처리 중...' : '이 위치로 찾아볼게요!'}
      </button>
    </div>
  );
};

export default LocationPicker;
