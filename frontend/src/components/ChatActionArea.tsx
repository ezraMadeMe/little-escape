import { useNavigate } from 'react-router-dom';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { cancelAppointment } from '../api/appointmentApi';

interface ChatActionAreaProps {
  appointment: Appointment | null;
  onProofFormShow?: () => void;
}

const ChatActionArea = ({ appointment, onProofFormShow }: ChatActionAreaProps) => {
  const navigate = useNavigate();
  
  console.log('🎨 [ChatActionArea] 렌더링 시작');
  console.log('🎨 [ChatActionArea] appointment:', appointment);

  if (!appointment) {
    console.log('🎨 [ChatActionArea] appointment 없음 - null 반환');
    return null;
  }

  const now = new Date();
  const scheduledTime = new Date(appointment.scheduledAt);
  const isPast = now >= scheduledTime;
  const status = appointment.status;
  
  console.log('🎨 [ChatActionArea] 상태 계산 완료:');
  console.log('  - 현재 시간:', now.toISOString());
  console.log('  - 약속 시간:', scheduledTime.toISOString());
  console.log('  - isPast:', isPast);
  console.log('  - status:', status);
  console.log('  - missionTitle:', appointment.missionTitle);

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
    console.log('✅ [ChatActionArea] 시나리오 1: 미션 선택 완료 & 시간 남음');
    return (
      <div className="space-y-2">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📍</span>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">{appointment.missionTitle}</h4>
              <p className="text-xs text-gray-500">{appointment.placeName || '장소 정보 없음'}</p>
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

        {/* 메인 액션 버튼 - 미션 상세 보기 */}
        <button
          onClick={() => navigate(`/mission/${appointment.id}`)}
          className="w-full py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
        >
          🎯 미션 상세 보기
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCancel}
            className="py-2 px-3 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            ❌ 약속 취소
          </button>
          <button
            onClick={onProofFormShow}
            className="py-2 px-3 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg hover:bg-purple-200 transition"
          >
            👋 미리 완료
          </button>
        </div>
      </div>
    );
  }

  // 시나리오 2: 약속 시간 도래/지남 (Time Passed)
  if (status === AppointmentStatus.ACCEPTED && isPast) {
    console.log('⏰ [ChatActionArea] 시나리오 2: 약속 시간 도래/지남');
    return (
      <div className="space-y-2">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-sm text-gray-700 mb-2">약속 시간이 되었어요! 🌿</p>
          <p className="text-xs text-gray-500">작은 일탈 즐기셨나요?</p>
        </div>

        {/* 메인 액션 - 미션 상세 페이지로 이동 (인증 탭 자동 열림) */}
        <button
          onClick={() => navigate(`/mission/${appointment.id}`)}
          className="w-full py-3 bg-gradient-to-br from-green-500 to-emerald-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
        >
          📸 인증하고 완료하기
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate(`/mission/${appointment.id}`)}
            className="py-2 px-3 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            📋 미션 상세 보기
          </button>
          <button
            onClick={handleCancel}
            className="py-2 px-3 bg-red-100 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-200 transition"
          >
            ❌ 약속 취소
          </button>
        </div>
      </div>
    );
  }

  // 시나리오 3: 아직 미션 선택 전 (PENDING) -> 슬라이더 표시 (ChatAppointment에서 처리)
  // 이 경우 ChatActionArea를 렌더링하지 않음
  console.log('⚠️ [ChatActionArea] 시나리오 3 또는 기타: null 반환');
  console.log('  - 조건 미충족 이유:');
  console.log('    - status === ACCEPTED?', status === AppointmentStatus.ACCEPTED);
  console.log('    - isPast?', isPast);
  console.log('    - missionTitle?', !!appointment.missionTitle);
  return null;
};

export default ChatActionArea;
