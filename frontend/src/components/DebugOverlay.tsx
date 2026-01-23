import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DebugOverlay = () => {
  // 개발 모드가 아니면 렌더링하지 않음
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  const location = useLocation();
  const navigate = useNavigate();

  const [localStorageData, setLocalStorageData] = useState({
    onboarding_complete: '',
    user_location: '',
    appointmentId: '',
  });

  const [appointmentStatus, setAppointmentStatus] = useState<string>('N/A');
  const [isLoading, setIsLoading] = useState(false);

  // 로컬 스토리지 실시간 업데이트
  const refreshLocalStorage = () => {
    setLocalStorageData({
      onboarding_complete: localStorage.getItem('onboarding_complete') || 'null',
      user_location: localStorage.getItem('user_location') || 'null',
      appointmentId: localStorage.getItem('appointmentId') || 'null',
    });
  };

  // 백엔드 상태 조회
  const fetchAppointmentStatus = async () => {
    const appointmentId = localStorage.getItem('appointmentId');
    if (!appointmentId || appointmentId === 'null') {
      setAppointmentStatus('N/A');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointmentStatus(data.status || 'UNKNOWN');
      } else {
        setAppointmentStatus('ERROR');
      }
    } catch (error) {
      setAppointmentStatus('FETCH_FAILED');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    refreshLocalStorage();
    fetchAppointmentStatus();

    const interval = setInterval(() => {
      refreshLocalStorage();
    }, 1000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  // Actions
  const handleReset = () => {
    if (confirm('로컬 스토리지 전체를 삭제하고 새로고침합니다. 계속하시겠습니까?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleClearAppointment = () => {
    localStorage.removeItem('appointmentId');
    refreshLocalStorage();
    setAppointmentStatus('N/A');
    alert('약속 ID가 삭제되었습니다.');
  };

  const handleGoHome = () => {
    navigate('/feed');
  };

  return (
    <div
      className="fixed top-0 right-0 z-[9999] bg-black/80 text-white text-xs p-3 max-w-sm border-l border-b border-gray-600 shadow-lg"
      style={{ fontFamily: 'monospace' }}
    >
      <div className="font-bold text-sm mb-2 text-yellow-400">🛠️ DEBUG OVERLAY</div>

      {/* 현재 경로 */}
      <div className="mb-2">
        <span className="text-gray-400">Path:</span> <span className="text-green-300">{location.pathname}</span>
      </div>

      {/* 로컬 스토리지 상태 */}
      <div className="mb-2 space-y-1">
        <div className="text-gray-400">Local Storage:</div>
        <div className="pl-2">
          <div>
            <span className="text-blue-300">onboarding_complete:</span>{' '}
            <span className={localStorageData.onboarding_complete === 'true' ? 'text-green-400' : 'text-red-400'}>
              {localStorageData.onboarding_complete}
            </span>
          </div>
          <div>
            <span className="text-blue-300">user_location:</span>{' '}
            <span className={localStorageData.user_location !== 'null' ? 'text-green-400' : 'text-red-400'}>
              {localStorageData.user_location === 'null'
                ? 'null'
                : localStorageData.user_location.substring(0, 30) + '...'}
            </span>
          </div>
          <div>
            <span className="text-blue-300">appointmentId:</span>{' '}
            <span className={localStorageData.appointmentId !== 'null' ? 'text-green-400' : 'text-gray-400'}>
              {localStorageData.appointmentId}
            </span>
          </div>
        </div>
      </div>

      {/* 백엔드 상태 */}
      <div className="mb-3">
        <span className="text-gray-400">Backend Status:</span>{' '}
        <button
          onClick={fetchAppointmentStatus}
          disabled={isLoading}
          className="ml-1 px-1 bg-blue-600 hover:bg-blue-700 rounded text-xs disabled:opacity-50"
        >
          {isLoading ? '...' : '🔄'}
        </button>
        <div className="pl-2 mt-1">
          <span className="text-purple-300">Appointment:</span>{' '}
          <span className="font-bold text-yellow-300">{appointmentStatus}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleReset}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-semibold"
        >
          [RESET] 전체 초기화
        </button>
        <button
          onClick={handleClearAppointment}
          className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs font-semibold"
        >
          [Clear Appt] 약속 삭제
        </button>
        <button
          onClick={handleGoHome}
          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs font-semibold"
        >
          [Go Home] 피드로 이동
        </button>
      </div>
    </div>
  );
};

export default DebugOverlay;
