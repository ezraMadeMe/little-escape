import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import SmartActionModal from '../components/SmartActionModal';
import { useNextAppointment } from '../hooks/useNextAppointment';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showActionModal, setShowActionModal] = useState(false);
  const { appointment, timeRemaining, isUrgent } = useNextAppointment();

  const handleCenterButtonClick = () => {
    if (appointment) {
      // 약속이 있으면 해당 채팅방으로 이동
      navigate(`/chat/${appointment.id}`);
    } else {
      // 약속이 없으면 새 약속 생성 채팅방으로 이동
      navigate('/chat/new');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      {/* 메인 콘텐츠 */}
      <Outlet />

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#FDFBF7] border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto px-2 py-2">
          <div className="flex items-center justify-around relative">
            {/* 1. 약속 피드 */}
            <button
              onClick={() => navigate('/feed')}
              className={`flex flex-col items-center justify-center w-16 h-16 ${
                isActive('/feed') ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs mt-1">피드</span>
            </button>

            {/* 2. 추억 기록 */}
            <button
              onClick={() => navigate('/reviews')}
              className={`flex flex-col items-center justify-center w-16 h-16 ${
                isActive('/reviews') ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs mt-1">추억</span>
            </button>

            {/* 3. [중앙] 스마트 FAB - 약속 상태에 따라 변화 */}
            <button
              onClick={handleCenterButtonClick}
              className={`flex items-center justify-center w-14 h-14 -mt-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 ${
                timeRemaining
                  ? isUrgent
                    ? 'bg-gradient-to-br from-red-500 to-orange-500'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}
            >
              {timeRemaining ? (
                // 약속이 있으면 남은 시간 표시
                <span className={`text-white font-bold ${
                  timeRemaining.length > 3 ? 'text-xs' : 'text-sm'
                }`}>
                  {timeRemaining}
                </span>
              ) : (
                // 약속이 없으면 + 아이콘
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>

            {/* 4. 내 약속 */}
            <button
              onClick={() => navigate('/appointments')}
              className={`flex flex-col items-center justify-center w-16 h-16 ${
                isActive('/appointments') ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs mt-1">약속</span>
            </button>

            {/* 5. 마이페이지 */}
            <button
              onClick={() => navigate('/mypage')}
              className={`flex flex-col items-center justify-center w-16 h-16 ${
                isActive('/mypage') ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs mt-1">마이</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 스마트 액션 모달 */}
      {showActionModal && (
        <SmartActionModal onClose={() => setShowActionModal(false)} />
      )}
    </div>
  );
};

export default MainLayout;
