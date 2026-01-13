import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { differenceInHours, differenceInMinutes } from 'date-fns';

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
    navigate(`/chat/${appointment.id}`);
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
      className={`relative w-full rounded-3xl overflow-hidden shadow-xl cursor-pointer mb-6
                  ${isUrgent ? 'border-4 border-red-500 animate-pulse-border' : 'border-2 border-purple-200'}`}
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 opacity-80"></div>
      <img
        src={appointment.missionImageUrl || appointment.placeImageUrl || 'https://via.placeholder.com/800x400?text=Little+Escape'}
        alt={appointment.missionTitle || '미션 이미지'}
        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
      />
      <div className="relative p-6 text-white flex flex-col justify-between h-full min-h-[200px]">
        {/* 개발용 버튼 (우상단에 작게 배치) */}
        {showDevButtons && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('🔓 FeaturedCard: D-1로 변경 버튼 클릭됨!');
                onDevUnlockTomorrow?.(appointment.id);
              }}
              className="px-2 py-1 bg-black bg-opacity-50 backdrop-blur text-white text-[10px] rounded hover:bg-opacity-70 transition"
              title="개발용: D-1로 변경"
            >
              🔓 D-1
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('⏰ FeaturedCard: Now로 변경 버튼 클릭됨!');
                onDevUnlockNow?.(appointment.id);
              }}
              className="px-2 py-1 bg-black bg-opacity-50 backdrop-blur text-white text-[10px] rounded hover:bg-opacity-70 transition"
              title="개발용: Now로 변경"
            >
              ⏰ Now
            </button>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-extrabold mb-2 drop-shadow-md">
            {appointment.missionTitle || '새로운 일탈을 계획해보세요!'}
          </h2>
          <p className="text-sm opacity-90 mb-4 drop-shadow">
            {getStatusText(appointment.status)}
          </p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className={`text-4xl font-bold drop-shadow-lg ${isUrgent ? 'text-red-300' : ''}`}>
            {timeRemaining || 'Loading...'}
          </span>
          <span className="text-sm opacity-90 drop-shadow">
            {appointment.placeName || '장소 미정'}
          </span>
        </div>
      </div>
      <style>{`
        @keyframes pulse-border {
          0% { border-color: #ef4444; }
          50% { border-color: #f87171; }
          100% { border-color: #ef4444; }
        }
        .animate-pulse-border {
          animation: pulse-border 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default FeaturedCard;
