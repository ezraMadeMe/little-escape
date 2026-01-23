import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useNextAppointment } from '../hooks/useNextAppointment';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, timeRemaining, isUrgent } = useNextAppointment();
  const [showAppointmentFAB, setShowAppointmentFAB] = useState(false);

  // 중앙 버튼 클릭 핸들러 (Smart Navigation)
  const handleCenterButtonClick = () => {
    // CRITICAL: localStorage에서 appointmentId 확인 (엄격한 분기 처리)
    const savedAppointmentId = localStorage.getItem('appointmentId');

    // FIX: null 문자열 및 빈 값 명시적 체크
    if (savedAppointmentId && savedAppointmentId !== 'null' && savedAppointmentId !== 'undefined' && savedAppointmentId.trim() !== '') {
      // Case A: 약속 ID 있음 -> 무조건 내 약속 페이지로 (절대 피드로 가지 않음)
      console.log('✅ 기존 약속 존재 -> 내 약속 상세 페이지로 이동:', savedAppointmentId);
      navigate(`/mission/${savedAppointmentId}`);
    } else {
      // Case B: 약속 없음 -> 위치 설정 후 새 약속 생성 (절대 피드로 가지 않음)
      console.log('📍 약속 없음 -> 위치 설정 페이지로 이동 (새 약속 생성)');
      navigate('/location');
    }
  };

  // 글로벌 약속 알림 FAB 로직
  useEffect(() => {
    const savedAppointmentId = localStorage.getItem('appointmentId');
    const isOnMissionDetailPage = location.pathname.startsWith('/mission/');

    // 조건: 약속이 있음 AND 현재 미션 상세 페이지가 아님
    if (savedAppointmentId &&
        savedAppointmentId !== 'null' &&
        savedAppointmentId !== 'undefined' &&
        savedAppointmentId.trim() !== '' &&
        !isOnMissionDetailPage) {
      setShowAppointmentFAB(true);
    } else {
      setShowAppointmentFAB(false);
    }
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-deep-charcoal pb-24">
      {/* 메인 콘텐츠 */}
      <Outlet />

      {/* 진행 중인 약속 FAB (Floating Action Button) */}
      <AnimatePresence>
        {showAppointmentFAB && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => {
              const savedAppointmentId = localStorage.getItem('appointmentId');
              if (savedAppointmentId) {
                navigate(`/mission/${savedAppointmentId}`);
              }
            }}
            className="fixed right-6 bottom-28 z-40 w-16 h-16 bg-gradient-to-br from-electric-lime to-neon-purple rounded-full shadow-lg shadow-electric-lime/50 flex items-center justify-center group"
            style={{
              boxShadow: '0 0 30px rgba(204, 255, 0, 0.6), 0 10px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* 티켓 아이콘 */}
            <svg
              className="w-8 h-8 text-deep-charcoal group-hover:rotate-12 transition-transform duration-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" opacity="0.3"/>
              <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3v-2h18v2zm0-4H3V9h18v6zm0-8H3V5h18v2z"/>
            </svg>

            {/* 펄스 애니메이션 링 */}
            <span className="absolute inset-0 rounded-full border-2 border-electric-lime animate-ping opacity-75" />
          </motion.button>
        )}
      </AnimatePresence>

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
