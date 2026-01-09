import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointments, cancelAppointment, completeAppointment, createAppointment } from '../api/appointmentApi';
import { Appointment } from '../types/appointment';

function MyPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);

  // 재예약 모달 관련 상태
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
  const [rescheduleMissionId, setRescheduleMissionId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);

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
      await completeAppointment(id, comment);
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

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: '대기 중',
      ACCEPTED: '수락됨',
      REJECTED: '거절됨',
      CANCELLED: '취소됨',
      COMPLETED: '완료됨',
      NO_SHOW: '불참',
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            내 약속 히스토리
          </h1>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            홈으로
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-xl text-gray-500">아직 예정된 일탈이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              홈에서 시간을 먼저 확보해보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {appointments.map((appointment) => {
              // Case A: 취소된 약속
              if (appointment.status === 'CANCELLED') {
                return (
                  <div
                    key={appointment.id}
                    className="relative w-full h-24 overflow-hidden rounded-2xl shadow-md bg-gray-100 border border-gray-300"
                  >
                    {/* 흑백 처리된 미션 이미지 (있을 경우) */}
                    {appointment.missionImageUrl && (
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${appointment.missionImageUrl})`,
                          filter: 'grayscale(100%) brightness(0.8)',
                        }}
                      />
                    )}

                    {/* 오버레이 */}
                    <div className="absolute inset-0 bg-gray-900/40" />

                    {/* 콘텐츠 */}
                    <div className="relative z-10 h-full flex items-center justify-between px-6">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl opacity-70">❌</span>
                        <div>
                          <h3 className="text-lg font-bold text-white drop-shadow-md">
                            {appointment.missionTitle || '미션 미선택'}
                          </h3>
                          <p className="text-sm text-gray-300">
                            {new Date(appointment.scheduledAt).toLocaleDateString()} - 취소됨
                          </p>
                        </div>
                      </div>

                      {/* 재예약 버튼 */}
                      {appointment.missionId && (
                        <button
                          onClick={() => openRescheduleModal(appointment.missionId)}
                          className="bg-white/90 hover:bg-white text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                        >
                          <span>↻</span> 이 약속 지키러 가기
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // 미션이 선택되지 않은 경우
              if (!appointment.missionTitle) {
                return (
                  <div
                    key={appointment.id}
                    className="relative w-full overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-dashed border-purple-300"
                  >
                    <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center min-h-[16rem]">
                      <div className="text-6xl mb-4">❓</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        아직 할 일이 정해지지 않았어요
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {new Date(appointment.scheduledAt).toLocaleDateString()} {new Date(appointment.scheduledAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-gray-500 mb-6">
                        지금 바로 미션을 골라보세요!
                      </p>
                      <button
                        onClick={() => navigate(`/pick-mission/${appointment.id}`)}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        미션 고르기
                      </button>

                      {/* 취소 버튼도 추가 */}
                      {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancel(appointment.id)}
                          disabled={cancelling === appointment.id}
                          className="mt-4 text-sm text-gray-500 hover:text-red-600 underline"
                        >
                          {cancelling === appointment.id ? '취소 중...' : '약속 취소'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // Case B: 일반 약속 (미션이 선택된 경우)
              const scheduledDate = new Date(appointment.scheduledAt);
              const now = new Date();
              scheduledDate.setHours(0, 0, 0, 0);
              now.setHours(0, 0, 0, 0);
              const isLocked = scheduledDate > now;

              const displayImage = isLocked
                ? appointment.missionImageUrl
                : appointment.placeImageUrl || appointment.missionImageUrl;

              const displayPlaceName = isLocked
                ? "🔒 D-Day에 공개됩니다"
                : appointment.placeName;

              return (
                <div
                  key={appointment.id}
                  onClick={() => navigate(`/mission/${appointment.id}`)}
                  className="relative w-full overflow-hidden rounded-2xl shadow-lg mb-6 group cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                >
                  {/* 방문 횟수 뱃지 (visitCount > 1일 때만) */}
                  {appointment.visitCount && appointment.visitCount > 1 && (
                    <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-1">
                      <span>🏅</span>
                      <span>{appointment.visitCount}번째 만남</span>
                    </div>
                  )}

                  {/* 배경 이미지 */}
                  <div
                    className="absolute inset-0 h-full w-full bg-cover bg-center transition-all duration-500"
                    style={{
                      backgroundImage: `url(${displayImage || "https://via.placeholder.com/400"})`,
                      filter: isLocked ? "blur(8px) brightness(0.7)" : "none",
                      transform: isLocked ? "scale(1.1)" : "scale(1)",
                    }}
                  />

                  {/* 검은색 딤 오버레이 */}
                  <div className="absolute inset-0 h-full w-full bg-black/40" />

                  {/* 컨텐츠 레이어 */}
                  <div className="relative z-10 flex flex-col justify-between p-6 text-white min-h-[16rem]">
                    {/* 상단: 날짜 및 상태 */}
                    <div className="flex justify-between items-start">
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm shadow-sm">
                        {new Date(appointment.scheduledAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
                          appointment.status === 'COMPLETED'
                            ? 'bg-green-500/90'
                            : appointment.status === 'CANCELLED'
                            ? 'bg-red-500/90'
                            : 'bg-yellow-500/90'
                        }`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>

                    {/* 중앙/하단: 미션 제목 및 장소 정보 */}
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg leading-tight">
                        {appointment.missionTitle}
                      </h3>

                      <div
                        className={`flex items-center text-lg font-medium drop-shadow-md ${
                          isLocked ? 'text-yellow-300' : 'text-gray-100'
                        }`}
                      >
                        {isLocked && <span className="mr-2 text-xl">🔒</span>}
                        {displayPlaceName}
                      </div>

                      {/* 공개되었고, 장소 주소가 있을 때만 주소 표시 */}
                      {!isLocked && appointment.placeAddress && (
                        <p className="text-sm text-gray-300 mt-1 truncate">
                          {appointment.placeAddress}
                        </p>
                      )}

                      {/* 완료된 경우 소감 표시 */}
                      {!isLocked &&
                        appointment.status === 'COMPLETED' &&
                        appointment.proofComment && (
                          <div className="mt-4 bg-white/10 rounded-lg p-4 backdrop-blur-md border border-white/10 shadow-inner">
                            <p className="text-xs text-green-300 font-bold mb-1 uppercase tracking-wider">
                              My Comment
                            </p>
                            <p className="text-sm italic text-white leading-relaxed">
                              "{appointment.proofComment}"
                            </p>
                          </div>
                        )}

                      {/* 하단 버튼 영역 */}
                      <div className="mt-6 flex gap-3">
                        {/* 지도 보기 버튼 */}
                        {!isLocked && appointment.placeUrl && (
                          <a
                            href={appointment.placeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-blue-600/90 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-center text-sm font-semibold transition-all shadow-md hover:shadow-lg backdrop-blur-sm flex items-center justify-center gap-2"
                          >
                            <span>🗺️</span> 지도 보기
                          </a>
                        )}

                        {/* 완료하기 버튼 */}
                        {!isLocked &&
                          appointment.status !== 'COMPLETED' &&
                          appointment.status !== 'CANCELLED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComplete(appointment.id);
                              }}
                              disabled={completing === appointment.id}
                              className="flex-1 bg-green-600/90 hover:bg-green-700 disabled:bg-gray-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg backdrop-blur-sm disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {completing === appointment.id ? '처리 중...' : '✅ 완료하기'}
                            </button>
                          )}

                        {/* 취소 버튼 */}
                        {isLocked &&
                          appointment.status !== 'COMPLETED' &&
                          appointment.status !== 'CANCELLED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(appointment.id);
                              }}
                              disabled={cancelling === appointment.id}
                              className="flex-1 bg-white/20 hover:bg-red-600/80 disabled:bg-gray-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all backdrop-blur-md border border-white/20 hover:border-transparent flex items-center justify-center gap-2"
                            >
                              {cancelling === appointment.id ? '취소 중...' : '약속 취소'}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 재예약 모달 */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* 모달 헤더 */}
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">언제 다시 갈까요?</h2>
              <button
                onClick={closeRescheduleModal}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label htmlFor="reschedule-datetime" className="block text-sm font-semibold text-gray-700">
                  새로운 약속 시간을 선택해주세요
                </label>
                <input
                  id="reschedule-datetime"
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 outline-none"
                />
              </div>

              {/* 안내 메시지 */}
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-sm text-indigo-900 leading-relaxed">
                  💡 같은 미션으로 새로운 약속이 생성됩니다. 이번엔 꼭 지켜보세요!
                </p>
              </div>

              {/* 확인 버튼 */}
              <button
                onClick={handleReschedule}
                disabled={isRescheduling || !rescheduleDate}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
