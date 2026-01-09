import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMissionTemplates } from '../api/missionApi';
import { updateAppointmentMission } from '../api/appointmentApi';
import { Mission } from '../types/mission';

function PickMission() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [accepting, setAccepting] = useState<boolean>(false);

  useEffect(() => {
    const loadMissions = async () => {
      try {
        const data = await getMissionTemplates();
        setMissions(data);
      } catch (err) {
        console.error('미션 로딩 실패:', err);
        alert('미션을 불러오는데 실패했습니다.');
        navigate('/mypage');
      } finally {
        setLoading(false);
      }
    };

    loadMissions();
  }, [navigate]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? missions.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === missions.length - 1 ? 0 : prev + 1));
  };

  const handleAccept = async () => {
    if (!appointmentId) {
      alert('약속 ID가 없습니다.');
      return;
    }

    const currentMission = missions[currentIndex];
    if (!currentMission) return;

    try {
      setAccepting(true);
      await updateAppointmentMission(Number(appointmentId), currentMission.id);
      alert('미션이 선택되었습니다! D-Day를 기대하세요.');
      navigate(`/mission/${appointmentId}`);
    } catch (err) {
      console.error('미션 선택 실패:', err);
      alert('미션을 선택하는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-xl text-white">로딩 중...</div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <p className="text-xl mb-4">등록된 미션이 없습니다.</p>
          <button
            onClick={() => navigate('/mypage')}
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentMission = missions[currentIndex];

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{
          backgroundImage: currentMission.imageUrl
            ? `url(${currentMission.imageUrl})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      />

      {/* 어두운 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />

      {/* 좌우 화살표 */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-lg border border-white/10"
        aria-label="Previous mission"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-lg border border-white/10"
        aria-label="Next mission"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 중앙 은은한 문구 */}
      <div className="absolute top-1/4 left-0 right-0 text-center z-10 px-6">
        <p className="text-white/80 text-xl font-light tracking-wide drop-shadow-md">
          당신을 위한 작은 일탈
        </p>
      </div>

      {/* 하단 카드 (Bottom Sheet) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/95 to-transparent px-6 py-10 pb-16">
        {/* 인디케이터 */}
        <div className="flex justify-center gap-3 mb-6">
          {missions.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                index === currentIndex ? 'w-10 bg-white' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* 카테고리 뱃지 */}
        <div className="flex gap-3 mb-5">
          <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-sm border border-white/10">
            {currentMission.category}
          </span>
          <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-sm border border-white/10">
            {currentMission.difficultyLevel}
          </span>
        </div>

        {/* 미션 타이틀 */}
        <h1 className="text-4xl font-bold text-white mb-6 leading-tight drop-shadow-xl">
          {currentMission.title}
        </h1>

        {/* 설명 */}
        <p className="text-white/90 text-lg mb-10 leading-relaxed font-medium drop-shadow-md">
          {currentMission.description}
        </p>

        {/* 수락 버튼 */}
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full h-16 bg-white hover:bg-gray-100 text-gray-900 font-bold text-xl rounded-2xl shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98]"
        >
          {accepting ? '처리 중...' : '오늘의 일탈로 선택하기'}
        </button>
      </div>
    </div>
  );
}

export default PickMission;
