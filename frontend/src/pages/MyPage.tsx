import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointments, cancelAppointment, completeAppointment } from '../api/appointmentApi';
import { Appointment } from '../types/appointment';

function MyPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);

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
    if (comment === null) return; // 취소 버튼 클릭
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

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      NO_SHOW: 'bg-orange-100 text-orange-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const isPlaceUnlocked = (scheduledAt: string) => {
    const now = new Date();
    const scheduledDate = new Date(scheduledAt);

    // 날짜만 비교 (시/분/초 무시)
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const scheduledDateOnly = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());

    return nowDate >= scheduledDateOnly;
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
            미션 목록으로
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-xl text-gray-500">아직 예정된 일탈이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              미션 목록에서 일탈을 선택해보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {appointments.map((appointment) => {
              // D-Day 계산 로직 (안전하게)
              const scheduledDate = new Date(appointment.scheduledAt);
              const now = new Date();
              scheduledDate.setHours(0, 0, 0, 0);
              now.setHours(0, 0, 0, 0);
              const isLocked = scheduledDate > now;

              // 표시할 이미지와 장소명 결정
              const displayImage = isLocked
                ? appointment.missionImageUrl // 잠김: 미션 이미지
                : appointment.placeImageUrl || appointment.missionImageUrl; // 공개: 장소 이미지(없으면 미션 이미지)

              const displayPlaceName = isLocked
                ? "🔒 D-Day에 공개됩니다"
                : appointment.placeName;

                return (
                  <div
                    key={appointment.id}
                    // [수정 1] h-64 제거 -> 높이 제한을 풀어서 내용만큼 늘어나게 함
                    className="relative w-full overflow-hidden rounded-2xl shadow-lg mb-6 group"
                  >
                    {/* 1. 배경 이미지 레이어 (Absolute로 전체를 덮음) */}
                    <div
                      className="absolute inset-0 h-full w-full bg-cover bg-center transition-all duration-500"
                      style={{
                        backgroundImage: `url(${displayImage || "https://via.placeholder.com/400"})`,
                        filter: isLocked ? "blur(8px) brightness(0.7)" : "none",
                        transform: isLocked ? "scale(1.1)" : "scale(1)",
                      }}
                    />
                
                    {/* 2. 검은색 딤(Dim) 오버레이 */}
                    <div className="absolute inset-0 h-full w-full bg-black/40" />
                
                    {/* 3. 컨텐츠 레이어 (Relative로 변경하여 부모 높이를 밀어냄) */}
                    {/* [수정 2] absolute inset-0 제거 -> relative z-10 변경 */}
                    {/* [수정 3] min-h-[16rem] 추가 -> 내용이 적어도 최소 높이는 유지 */}
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
                
                        {/* 완료된 경우 소감 표시 (이제 내용이 길어도 안 잘림!) */}
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
                                onClick={() => handleComplete(appointment.id)}
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
                                onClick={() => handleCancel(appointment.id)}
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
    </div>
  );
}

export default MyPage;
