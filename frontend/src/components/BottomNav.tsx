import { useNavigate, useLocation } from 'react-router-dom';
import { useNextAppointment } from '../hooks/useNextAppointment';
import { Home, Calendar, User, Zap } from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, timeRemaining, isUrgent, loading } = useNextAppointment();

  const handleCenterButtonClick = () => {
    if (loading) return;

    if (appointment) {
      // 진행 중인 약속이 있으면 상세 페이지로 이동
      navigate(`/mission/${appointment.id}`);
    } else {
      // 진행 중인 약속이 없으면 새 약속 생성 (localStorage 정리)
      localStorage.removeItem('appointmentId');
      navigate('/location');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-charcoal-soft/95 backdrop-blur-lg border-t border-charcoal-lighter z-50">
      <div className="max-w-md mx-auto px-2">
        <div className="grid grid-cols-4 h-[72px]">
          {/* 1. Feed (Home) */}
          <button
            onClick={() => navigate('/feed')}
            className={`flex flex-col items-center justify-center transition-all ${
              isActive('/feed')
                ? 'text-electric-lime'
                : 'text-text-gray hover:text-off-white'
            }`}
          >
            <Home size={24} strokeWidth={isActive('/feed') ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-semibold">홈</span>
          </button>

          {/* 2. History (Appointments) */}
          <button
            onClick={() => navigate('/appointments')}
            className={`flex flex-col items-center justify-center transition-all ${
              isActive('/appointments')
                ? 'text-electric-lime'
                : 'text-text-gray hover:text-off-white'
            }`}
          >
            <Calendar size={24} strokeWidth={isActive('/appointments') ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-semibold">내 약속</span>
          </button>

          {/* 3. Action (Center Button) */}
          <div className="relative flex items-center justify-center">
            <button
              onClick={handleCenterButtonClick}
              className={`absolute -top-6 flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-all transform ${
                appointment && isUrgent
                  ? 'bg-accent-pink shadow-accent-pink/30 hover:shadow-accent-pink/50 animate-pulse-slow'
                  : 'bg-electric-lime shadow-electric-lime/30 hover:shadow-electric-lime/50'
              }`}
            >
              {appointment && timeRemaining ? (
                // 약속 있음 -> 시간 표시 (작게)
                <span className="text-xs font-extra-bold text-deep-charcoal leading-tight text-center px-1">
                  {timeRemaining.split(' ').map((part, i) => (
                    <span key={i} className="block">{part}</span>
                  ))}
                </span>
              ) : (
                // 약속 없음 -> 번개 아이콘
                <Zap size={24} className="text-deep-charcoal fill-deep-charcoal" />
              )}
            </button>
            {/* 공간 차지를 위한 더미 텍스트 (위치 보정용) */}
            <span className="text-[10px] font-semibold text-transparent mt-8">Action</span>
          </div>

          {/* 4. My (MyPage) */}
          <button
            onClick={() => navigate('/mypage')}
            className={`flex flex-col items-center justify-center transition-all ${
              isActive('/mypage')
                ? 'text-electric-lime'
                : 'text-text-gray hover:text-off-white'
            }`}
          >
            <User size={24} strokeWidth={isActive('/mypage') ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-semibold">마이</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
