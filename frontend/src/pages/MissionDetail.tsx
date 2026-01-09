import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppointmentDetail, completeAppointment } from '../api/appointmentApi';
import { Appointment } from '../types/appointment';

type Tab = 'info' | 'map' | 'record';

function MissionDetail() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [memo, setMemo] = useState<string>('');
  const [completing, setCompleting] = useState<boolean>(false);

  useEffect(() => {
    const loadAppointment = async () => {
      if (!appointmentId) {
        alert('약속 ID가 없습니다.');
        navigate('/mypage');
        return;
      }

      try {
        const data = await getAppointmentDetail(Number(appointmentId));
        setAppointment(data);
      } catch (err) {
        console.error('약속 로딩 실패:', err);
        alert('약속 정보를 불러오는데 실패했습니다.');
        navigate('/mypage');
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId, navigate]);

  const getDdayText = (scheduledAt: string): string => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    now.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);

    const diff = Math.floor((scheduled.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'D-Day';
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  const isPlaceUnlocked = (scheduledAt: string): boolean => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    now.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);
    return now >= scheduled;
  };

  const handleComplete = async () => {
    if (!appointment) return;

    const comment = memo.trim() || '일탈 완료!';

    try {
      setCompleting(true);
      await completeAppointment(appointment.id, comment);
      alert('인증되었습니다!');
      navigate('/mypage');
    } catch (err) {
      console.error('완료 처리 실패:', err);
      alert('완료 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-xl text-white">로딩 중...</div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  const unlocked = isPlaceUnlocked(appointment.scheduledAt);
  const backgroundImage = unlocked
    ? appointment.placeImageUrl || appointment.missionImageUrl
    : appointment.missionImageUrl;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          filter: 'brightness(0.4)',
        }}
      />

      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 상단 헤더 (Safe Area 고려) */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 pt-10 pb-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/mypage')}
            className="text-white/90 hover:text-white transition-colors flex items-center gap-2 p-2 -ml-2 rounded-lg hover:bg-white/10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-base font-bold">나의 기록으로</span>
          </button>

          {/* D-Day 카운터 */}
          <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-lg">
            <span className="text-white font-bold text-lg tracking-wide">
              {getDdayText(appointment.scheduledAt)}
            </span>
          </div>
        </div>

        {/* 미션 제목 및 변경 버튼 */}
        <div className="text-center relative">
          <h1 className="text-3xl font-bold text-white mb-4 drop-shadow-xl leading-tight px-4">
            {appointment.missionTitle || '미션 미선택'}
          </h1>
          
          {!unlocked && (
            <button
              onClick={() => navigate(`/pick-mission/${appointmentId}`)}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full text-base text-white/90 transition-colors backdrop-blur-sm border border-white/10 mb-4 shadow-sm"
            >
              <span>🔄 다른 일탈 찾아보기</span>
            </button>
          )}

          <p className="text-white/80 text-base font-medium">
            {new Date(appointment.scheduledAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* 하단 Glassmorphism 패널 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/10 backdrop-blur-xl border-t border-white/20 rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
        {/* 탭 헤더 */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 h-14 text-center font-bold text-lg transition-all ${
              activeTab === 'info'
                ? 'text-white bg-white/10 border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            ℹ️ 일탈 가이드
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 h-14 text-center font-bold text-lg transition-all ${
              activeTab === 'map'
                ? 'text-white bg-white/10 border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            🗺️ 비밀 장소
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 h-14 text-center font-bold text-lg transition-all ${
              activeTab === 'record'
                ? 'text-white bg-white/10 border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            📝 나의 기록
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-8 pb-20 max-h-[55vh] overflow-y-auto overscroll-contain">
          {/* Tab 1: 정보 */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-white/90 text-xl font-light italic mb-8 drop-shadow-md">
                  "혼자만의 시간을 즐기세요"
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-inner">
                <h3 className="text-white font-bold text-xl mb-3">미션 설명</h3>
                <p className="text-white/90 leading-relaxed text-lg">
                  {appointment.missionTitle
                    ? '이 미션을 통해 당신만의 특별한 시간을 만들어보세요. 일상에서 벗어나 새로운 경험을 해보는 시간입니다.'
                    : '미션을 선택해주세요.'}
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-inner">
                <h3 className="text-white font-bold text-xl mb-3">수행 조건</h3>
                <ul className="text-white/90 space-y-3 text-lg">
                  <li>• 약속 시간에 지정된 장소를 방문하세요</li>
                  <li>• 그 순간을 온전히 즐기세요</li>
                  <li>• 완료 후 소감을 남겨주세요</li>
                </ul>
              </div>

              {appointment.visitCount && appointment.visitCount > 1 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-5 border border-amber-500/30 text-center">
                  <p className="text-amber-200 font-bold text-lg">
                    🏅 {appointment.visitCount}번째 만남입니다!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: 장소 */}
          {activeTab === 'map' && (
            <div className="space-y-6">
              {!unlocked ? (
                <div className="text-center py-12">
                  <div className="text-7xl mb-6">🔒</div>
                  <h3 className="text-white font-bold text-2xl mb-3">미스터리 장소</h3>
                  <p className="text-white/80 text-lg">
                    당일에 공개됩니다. 조금만 기다려주세요!
                  </p>
                  <div className="mt-10 bg-white/5 rounded-2xl p-5 border border-white/10">
                    <p className="text-white/70 text-base">
                      D-Day가 되면 이곳에 장소 정보가 표시됩니다
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white/10 rounded-2xl p-6 border border-white/20 shadow-lg">
                    <h3 className="text-white font-bold text-2xl mb-3">
                      {appointment.placeName || '장소 정보 없음'}
                    </h3>
                    <p className="text-white/80 text-lg mb-6">
                      {appointment.placeAddress || '주소 정보 없음'}
                    </p>

                    {appointment.placeUrl && (
                      <a
                        href={appointment.placeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full h-14 bg-white/90 hover:bg-white text-gray-900 font-bold text-lg rounded-2xl transition-all shadow-lg"
                      >
                        🗺️ 비밀 장소 확인하기
                      </a>
                    )}
                  </div>

                  {appointment.placeImageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                      <img
                        src={appointment.placeImageUrl}
                        alt={appointment.placeName || '장소'}
                        className="w-full h-56 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: 기록 */}
          {activeTab === 'record' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-white font-bold text-xl mb-4">생각 끄적이기</h3>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="오늘의 일탈은 어떠셨나요? 자유롭게 적어보세요..."
                  className="w-full h-40 px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white text-lg placeholder-white/40 focus:bg-white/20 focus:border-white/40 transition-all outline-none resize-none"
                />
              </div>

              <div>
                <h3 className="text-white font-bold text-xl mb-4">사진 인증</h3>
                <button
                  disabled
                  className="w-full h-24 bg-white/10 border-2 border-dashed border-white/30 rounded-2xl text-white/50 hover:bg-white/20 transition-all cursor-not-allowed flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-2xl">📷</span>
                  <span className="text-base font-medium">사진 업로드 (준비 중)</span>
                </button>
              </div>

              {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && unlocked && (
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-xl rounded-2xl shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {completing ? '처리 중...' : '✅ 일탈 완료 도장 찍기'}
                </button>
              )}

              {appointment.status === 'COMPLETED' && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center shadow-lg">
                  <p className="text-green-200 font-bold text-xl mb-2">✅ 완료된 미션입니다</p>
                  {appointment.proofComment && (
                    <p className="text-green-100 text-lg italic">"{appointment.proofComment}"</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MissionDetail;
