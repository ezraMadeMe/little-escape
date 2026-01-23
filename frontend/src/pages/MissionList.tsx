import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createAppointment, getMyAppointments } from '../api/appointmentApi';
import { getMyInfo } from '../api/userApi';
import { getTodayMission } from '../api/missionApi';
import { AppointmentStatus, Appointment } from '../types/appointment';
import { Mission } from '../types/mission';
import { format } from 'date-fns';

// 내일 오후 3시로 기본 시간 설정 (함수 컴포넌트 외부로 이동)
const getDefaultDateTime = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(15, 0, 0, 0);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const hours = String(tomorrow.getHours()).padStart(2, '0');
  const minutes = String(tomorrow.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function MissionList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>('');
  const [todayMission, setTodayMission] = useState<Mission | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [isCooldown, setIsCooldown] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<string>('');

  // 시간 선택 모달 상태
  const [showTimePickerModal, setShowTimePickerModal] = useState<boolean>(false);
  const [selectedDateTime, setSelectedDateTime] = useState<string>(getDefaultDateTime());

  // 토큰 존재 여부로 로그인 상태 확인
  const isLoggedIn = !!localStorage.getItem('token');

  const handlePrimaryAction = () => {
    // Case A: 로딩 중이면 아무것도 안 함 (버튼이 disabled 상태)
    if (isCreating || loading) {
      return;
    }

    // Case B: 쿨타임 중이면 알림만 표시
    if (isCooldown) {
      alert('충분한 휴식도 미션이야. 🌙');
      return;
    }

    // Case C: 이미 약속이 있으면 -> 약속 상세 페이지로 이동 (API 호출 X)
    if (activeAppointment) {
      navigate(`/mission/${activeAppointment.id}`);
      return;
    }

    // Case D: 약속 없음 -> 시간 선택 모달 열기 (변경!)
    if (!isLoggedIn) {
      alert('로그인이 필요해.');
      navigate('/login');
      return;
    }

    // 위치 확인
    const savedLocation = localStorage.getItem('user_location');
    if (!savedLocation) {
      console.warn('⚠️ 저장된 위치가 없음 -> 위치 설정 페이지로 이동');
      navigate('/location');
      return;
    }

    // 시간 선택 모달 열기
    setShowTimePickerModal(true);
  };

  // 약속 생성 핸들러 (시간 선택 후 호출)
  const handleCreateAppointment = async () => {

    try {
      setIsCreating(true);

      // 1. 사용자 위치 가져오기 (localStorage 우선)
      let userLat: number | null = null;
      let userLon: number | null = null;

      const savedLocation = localStorage.getItem('user_location');
      if (savedLocation) {
        try {
          const location = JSON.parse(savedLocation);
          userLat = location.lat;
          userLon = location.lng;
          console.log('✅ 저장된 위치 사용:', { userLat, userLon, name: location.name });
        } catch (parseError) {
          console.warn('⚠️ 저장된 위치 파싱 실패:', parseError);
        }
      }

      if (!userLat || !userLon) {
        console.warn('⚠️ 저장된 위치가 없음');
        alert('위치 정보가 필요해.');
        return;
      }

      // 2. API 호출 (선택한 시간 사용)
      const dateTime = new Date(selectedDateTime);
      const scheduledAtString = format(dateTime, "yyyy-MM-dd'T'HH:mm:ss");

      const appointment = await createAppointment({
        scheduledAt: scheduledAtString,
        userLatitude: userLat,
        userLongitude: userLon,
      });

      // 3. 모달 닫기
      setShowTimePickerModal(false);

      // 4. 성공 직후 상세 페이지로 이동
      console.log('✅ 약속 생성 성공:', appointment);
      navigate(`/mission/${appointment.id}`);
    } catch (err) {
      console.error('❌ 약속 생성 실패:', err);

      if (err instanceof Error && err.message.includes('이미 진행 중인 약속')) {
        alert('이미 진행 중인 약속이 있어. 기존 약속부터 완료해봐.');
        navigate('/mypage');
      } else {
        alert('뭔가 문제가 생겼어. 다시 시도해봐.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // 미션 거부
  const handleRejectMission = () => {
    alert('그래... 오늘은 쉬어.');
    navigate('/mypage');
  };

  // 쿨타임 체크 함수
  const checkCooldown = () => {
    const lastCompletedAt = localStorage.getItem('last_mission_completed_at');
    if (!lastCompletedAt) {
      setIsCooldown(false);
      setCooldownRemaining('');
      return;
    }

    const lastCompleted = new Date(lastCompletedAt);
    const now = new Date();
    const diffMs = now.getTime() - lastCompleted.getTime();

    // 쿨타임: 12시간 (43200000ms) - 테스트용으로 10초(10000ms)로 설정 가능
    const cooldownMs = 43200000; // 12시간
    // const cooldownMs = 10000; // 10초 (테스트용)

    if (diffMs < cooldownMs) {
      setIsCooldown(true);
      const remainingMs = cooldownMs - diffMs;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      setCooldownRemaining(`${hours}시간 ${minutes}분`);
    } else {
      setIsCooldown(false);
      setCooldownRemaining('');
    }
  };

  // 개발용: 쿨타임 10초로 설정
  const handleDevSetCooldown = () => {
    localStorage.setItem('last_mission_completed_at', new Date().toISOString());
    alert('쿨타임 10초 설정 완료! (테스트용)');
    checkCooldown();
  };

  // 만료된 약속 정리하기
  const handleAcknowledgeExpired = () => {
    if (!activeAppointment) return;

    // localStorage에서 약속 ID 제거
    localStorage.removeItem('appointmentId');

    // 상태 초기화
    setActiveAppointment(null);

    // 토스트 메시지
    alert('다음 주말은 놓치지 마라. 🌙');
  };

  useEffect(() => {
    // 쿨타임 체크 (초기 + 1초마다)
    checkCooldown();
    const cooldownInterval = setInterval(checkCooldown, 1000);

    const init = async () => {
      try {
        setLoading(true);

        // 위치 설정 가드: localStorage에 위치가 없으면 /location으로 리다이렉트
        const savedLocation = localStorage.getItem('user_location');
        if (!savedLocation) {
          console.warn('⚠️ 저장된 위치가 없음 -> 위치 설정 페이지로 리다이렉트');
          navigate('/location');
          return;
        }

        if (isLoggedIn) {
          try {
            const scheduledAt = getDefaultDateTime();

            // 병렬 API 호출 (Promise.all로 효율적 처리)
            const [userInfo, appointments, mission] = await Promise.all([
              getMyInfo().catch(() => null),
              getMyAppointments().catch(() => []),
              getTodayMission(undefined, scheduledAt).catch(() => null),
            ]);

            // 사용자 이름 설정
            if (userInfo) {
              setUserName(userInfo.nickname || userInfo.email?.split('@')[0] || '거기');
            } else {
              setUserName('친구');
            }

            // 진행 중인 약속 확인 (리다이렉트 없이 state에만 저장)
            if (Array.isArray(appointments)) {
              // 1. 먼저 EXPIRED 약속 확인
              const expiredAppointment = appointments.find(
                (apt) => apt.status === 'EXPIRED' && apt.missionTitle
              );

              if (expiredAppointment) {
                setActiveAppointment(expiredAppointment);
              } else {
                // 2. EXPIRED가 없으면 진행 중인 약속 찾기
                const foundAppointment = appointments.find(
                  (apt) =>
                    (apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.ACCEPTED) &&
                    apt.missionTitle
                );
                setActiveAppointment(foundAppointment || null);
              }
            }

            // 오늘의 미션 설정
            if (mission) {
              setTodayMission(mission);
            }

          } catch (err) {
            localStorage.removeItem('token');
            setUserName('친구');
          }
        } else {
          setUserName('친구');

          try {
            const scheduledAt = getDefaultDateTime();
            const mission = await getTodayMission(undefined, scheduledAt);
            setTodayMission(mission);
          } catch (err) {
            // 로그인하지 않은 경우 미션 로딩 실패는 무시
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => clearInterval(cooldownInterval);
  }, [isLoggedIn, navigate]);

  // 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-deep-charcoal">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="text-2xl text-off-white font-bold mb-4"
        >
          📮
        </motion.div>
        <p className="text-xl text-text-gray">오늘의 코스 탐색 중...</p>
      </div>
    );
  }

  // 미션 로딩 실패
  if (!todayMission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-deep-charcoal px-4">
        <p className="text-xl text-text-gray mb-6">미션을 불러올 수 없어.</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-charcoal flex flex-col overflow-hidden">
      {/* ===== Header: 인사 멘트 ===== */}
      <header className="container-solotion py-6 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-1"
        >
          <span className="text-off-white text-2xl font-extra-bold">
            야, {userName}!
          </span>
          <span className="text-text-gray text-base">
            이번 주말엔 여기 어때?
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl"
        >
          📮
        </motion.div>
      </header>

      {/* ===== Main: The Letter ===== */}
      <main className="flex-1 flex items-center justify-center px-4 py-4 pb-44">
        <AnimatePresence mode="wait">
          {/* EXPIRED 약속이 있으면 "Missed" 카드 표시 */}
          {activeAppointment && activeAppointment.status === 'EXPIRED' ? (
            <motion.div
              key="expired-mission"
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -60, scale: 0.9 }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full max-w-3xl min-h-[500px] max-h-[75vh] flex flex-col"
            >
              {/* 만료 카드 - The "Missed" Card */}
              <div className="card overflow-hidden flex-1 flex flex-col relative shadow-2xl border-2 border-text-gray-dark/30">
                {/* 찢어진 티켓 효과 헤더 */}
                <div className="bg-text-gray-dark/20 border-b-2 border-dashed border-text-gray-dark/50 px-6 py-4">
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-text-gray text-lg font-bold italic"
                  >
                    바람 맞으니까 시원하냐?
                  </motion.p>
                </div>

                {/* 고화질 이미지 (블라인드 제거) */}
                <div className="relative flex-1 overflow-hidden">
                  <motion.img
                    initial={{ scale: 1.05, filter: 'blur(0px)' }}
                    animate={{ scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2 }}
                    src={activeAppointment.placeImageUrl || activeAppointment.missionImageUrl || 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80'}
                    alt={activeAppointment.missionTitle}
                    className="w-full h-full object-cover grayscale brightness-[0.6]"
                  />
                  {/* 어두운 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal via-deep-charcoal/60 to-transparent" />

                  {/* 중앙 텍스트 */}
                  <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-12">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.7 }}
                      className="text-center space-y-4"
                    >
                      <h2 className="text-off-white text-2xl sm:text-4xl font-extra-bold tracking-tight leading-tight drop-shadow-lg">
                        어제 널 위해 준비한 곳은
                      </h2>
                      <p className="text-electric-lime text-3xl sm:text-5xl font-black">
                        {activeAppointment.placeName || '비밀의 장소'}
                      </p>
                      <p className="text-text-gray text-lg sm:text-xl italic">
                        평점 4.8점짜리인데.. 쯧.
                      </p>
                    </motion.div>
                  </div>

                  {/* 만료 도장 */}
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: -12 }}
                    transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                    className="absolute top-8 right-8 bg-red-500/90 text-white px-6 py-3 rounded-lg border-4 border-red-600 shadow-xl transform rotate-[-12deg]"
                  >
                    <p className="text-2xl font-black tracking-wider">EXPIRED</p>
                  </motion.div>
                </div>

                {/* 하단 정보 */}
                <div className="p-6 sm:p-8 space-y-4 bg-charcoal-soft/90 backdrop-blur-sm">
                  {/* 미션 타이틀 */}
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-text-gray text-xl sm:text-2xl font-bold tracking-tight line-through"
                  >
                    {activeAppointment.missionTitle}
                  </motion.h3>

                  {/* 시간 & 장소 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="flex items-center gap-4 text-text-gray-dark text-base"
                  >
                    <span className="flex items-center gap-2">
                      <span>🕒</span>
                      <span className="font-semibold">
                        {new Date(activeAppointment.scheduledAt).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="font-semibold">
                        {activeAppointment.placeName || '비밀의 장소'}
                      </span>
                    </span>
                  </motion.div>

                  {/* 정리하기 버튼 */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    onClick={handleAcknowledgeExpired}
                    className="btn-ghost w-full mt-4 text-base py-3 border-2 border-text-gray-dark/50 hover:border-electric-lime/50 hover:text-electric-lime transition-all"
                  >
                    아쉬워요, 다음엔 꼭 갈게 (카드 치우기)
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            // 일반 미션 카드
            <motion.div
              key={`mission-${todayMission.id}`}
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -60, scale: 0.9 }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full max-w-3xl min-h-[500px] max-h-[75vh] flex flex-col"
            >
              {/* 미션 카드 - The Letter */}
              <div className="card overflow-hidden flex-1 flex flex-col relative group shadow-2xl">
              {/* 히어로 이미지 (dimmed) */}
              <div className="relative flex-1 overflow-hidden">
                <motion.img
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.2 }}
                  src={todayMission.imageUrl || 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80'}
                  alt={todayMission.title}
                  className="w-full h-full object-cover brightness-[0.4] group-hover:brightness-[0.5] transition-all duration-700"
                />
                {/* 강한 그라데이션 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal via-deep-charcoal/70 to-transparent" />

                {/* 중앙 블라인드 멘트 (히어로 텍스트) */}
                <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-12">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.7 }}
                    className="text-off-white text-3xl sm:text-5xl font-extra-bold tracking-tight text-center leading-tight drop-shadow-lg"
                  >
                    {todayMission.description}
                  </motion.h2>
                </div>
              </div>

              {/* 하단 정보 */}
              <div className="p-6 sm:p-8 space-y-4 bg-charcoal-soft/90 backdrop-blur-sm">
                {/* 미션 타이틀 */}
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-electric-lime text-xl sm:text-2xl font-bold tracking-tight"
                >
                  {todayMission.title}
                </motion.h3>

                {/* 시간 & 장소 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="flex items-center gap-4 text-text-gray text-lg"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-electric-lime">🕒</span>
                    <span className="font-semibold">{todayMission.timeToMeet || '오후 3:00'}</span>
                  </span>
                  <span className="text-text-gray-dark">·</span>
                  <span className="flex items-center gap-2">
                    <span className="text-electric-lime">📍</span>
                    <span className="font-semibold">
                      {todayMission.location?.name || todayMission.location?.address || '성수역'}
                    </span>
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ===== Fixed Bottom CTA (Always Visible) ===== */}
      {/* EXPIRED 약속이 있으면 CTA 버튼 숨김 */}
      {!(activeAppointment && activeAppointment.status === 'EXPIRED') && (
        <footer className="fixed bottom-0 left-0 right-0 bg-charcoal-soft/95 backdrop-blur-lg border-t border-charcoal-lighter p-6 pb-8">
          {/* Primary Action Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            onClick={handlePrimaryAction}
            disabled={isCreating || loading || isCooldown}
            className={`w-full text-xl sm:text-2xl py-4 disabled:cursor-not-allowed transition-all ${
              isCooldown
                ? 'bg-charcoal-lighter text-text-gray-dark cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {isCreating || loading
              ? '준비 중...'
              : isCooldown
              ? `에너지 충전 중... (${cooldownRemaining} 남음) 🌙`
              : activeAppointment
              ? '약속 확인하러 가기 🚀'
              : '좋아, 나갈게'}
          </motion.button>

          {/* Secondary Action Button (Only show if no active appointment) */}
          {!activeAppointment && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            onClick={handleRejectMission}
            disabled={isCreating}
            className="btn-ghost w-full text-base mt-3"
          >
            오늘은 쉴래
          </motion.button>
        )}

        {/* Dev Cooldown Test Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          onClick={handleDevSetCooldown}
          className="w-full text-xs text-electric-lime/50 hover:text-electric-lime/70 mt-3 py-2 transition-colors"
        >
          [DEV] 쿨타임 10초 테스트
        </motion.button>

        {/* Dev Reset Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          onClick={() => {
            if (confirm('개발용 리셋: 모든 데이터를 초기화하고 온보딩으로 돌아갈까?')) {
              localStorage.clear();
              navigate('/chat');
            }
          }}
          className="w-full text-xs text-text-gray-dark/50 hover:text-text-gray/70 mt-2 py-2 transition-colors"
        >
          [DEV] 처음부터 다시 하기
        </motion.button>
        </footer>
      )}

      {/* ===== 시간 선택 모달 ===== */}
      <AnimatePresence>
        {showTimePickerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTimePickerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-charcoal-soft rounded-solotion-lg max-w-md w-full p-6 space-y-6"
            >
              {/* 헤더 */}
              <div className="text-center space-y-2">
                <h3 className="text-off-white text-2xl font-extra-bold">언제 나갈 거야?</h3>
                <p className="text-text-gray text-sm">약속 시간을 정해줘</p>
              </div>

              {/* 시간 선택 (datetime-local input) */}
              <div className="space-y-3">
                <label className="text-electric-lime font-semibold text-sm">📅 약속 날짜 & 시간</label>
                <input
                  type="datetime-local"
                  value={selectedDateTime}
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full bg-charcoal-lighter border border-electric-lime/30 rounded-lg px-4 py-3 text-off-white focus:outline-none focus:border-electric-lime transition-colors"
                />
              </div>

              {/* 버튼들 */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleCreateAppointment}
                  disabled={isCreating}
                  className="btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '준비 중...' : '확인'}
                </button>
                <button
                  onClick={() => setShowTimePickerModal(false)}
                  disabled={isCreating}
                  className="btn-ghost hover:bg-charcoal-lighter/50 disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MissionList;
