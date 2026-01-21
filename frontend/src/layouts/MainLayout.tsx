import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useNextAppointment } from '../hooks/useNextAppointment';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, timeRemaining, isUrgent } = useNextAppointment();

  // 중앙 버튼 클릭 핸들러 (Smart Navigation)
  const handleCenterButtonClick = () => {
    // CRITICAL: localStorage에서 appointmentId 확인 (useNextAppointment보다 더 즉각적)
    const savedAppointmentId = localStorage.getItem('appointmentId');

    if (savedAppointmentId) {
      // Case A: 약속 ID 있음 -> 기존 약속 확인 페이지로
      console.log('✅ 기존 약속 존재 -> 상세 페이지로 이동:', savedAppointmentId);
      navigate(`/mission/${savedAppointmentId}`);
    } else if (appointment) {
      // Case A-2: hook에서 약속 발견 (fallback)
      console.log('✅ 약속 발견 (hook) -> 상세 페이지로 이동:', appointment.id);
      navigate(`/mission/${appointment.id}`);
    } else {
      // Case B: 약속 없음 -> 위치 설정 후 새 약속 받기
      console.log('📍 약속 없음 -> 위치 설정 페이지로 이동');
      navigate('/location');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-deep-charcoal pb-24">
      {/* 메인 콘텐츠 */}
      <Outlet />

      {/* 하단 네비게이션 (Glassmorphism) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-charcoal-soft/95 backdrop-blur-lg border-t border-charcoal-lighter z-50">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between relative">
            {/* 좌측: 피드 (Home) */}
            <button
              onClick={() => navigate('/feed')}
              className={`flex flex-col items-center justify-center w-16 h-16 transition-all ${
                isActive('/feed')
                  ? 'text-electric-lime'
                  : 'text-text-gray hover:text-off-white'
              }`}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs mt-1 font-semibold">홈</span>
            </button>

            {/* 중앙: 메인 액션 버튼 (Floating) */}
            <button
              onClick={handleCenterButtonClick}
              className={`flex flex-col items-center justify-center w-16 h-16 -mt-8 rounded-full shadow-lg hover:scale-110 transition-all transform ${
                appointment && isUrgent
                  ? 'bg-accent-pink shadow-accent-pink/30 hover:shadow-accent-pink/50 animate-pulse-slow'
                  : 'bg-electric-lime shadow-electric-lime/30 hover:shadow-electric-lime/50'
              }`}
            >
              {appointment && timeRemaining ? (
                // 약속 있음 -> 시간 표시
                <span className={`text-lg font-extra-bold ${isUrgent ? 'text-deep-charcoal' : 'text-deep-charcoal'}`}>
                  {timeRemaining}
                </span>
              ) : (
                // 약속 없음 -> 스파크/플러스 아이콘
                <svg className="w-8 h-8 text-deep-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>

            {/* 우측: 마이페이지 */}
            <button
              onClick={() => navigate('/mypage')}
              className={`flex flex-col items-center justify-center w-16 h-16 transition-all ${
                isActive('/mypage')
                  ? 'text-electric-lime'
                  : 'text-text-gray hover:text-off-white'
              }`}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs mt-1 font-semibold">마이</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
