import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { differenceInHours, differenceInMinutes } from 'date-fns';
import { getAppointmentNavigationPath } from '../utils/appointmentNavigation';

interface FeaturedCardProps {
  appointment: Appointment;
  onDevUnlockTomorrow?: (id: number) => void;
  onDevUnlockNow?: (id: number) => void;
}

const FeaturedCard: React.FC<FeaturedCardProps> = ({ 
  appointment, 
  onDevUnlockTomorrow,
  onDevUnlockNow 
}) => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const isDev = import.meta.env.DEV; // 개발 환경 체크

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const scheduledTime = new Date(appointment.scheduledAt);
      const totalMinutes = differenceInMinutes(scheduledTime, now);

      if (totalMinutes < 0) {
        setTimeRemaining('Now');
        setIsUrgent(true);
        return;
      }

      const hours = differenceInHours(scheduledTime, now);
      const minutes = totalMinutes % 60;

      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days}d`);
        setIsUrgent(false);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h`);
        setIsUrgent(hours < 2);
      } else {
        setTimeRemaining(`${minutes}m`);
        setIsUrgent(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [appointment.scheduledAt]);

  const handleClick = () => {
    // 약속 상세 화면으로 이동 (미션 상세)
    navigate(getAppointmentNavigationPath(appointment));
  };

  const getStatusText = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CREATED:
        return "미션은 약속 하루 전에 공개됩니다!";
      case AppointmentStatus.UNLOCKED:
        return "미션 선택이 가능해요!";
      case AppointmentStatus.PENDING:
        return "미션 선택이 필요해요!";
      case AppointmentStatus.ACCEPTED:
        return "미션이 확정되었어요!";
      default:
        return "약속을 확인해보세요.";
    }
  };

  // 개발용 버튼 표시 조건
  const showDevButtons = isDev && appointment.status !== AppointmentStatus.COMPLETED;

  return (
    <div
      className={`relative w-full rounded-solotion overflow-hidden shadow-solotion cursor-pointer mb-6 border-2 transition-all
                  ${isUrgent ? 'border-accent-pink animate-pulse' : 'border-electric-lime/50'}`}
      onClick={handleClick}
    >
      {/* Background Image */}
      <img
        src={appointment.missionImageUrl || appointment.placeImageUrl || 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80'}
        alt={appointment.missionTitle || '미션 이미지'}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal via-deep-charcoal/60 to-transparent opacity-90"></div>

      <div className="relative p-6 text-off-white flex flex-col justify-between h-full min-h-[200px]">
        {/* 개발용 버튼 (우상단에 작게 배치) */}
        {showDevButtons && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDevUnlockTomorrow?.(appointment.id);
              }}
              className="px-2 py-1 bg-black/50 backdrop-blur text-white text-[10px] rounded hover:bg-black/70 transition"
            >
              🔓 D-1
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDevUnlockNow?.(appointment.id);
              }}
              className="px-2 py-1 bg-black/50 backdrop-blur text-white text-[10px] rounded hover:bg-black/70 transition"
            >
              ⏰ Now
            </button>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-extra-bold mb-2 leading-tight">
            {appointment.missionTitle || '새로운 일탈을 계획해보세요!'}
          </h2>
          <p className="text-sm text-text-gray font-medium">
            {getStatusText(appointment.status)}
          </p>
        </div>
        
        <div className="flex items-end justify-between mt-4">
          <div className="flex flex-col">
            <span className="text-xs text-text-gray-dark mb-1">남은 시간</span>
            <span className={`text-4xl font-black tracking-tighter ${isUrgent ? 'text-accent-pink' : 'text-electric-lime'}`}>
              {timeRemaining || '...'}
            </span>
          </div>
          <span className="text-sm font-semibold flex items-center gap-1 bg-charcoal-soft/50 px-3 py-1 rounded-full backdrop-blur-sm">
            <span>📍</span>
            {appointment.placeName || '장소 미정'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCard;
