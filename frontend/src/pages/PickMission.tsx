import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecommendedMissions } from '../api/missionApi';
import { updateAppointmentMission, getAppointmentDetail } from '../api/appointmentApi';
import { Mission } from '../types/mission';

function PickMission() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');

  // 시간대에 따른 필터링 기준 텍스트 생성
  const getTimeFilterText = (scheduledAt: string): string => {
    if (!scheduledAt) return '당신을 위한 작은 일탈';

    const date = new Date(scheduledAt);
    const hour = date.getHours();

    if (hour >= 6 && hour < 12) {
      return '상쾌한 아침, 이런 일탈 어떠세요?';
    } else if (hour >= 12 && hour < 18) {
      return '여유로운 오후, 당신만의 시간';
    } else {
      return '고요한 밤, 당신을 위한 휴식';
    }
  };

  // TimeOfDay 배지 정보 (아이콘 + 텍스트 + 스타일)
  const getTimeOfDayBadge = (timeOfDay?: string) => {
    if (!timeOfDay || timeOfDay === 'ANY') return null;

    const badges = {
      MORNING: {
        icon: '☀️',
        text: '아침 추천',
        bgColor: 'bg-gradient-to-r from-yellow-400/30 to-orange-400/30',
        borderColor: 'border-yellow-400/30'
      },
      AFTERNOON: {
        icon: '☕️',
        text: '오후의 여유',
        bgColor: 'bg-gradient-to-r from-amber-400/30 to-orange-300/30',
        borderColor: 'border-amber-400/30'
      },
      NIGHT: {
        icon: '🌙',
        text: '밤의 감성',
        bgColor: 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30',
        borderColor: 'border-indigo-400/30'
      }
    };

    return badges[timeOfDay as keyof typeof badges];
  };

  // LocationType 배지 정보
  const getLocationTypeBadge = (locationType?: string) => {
    if (!locationType || locationType === 'ANY') return null;

    const badges = {
      INDOOR: {
        icon: '🏠',
        text: '실내',
        bgColor: 'bg-blue-500/30',
        borderColor: 'border-blue-400/30'
      },
      OUTDOOR: {
        icon: '🌳',
        text: '야외',
        bgColor: 'bg-green-500/30',
        borderColor: 'border-green-400/30'
      }
    };

    return badges[locationType as keyof typeof badges];
  };

  useEffect(() => {
    const loadMissions = async () => {
      if (!appointmentId) {
        alert('약속 ID가 없습니다.');
        navigate('/mypage');
        return;
      }

      try {
        // 1. Appointment 정보 가져오기
        const appointment = await getAppointmentDetail(Number(appointmentId));

        // 2. scheduledAt을 사용해 추천 미션 가져오기
        const appointmentScheduledAt = appointment.scheduledAt;
        setScheduledAt(appointmentScheduledAt);
        const data = await getRecommendedMissions(appointmentScheduledAt);
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
  }, [appointmentId, navigate]);

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
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900">
        <div className="text-3xl mb-4">🧐</div>
        <div className="text-xl text-white font-medium">맞춤 미션을 찾고 있어요...</div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <p className="text-xl mb-4">추천 가능한 미션이 없습니다.</p>
          <p className="text-sm text-gray-400 mb-6">다른 시간대를 선택해보세요.</p>
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
        <p className="text-white/90 text-2xl font-medium tracking-wide drop-shadow-lg">
          {getTimeFilterText(scheduledAt)}
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
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-sm border border-white/10">
            {currentMission.category}
          </span>
          <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-sm border border-white/10">
            {currentMission.difficultyLevel}
          </span>

          {/* 시간대 배지 */}
          {(() => {
            const badge = getTimeOfDayBadge(currentMission.timeOfDay);
            if (!badge) return null;
            return (
              <span className={`${badge.bgColor} backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-white shadow-lg border ${badge.borderColor}`}>
                {badge.icon} {badge.text}
              </span>
            );
          })()}

          {/* 장소 타입 배지 */}
          {(() => {
            const badge = getLocationTypeBadge(currentMission.locationType);
            if (!badge) return null;
            return (
              <span className={`${badge.bgColor} backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-white shadow-lg border ${badge.borderColor}`}>
                {badge.icon} {badge.text}
              </span>
            );
          })()}
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
