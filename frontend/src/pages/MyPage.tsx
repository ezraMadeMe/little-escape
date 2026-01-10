import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointments, cancelAppointment, completeAppointment, createAppointment } from '../api/appointmentApi';
import { Appointment, AppointmentStatus } from '../types/appointment';
import MissionCard from '../components/MissionCard';

function MyPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);

  // 친구 초대 관련 상태
  const [invitePhoneNumber, setInvitePhoneNumber] = useState<string>('');
  const [isSendingInvite, setIsSendingInvite] = useState<boolean>(false);

  // 재예약 모달 관련 상태
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
  const [rescheduleMissionId, setRescheduleMissionId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);

  const sendMagicLink = async () => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/send-magic-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) alert('매직 링크 전송 완료!');
      else alert('전송 실패');
    } catch (e) {
      console.error(e);
    }
  };

  const sendInvite = async () => {
    if (!invitePhoneNumber.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    try {
      setIsSendingInvite(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/users/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetPhoneNumber: invitePhoneNumber }),
      });

      if (res.ok) {
        alert('초대장이 발송되었습니다!');
        setInvitePhoneNumber('');
      } else {
        const data = await res.json();
        alert(data.error || '초대장 발송에 실패했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('초대장 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getMyAppointments();
      setAppointments(data);
      setError(null);
    } catch (err) {
      setError('약속 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    const confirmed = window.confirm('정말로 이 약속을 취소하시겠습니까?');
    if (!confirmed) return;

    try {
      setCancelling(id);
      await cancelAppointment(id);
      alert('약속이 취소되었습니다.');
      await loadAppointments();
    } catch (err) {
      console.error('약속 취소 실패:', err);
      alert('약속을 취소하는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setCancelling(null);
    }
  };

  const handleComplete = async (id: number) => {
    const comment = window.prompt('오늘의 일탈은 어떠셨나요? 한 줄 소감을 남겨주세요.');
    if (comment === null) return;
    if (comment.trim() === '') {
      alert('소감을 입력해주세요.');
      return;
    }

    try {
      setCompleting(id);
      await completeAppointment(id, {
        proofComment: comment.trim()
      });
      alert('인증되었습니다!');
      await loadAppointments();
    } catch (err) {
      console.error('약속 완료 실패:', err);
      alert('약속을 완료하는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setCompleting(null);
    }
  };

  // 재예약 모달 열기
  const openRescheduleModal = (missionId: number | undefined) => {
    if (!missionId) {
      alert('미션 정보가 없습니다.');
      return;
    }
    setRescheduleMissionId(missionId);

    // 기본값: 내일 오후 2시
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    setRescheduleDate(`${year}-${month}-${day}T${hours}:${minutes}`);

    setShowRescheduleModal(true);
  };

  // 재예약 모달 닫기
  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setRescheduleMissionId(null);
    setRescheduleDate('');
  };

  // 재예약 처리
  const handleReschedule = async () => {
    if (!rescheduleMissionId || !rescheduleDate) {
      alert('날짜를 선택해주세요.');
      return;
    }

    try {
      setIsRescheduling(true);
      const dateTime = new Date(rescheduleDate);
      const isoString = dateTime.toISOString();

      await createAppointment({ scheduledAt: isoString, missionId: rescheduleMissionId });
      alert('약속이 다시 잡혔습니다!');
      closeRescheduleModal();
      await loadAppointments();
    } catch (err) {
      console.error('재예약 실패:', err);
      alert('재예약에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsRescheduling(false);
    }
  };

  const getStatusText = (status: AppointmentStatus) => {
    const statusMap: Record<string, string> = {
      [AppointmentStatus.PENDING]: '두근두근 준비 중',
      [AppointmentStatus.ACCEPTED]: '일탈 준비 완료',
      [AppointmentStatus.REJECTED]: '취소됨',
      [AppointmentStatus.CANCELLED]: '잠시 미룬 일탈',
      [AppointmentStatus.COMPLETED]: '소중한 추억',
      [AppointmentStatus.NO_SHOW]: '아쉬운 엇갈림',
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            나의 일탈 기록
          </h1>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            새로운 일탈 찾기
          </button>
        </div>

        <button
          onClick={sendMagicLink}
          className="bg-green-500 text-white px-4 py-2 rounded mt-4"
        >
          매직 링크 나에게 보내기 (돈나감주의)
        </button>

        {/* 친구 초대하기 섹션 */}
        <div className="bg-white rounded-2xl shadow-md p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            좋은 건 같이 해요 💌
          </h2>
          <p className="text-gray-600 mb-6">
            친구의 번호를 입력하고 초대장을 보내보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="tel"
              value={invitePhoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setInvitePhoneNumber(value);
              }}
              placeholder="전화번호 (숫자만 입력)"
              className="flex-1 h-14 px-5 text-lg border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 outline-none"
              disabled={isSendingInvite}
            />
            <button
              onClick={sendInvite}
              disabled={isSendingInvite || !invitePhoneNumber.trim()}
              className="h-14 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isSendingInvite ? '전송 중...' : '초대장 보내기'}
            </button>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <p className="text-xl text-gray-500 font-medium">아직 예정된 일탈이 없습니다.</p>
            <p className="text-base text-gray-400 mt-2">
              홈에서 시간을 먼저 확보해보세요!
            </p>
          </div>
        ) : (
          <div>
            {appointments.map((appointment) => {
              // 미션이 선택되지 않은 경우
              if (!appointment.missionTitle) {
                return (
                  <div
                    key={appointment.id}
                    className="relative w-full overflow-hidden rounded-3xl shadow-lg bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-dashed border-purple-300"
                  >
                    <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center min-h-[18rem]">
                      <div className="text-6xl mb-4">❓</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">
                        아직 할 일이 정해지지 않았어요
                      </h3>
                      <p className="text-gray-600 mb-2 text-lg">
                        {new Date(appointment.scheduledAt).toLocaleDateString()} {new Date(appointment.scheduledAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-base text-gray-500 mb-8">
                        지금 바로 미션을 골라보세요!
                      </p>
                      <button
                        onClick={() => navigate(`/pick-mission/${appointment.id}`)}
                        className="h-14 px-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        오늘의 일탈 고르기
                      </button>

                      {/* 취소 버튼도 추가 */}
                      {appointment.status !== AppointmentStatus.COMPLETED && (
                        <button
                          onClick={() => handleCancel(appointment.id)}
                          disabled={cancelling === appointment.id}
                          className="mt-6 text-base text-gray-500 hover:text-red-600 underline p-2"
                        >
                          {cancelling === appointment.id ? '취소 중...' : '다음에 다시 올게요'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // 모든 미션이 선택된 약속 - MissionCard 사용
              return (
                <MissionCard
                  key={appointment.id}
                  appointment={appointment}
                  count={appointment.visitCount}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 재예약 모달 */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* 모달 헤더 */}
            <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">언제 다시 갈까요?</h2>
              <button
                onClick={closeRescheduleModal}
                className="text-gray-400 hover:text-gray-600 text-4xl leading-none p-2 -mr-2"
              >
                ×
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <label htmlFor="reschedule-datetime" className="block text-base font-bold text-gray-700">
                  새로운 약속 시간을 선택해주세요
                </label>
                <input
                  id="reschedule-datetime"
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full h-16 px-5 text-xl border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 outline-none bg-gray-50"
                />
              </div>

              {/* 안내 메시지 */}
              <div className="bg-indigo-50 rounded-2xl p-6">
                <p className="text-base text-indigo-900 leading-relaxed font-medium">
                  💡 같은 미션으로 새로운 약속이 생성됩니다. 이번엔 꼭 지켜보세요!
                </p>
              </div>

              {/* 확인 버튼 */}
              <button
                onClick={handleReschedule}
                disabled={isRescheduling || !rescheduleDate}
                className="w-full h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRescheduling ? '처리 중...' : '약속 다시 잡기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPage;