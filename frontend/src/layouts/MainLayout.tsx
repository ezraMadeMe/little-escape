import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useNextAppointment } from '../hooks/useNextAppointment';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, timeRemaining, isUrgent } = useNextAppointment();

  // 중앙 버튼 클릭 핸들러
  const handleCenterButtonClick = () => {
    if (appointment) {
      // 약속 있음 -> 미션 상세 페이지로 직행
      navigate(`/mission/${appointment.id}`);
    } else {
      // 약속 없음 -> 새로운 추천 받으러 홈으로
      navigate('/missions');
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
            {/* 좌측: 홈/미션 */}
            <button
              onClick={() => navigate('/missions')}
              className={`flex flex-col items-center justify-center w-16 h-16 transition-all ${
                isActive('/missions')
                  ? 'text-electric-lime'
                  : 'text-text-gray hover:text-off-white'
              }`}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
