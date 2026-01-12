import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { cancelAppointment } from '../api/appointmentApi';

interface ChatActionAreaProps {
  appointment: Appointment | null;
  onProofFormShow?: () => void;
}

const ChatActionArea = ({ appointment, onProofFormShow }: ChatActionAreaProps) => {
  const navigate = useNavigate();
  const [isMapOpen, setIsMapOpen] = useState(false);

  if (!appointment) return null;

  const now = new Date();
  const scheduledTime = new Date(appointment.scheduledAt);
  const isPast = now >= scheduledTime;
  const status = appointment.status;

  // 약속 취소
  const handleCancel = async () => {
    if (!confirm('정말 이 약속을 취소하시겠어요?')) return;

    try {
      await cancelAppointment(appointment.id);
      navigate('/appointments');
    } catch (error) {
      console.error('약속 취소 실패:', error);
      alert('약속 취소에 실패했습니다.');
    }
  };

  // 시나리오 1: 미션 선택 완료 & 시간 남음 (D-Day)
  if (status === AppointmentStatus.ACCEPTED && !isPast && appointment.missionTitle) {
    return (
      <div className="space-y-2">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📍</span>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">{appointment.missionTitle}</h4>
              <p className="text-xs text-gray-500">{appointment.missionLocation || '장소 정보 없음'}</p>
            </div>
          </div>
          <div className="text-xs text-gray-600 mb-2">
            ⏰ {new Date(appointment.scheduledAt).toLocaleString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setIsMapOpen(!isMapOpen)}
            className="py-2.5 px-3 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 transition"
          >
            📍 위치
          </button>
          <button
            onClick={handleCancel}
            className="py-2.5 px-3 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            ❌ 취소
          </button>
          <button
            onClick={onProofFormShow}
            className="py-2.5 px-3 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-200 transition"
          >
            👋 미리 완료
          </button>
        </div>

        {isMapOpen && (
          <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-gray-600">
            <p>🗺️ 지도 기능은 곧 추가될 예정입니다.</p>
            <p className="text-xs mt-1">{appointment.missionLocation}</p>
          </div>
        )}
      </div>
    );
  }

  // 시나리오 2: 약속 시간 도래/지남 (Time Passed)
  if (status === AppointmentStatus.ACCEPTED && isPast) {
    return (
      <div className="space-y-2">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-sm text-gray-700 mb-2">약속 시간이 되었어요! 🌿</p>
          <p className="text-xs text-gray-500">작은 일탈 즐기셨나요?</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onProofFormShow}
            className="py-3 px-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105"
          >
            📸 인증하고 완료
          </button>
          <button
            onClick={() => alert('글로만 후기 남기기 기능은 곧 추가됩니다!')}
            className="py-3 px-4 bg-white border-2 border-purple-300 text-purple-600 text-sm font-semibold rounded-lg hover:bg-purple-50 transition"
          >
            📝 글만 작성
          </button>
        </div>
      </div>
    );
  }

  // 시나리오 3: 아직 미션 선택 전 (PENDING) -> 슬라이더 표시 (ChatAppointment에서 처리)
  // 이 경우 ChatActionArea를 렌더링하지 않음
  return null;
};

export default ChatActionArea;
