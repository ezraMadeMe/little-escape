import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createAppointment, getMyAppointments } from '../api/appointmentApi';
import { getMyInfo } from '../api/userApi';
import { getTodayMission } from '../api/missionApi';
import { AppointmentStatus, Appointment } from '../types/appointment';
import { Mission } from '../types/mission';
import { format } from 'date-fns';

function MissionList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>('');
  const [todayMission, setTodayMission] = useState<Mission | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  // 토큰 존재 여부로 로그인 상태 확인
  const isLoggedIn = !!localStorage.getItem('token');

  // 내일 오후 3시로 기본 시간 설정
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

  const handlePrimaryAction = async () => {
    // Case A: 로딩 중이면 아무것도 안 함 (버튼이 disabled 상태)
    if (isCreating || loading) {
      return;
    }

    // Case B: 이미 약속이 있으면 -> 약속 상세 페이지로 이동 (API 호출 X)
    if (activeAppointment) {
      navigate(`/mission/${activeAppointment.id}`);
      return;
    }

    // Case C: 약속 없음 -> 새로운 약속 생성
    if (!isLoggedIn) {
      alert('로그인이 필요해.');
      navigate('/login');
      return;
    }

    try {
      setIsCreating(true);

      // 1. 사용자 위치 가져오기 (localStorage 우선)
      let userLat: number | null = null;
      let userLon: number | null = null;

      // localStorage에서 저장된 위치 먼저 확인
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

      // localStorage에 위치가 없으면 위치 설정 페이지로 리다이렉트
      if (!userLat || !userLon) {
        console.warn('⚠️ 저장된 위치가 없음 -> 위치 설정 페이지로 이동');
        navigate('/location');
        return;
      }

      // 2. API 호출 (약속 생성)
      const scheduledAt = getDefaultDateTime();
      const dateTime = new Date(scheduledAt);
      const scheduledAtString = format(dateTime, "yyyy-MM-dd'T'HH:mm:ss");

      const appointment = await createAppointment({
        scheduledAt: scheduledAtString,
        userLatitude: userLat,
        userLongitude: userLon,
      });

      // 3. 성공 직후 상세 페이지로 이동 (window.location.reload 사용 X)
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

  useEffect(() => {
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
              const foundAppointment = appointments.find(
                (apt) =>
                  (apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.ACCEPTED) &&
                  apt.missionTitle
              );

              setActiveAppointment(foundAppointment || null);
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
        </AnimatePresence>
      </main>

      {/* ===== Fixed Bottom CTA (Always Visible) ===== */}
      <footer className="fixed bottom-0 left-0 right-0 bg-charcoal-soft/95 backdrop-blur-lg border-t border-charcoal-lighter p-6 pb-8">
        {/* Primary Action Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          onClick={handlePrimaryAction}
          disabled={isCreating || loading}
          className="btn-primary w-full text-xl sm:text-2xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating || loading
            ? '준비 중...'
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
          className="w-full text-xs text-text-gray-dark/50 hover:text-text-gray/70 mt-4 py-2 transition-colors"
        >
          [DEV] 처음부터 다시 하기
        </motion.button>
      </footer>
    </div>
  );
}

export default MissionList;
