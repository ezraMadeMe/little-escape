import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointments } from '../api/appointmentApi';
import { Appointment, AppointmentStatus } from '../types/appointment';

interface SmartActionModalProps {
  onClose: () => void;
}

const SmartActionModal = ({ onClose }: SmartActionModalProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    checkActiveAppointments();
  }, []);

  const checkActiveAppointments = async () => {
    try {
      const appointments = await getMyAppointments();

      // PENDING 또는 ACCEPTED 상태의 약속 찾기
      const active = appointments.find(
        (apt) => apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.ACCEPTED
      );

      setActiveAppointment(active || null);
      setIsLoading(false);

      // 진행 중인 약속이 없으면 바로 새 채팅방으로 이동
      if (!active) {
        setTimeout(() => {
          navigate('/chat/new');
          onClose();
        }, 300);
      }
    } catch (error) {
      console.error('약속 조회 실패:', error);
      setIsLoading(false);
      // 에러 발생 시에도 새 채팅방으로
      navigate('/chat/new');
      onClose();
    }
  };

  const handleContinue = () => {
    if (activeAppointment) {
      navigate(`/chat/${activeAppointment.id}`);
      onClose();
    }
  };

  const handleNewChat = () => {
    navigate('/chat/new');
    onClose();
  };

  if (isLoading) {
    return (
      <>
        {/* 배경 오버레이 */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

        {/* 로딩 스피너 */}
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center pb-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </>
    );
  }

  // 진행 중인 약속이 없으면 렌더링하지 않음 (바로 리다이렉트됨)
  if (!activeAppointment) {
    return null;
  }

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slideUp max-w-md mx-auto">
        <div className="p-6">
          {/* 핸들 바 */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

          {/* 아이콘 & 메시지 */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌿</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              현재 진행 중인 약속이 있어요!
            </h3>
            <p className="text-sm text-gray-600">
              {activeAppointment.missionTitle ? (
                <>
                  <span className="font-semibold text-purple-600">{activeAppointment.missionTitle}</span> 미션을 준비 중이에요.
                </>
              ) : (
                '아직 미션을 선택하지 않으셨네요.'
              )}
            </p>
          </div>

          {/* 버튼 그룹 */}
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition shadow-md"
            >
              이어서 대화하기 💬
            </button>

            <button
              onClick={handleNewChat}
              className="w-full py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
            >
              새로운 약속 잡기
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 text-gray-500 text-sm"
            >
              취소
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default SmartActionModal;
