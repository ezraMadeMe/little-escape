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
    <div className="relative h-screen w-full overflow-hidden">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          filter: 'brightness(0.4)',
        }}
      />

      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 상단 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/mypage')}
            className="text-white/80 hover:text-white transition-colors flex items-center gap-1"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">목록으로</span>
          </button>

          {/* D-Day 카운터 */}
          <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
            <span className="text-white font-bold text-lg">
              {getDdayText(appointment.scheduledAt)}
            </span>
          </div>
        </div>

        {/* 미션 제목 및 변경 버튼 */}
        <div className="mt-8 text-center relative">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {appointment.missionTitle || '미션 미선택'}
          </h1>
          
          {!unlocked && (
            <button
              onClick={() => navigate(`/pick-mission/${appointmentId}`)}
              className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-xs text-white/90 transition-colors backdrop-blur-sm border border-white/10 mb-2"
            >
              <span>🔄 미션 변경하기</span>
            </button>
          )}

          <p className="text-white/80 text-sm">
            {new Date(appointment.scheduledAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* 하단 Glassmorphism 패널 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/10 backdrop-blur-xl border-t border-white/20 rounded-t-3xl">
        {/* 탭 헤더 */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-4 text-center font-semibold transition-all ${
              activeTab === 'info'
                ? 'text-white bg-white/10 border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            ℹ️ 정보
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-4 text-center font-semibold transition-all ${
              activeTab === 'map'
                ? 'text-white bg-white/10 border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            🗺️ 장소
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 py-4 text-center font-semibold transition-all ${
              activeTab === 'record'
                ? 'text-white bg-white/10 border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            📝 기록
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Tab 1: 정보 */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-white/90 text-xl font-light italic mb-8">
                  "혼자만의 시간을 즐기세요"
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-bold text-lg mb-3">미션 설명</h3>
                <p className="text-white/80 leading-relaxed">
                  {appointment.missionTitle
                    ? '이 미션을 통해 당신만의 특별한 시간을 만들어보세요. 일상에서 벗어나 새로운 경험을 해보는 시간입니다.'
                    : '미션을 선택해주세요.'}
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-bold text-lg mb-3">수행 조건</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• 약속 시간에 지정된 장소를 방문하세요</li>
                  <li>• 그 순간을 온전히 즐기세요</li>
                  <li>• 완료 후 소감을 남겨주세요</li>
                </ul>
              </div>

              {appointment.visitCount && appointment.visitCount > 1 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-4 border border-amber-500/30 text-center">
                  <p className="text-amber-200 font-semibold">
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
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-white font-bold text-xl mb-2">미스터리 장소</h3>
                  <p className="text-white/70">
                    당일에 공개됩니다. 조금만 기다려주세요!
                  </p>
                  <div className="mt-8 bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-white/60 text-sm">
                      D-Day가 되면 이곳에 장소 정보가 표시됩니다
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                    <h3 className="text-white font-bold text-2xl mb-2">
                      {appointment.placeName || '장소 정보 없음'}
                    </h3>
                    <p className="text-white/70 text-sm mb-4">
                      {appointment.placeAddress || '주소 정보 없음'}
                    </p>

                    {appointment.placeUrl && (
                      <a
                        href={appointment.placeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full bg-white/90 hover:bg-white text-gray-900 font-bold py-3 px-6 rounded-xl text-center transition-all shadow-lg"
                      >
                        🗺️ 지도에서 보기
                      </a>
                    )}
                  </div>

                  {appointment.placeImageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/20">
                      <img
                        src={appointment.placeImageUrl}
                        alt={appointment.placeName || '장소'}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: 기록 */}
          {activeTab === 'record' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-bold text-lg mb-3">생각 끄적이기</h3>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="오늘의 일탈은 어떠셨나요? 자유롭게 적어보세요..."
                  className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 transition-all outline-none resize-none"
                />
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-3">사진 인증</h3>
                <button
                  disabled
                  className="w-full bg-white/10 border-2 border-dashed border-white/30 rounded-2xl py-8 text-white/50 hover:bg-white/20 transition-all cursor-not-allowed"
                >
                  📷 사진 업로드 (준비 중)
                </button>
              </div>

              {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && unlocked && (
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg py-4 rounded-2xl shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completing ? '처리 중...' : '✅ 이 일탈 완료하기'}
                </button>
              )}

              {appointment.status === 'COMPLETED' && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4 text-center">
                  <p className="text-green-200 font-semibold">✅ 완료된 미션입니다</p>
                  {appointment.proofComment && (
                    <p className="text-green-100 text-sm mt-2 italic">"{appointment.proofComment}"</p>
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
