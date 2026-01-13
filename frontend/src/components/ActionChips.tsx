import { Appointment, AppointmentStatus } from '../types/appointment';

interface ActionChipsProps {
  appointment: Appointment;
  onProofFormShow: () => void;
  onCancel: () => void;
  onShowMissionSlider: () => void;
  onNavigateToReview?: () => void;
}

const ActionChips = ({
  appointment,
  onProofFormShow,
  onCancel,
  onShowMissionSlider,
  onNavigateToReview,
}: ActionChipsProps) => {
  console.log('============ ActionChips 렌더링 시작 ============');
  console.log('ActionChips.tsx - appointment:', appointment);
  console.log('ActionChips.tsx - appointment.status:', appointment?.status);
  console.log('ActionChips.tsx - appointment.scheduledAt:', appointment?.scheduledAt);
  
  if (!appointment) {
    console.log('ActionChips.tsx - ❌ appointment가 null입니다. 렌더링 중단.');
    return null;
  }

  const now = new Date();
  const scheduledTime = new Date(appointment.scheduledAt);
  const isPast = now >= scheduledTime;
  const isCompleted = appointment.status === AppointmentStatus.COMPLETED;
  
  console.log('ActionChips.tsx - 현재 시간:', now);
  console.log('ActionChips.tsx - 약속 시간:', scheduledTime);
  console.log('ActionChips.tsx - isPast (시간 지남):', isPast);
  console.log('ActionChips.tsx - isCompleted (완료됨):', isCompleted);
  console.log('ActionChips.tsx - 렌더링할 버튼들:');
  if (isPast && !isCompleted) {
    console.log('  - 📸 완료/인증하기');
  }
  if (isCompleted) {
    console.log('  - 📝 후기 등록');
  }
  if (!isPast && !isCompleted) {
    console.log('  - 🔄 다른 미션 보기');
  }
  if (!isCompleted) {
    console.log('  - ❌ 약속 취소');
  }
  console.log('============================================');

  return (
    <div className="w-full bg-white rounded-2xl px-4 py-4 shadow-sm">
      <p className="text-sm text-gray-600 mb-3">
        {isPast ? '무엇을 도와드릴까요? 🌿' : '약속 관리 🎯'}
      </p>

      {/* 가로 스크롤 가능한 액션 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* 완료/인증하기 버튼 (시간이 지났을 때 강조) */}
        {isPast && !isCompleted && (
          <button
            onClick={onProofFormShow}
            className="flex-shrink-0 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">📸</span>
            <span className="text-sm whitespace-nowrap">완료/인증하기</span>
          </button>
        )}

        {/* 후기 등록 (완료된 경우) */}
        {isCompleted && onNavigateToReview && (
          <button
            onClick={onNavigateToReview}
            className="flex-shrink-0 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">📝</span>
            <span className="text-sm whitespace-nowrap">후기 등록</span>
          </button>
        )}

        {/* 다른 미션 보기 (아직 시간이 남았을 때) */}
        {!isPast && !isCompleted && (
          <button
            onClick={onShowMissionSlider}
            className="flex-shrink-0 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">🔄</span>
            <span className="text-sm whitespace-nowrap">다른 미션 보기</span>
          </button>
        )}

        {/* 약속 취소 */}
        {!isCompleted && (
          <button
            onClick={onCancel}
            className="flex-shrink-0 px-5 py-3 bg-gradient-to-r from-red-400 to-red-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">❌</span>
            <span className="text-sm whitespace-nowrap">약속 취소</span>
          </button>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ActionChips;
