import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAppointment, getMyAppointments } from '../api/appointmentApi';
import { getMyInfo } from '../api/userApi';
import { AppointmentStatus } from '../types/appointment';

function MissionList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // 토큰 존재 여부로 로그인 상태 확인
  const isLoggedIn = !!localStorage.getItem('token');

  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleCreateTimeCommitment = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!scheduledAt) {
      alert('시간을 선택해주세요.');
      return;
    }

    try {
      setIsCreating(true);

      const dateTime = new Date(scheduledAt);
      const isoString = dateTime.toISOString();

      const appointment = await createAppointment({ scheduledAt: isoString });

      navigate(`/pick-mission/${appointment.id}`);
    } catch (err) {
      console.error('약속 생성 실패:', err);

      if (err instanceof Error && err.message.includes('이미 진행 중인 약속')) {
        alert('이미 진행 중인 약속이 있습니다. 기존 약속을 완료하거나 취소해주세요.');
        navigate('/mypage');
      } else {
        alert('약속을 생성하는데 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        if (isLoggedIn) {
          try {
            // 유저 정보 확인 (유효성 검증용)
            await getMyInfo();

            const appointments = await getMyAppointments();

            // appointments가 배열인지 확인
            if (Array.isArray(appointments)) {
              const activeAppointment = appointments.find(
                (apt) =>
                  (apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.ACCEPTED) &&
                  apt.missionTitle
              );

              if (activeAppointment) {
                navigate(`/mission/${activeAppointment.id}`, { replace: true });
                return;
              }
            }

          } catch (userErr) {
            console.error('초기 데이터 로딩 실패:', userErr);
            localStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    setScheduledAt(getDefaultDateTime());
    init();
  }, [isLoggedIn, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-gray-50">

      {/* 날짜/시간 선택 영역 */}
      <div className="w-full max-w-sm mb-8">
        <label className="block text-center text-gray-500 mb-4 text-sm font-medium">
          언제 떠나시겠어요?
        </label>

        <input
          id="datetime"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full p-4 text-lg bg-transparent border-b-2 border-purple-300 focus:border-purple-600 outline-none text-center font-bold text-gray-800 transition-colors"
        />
      </div>

      {/* 하단 버튼 */}
      <button
        onClick={handleCreateTimeCommitment}
        disabled={isCreating || !scheduledAt}
        className="w-full max-w-sm py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-purple-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isCreating ? '처리 중...' : '나를 위한 시간 비워두기'}
      </button>

    </div>
  );
}

export default MissionList;
