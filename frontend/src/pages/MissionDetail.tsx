import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppointmentDetail, completeAppointment, markAsArrived, swapMission } from '../api/appointmentApi';
import { Appointment } from '../types/appointment';
import { PlanB } from '../types/mission';
import { supabase } from '../lib/supabaseClient';

// 가이드 스텝 인터페이스
interface GuideStep {
  icon: string;
  title: string;
  desc: string;
}

// 아이콘 매핑
const ICON_MAP: Record<string, string> = {
  WALK: '🚶',
  DRINK: '🍹',
  COFFEE: '☕',
  BOOK: '📚',
  HIKE: '⛰️',
  REST: '🧘',
  DESSERT: '🍰',
  EAT: '🍽️',
  VIEW: '🌆',
  PHOTO: '📸',
};

// Mock 데이터 - 실제로는 API에서 가져와야 함
const MOCK_PREPARATIONS = ['편한 신발', '물', '여유로운 마음'];
const MOCK_DETAILED_COURSE = '1. 성수역 3번 출구에서 도보 5분\n2. 골목길을 따라 왼쪽으로 돌아\n3. 빨간 간판이 보이면 2층으로 올라가면 돼';
const MOCK_TASKS = ['창가 자리에 앉아보기', '메뉴판 없이 주인장에게 추천받기', '30분 이상 머물러보기'];
const MOCK_PLAN_B: PlanB = {
  title: '대형 서점에서 책 구경하기',
  description: '혼자만의 조용한 시간을 보낼 수 있는 실내 공간이에요.',
  placeName: '교보문고 강남점',
  placeAddress: '서울특별시 강남구 역삼동 테헤란로',
  placeUrl: 'https://map.kakao.com',
  imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80',
  reason: '이 코스 별로야? ...뭐, 그럴 줄 알았어. 이건 어때?',
};

function MissionDetail() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [proofComment, setProofComment] = useState<string>('');
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 감성 키워드 옵션
  const EMOTION_KEYWORDS = [
    '힐링됐어', '재밌었어', '새로웠어', '설렜어',
    '편안했어', '뿌듯했어', '감동적이었어', '즐거웠어'
  ];

  // 도착 인증 로딩 상태
  const [isArrivingLoading, setIsArrivingLoading] = useState<boolean>(false);

  // 도착 인증 성공 모달 상태
  const [showArrivalSuccessModal, setShowArrivalSuccessModal] = useState<boolean>(false);

  // Plan B 모달 상태
  const [showPlanBModal, setShowPlanBModal] = useState<boolean>(false);

  // 미션 교체 로딩 상태
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  // 긍정 강화 토스트 상태
  const [showPositiveToast, setShowPositiveToast] = useState<boolean>(false);

  // 스크롤 감지 상태
  const [isScrollingDown, setIsScrollingDown] = useState<boolean>(false);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  // 가이드 파싱
  const parseGuide = (guideJson?: string): GuideStep[] => {
    if (!guideJson) return [];
    try {
      return JSON.parse(guideJson) as GuideStep[];
    } catch (e) {
      console.error('Failed to parse guide JSON:', e);
      return [];
    }
  };

  useEffect(() => {
    const loadAppointment = async () => {
      if (!appointmentId) {
        alert('약속 ID가 없어.');
        navigate('/appointments');
        return;
      }

      try {
        const data = await getAppointmentDetail(Number(appointmentId));
        setAppointment(data);
      } catch (err) {
        console.error('약속 로딩 실패:', err);
        alert('약속 정보를 불러오는데 실패했어.');
        navigate('/appointments');
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId, navigate]);

  // 스크롤 감지 (Smart Scroll Buttons)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 스크롤 방향 감지 (50px 이상 이동 시에만 반응)
      if (Math.abs(currentScrollY - lastScrollY) > 50) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // 아래로 스크롤 중
          setIsScrollingDown(true);
        } else {
          // 위로 스크롤 중
          setIsScrollingDown(false);
        }
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // D-Day 계산
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

  // 상세 시간 카운트다운
  const getDetailedTimeRemaining = (scheduledAt: string): string => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diffMs = scheduled.getTime() - now.getTime();

    if (diffMs < 0) {
      return '시간이 됐어';
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}일 ${remainingHours}시간 남음`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes}분 남음`;
    } else {
      return `${minutes}분 남음`;
    }
  };

  // D-Day 여부 체크
  const isPlaceUnlocked = (scheduledAt: string): boolean => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    now.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);
    return now >= scheduled;
  };

  // 점진적 블라인드 로직 (Progressive Unlock)
  const getUnlockProgress = (scheduledAt: string): {
    progress: number; // 0~100 (%)
    blurAmount: number; // blur-[0~10]px
    opacity: number; // 0~1
    message: string;
  } => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const totalMs = 24 * 60 * 60 * 1000; // 24시간을 밀리초로
    const remainingMs = scheduled.getTime() - now.getTime();

    // 이미 D-Day 지남 또는 당일
    if (remainingMs <= 0) {
      return { progress: 100, blurAmount: 0, opacity: 1, message: '완전 공개!' };
    }

    // 진행률 계산 (0~100%)
    const progress = Math.max(0, Math.min(100, ((totalMs - remainingMs) / totalMs) * 100));

    // 단계별 점진적 공개
    if (progress >= 75) {
      // 75%~100%: 거의 다 공개 (blur 약함)
      return {
        progress,
        blurAmount: 2,
        opacity: 0.9,
        message: '곧 공개돼. 조금만 기다려봐.',
      };
    } else if (progress >= 50) {
      // 50%~75%: 반쯤 공개 (힌트 1개 노출)
      return {
        progress,
        blurAmount: 5,
        opacity: 0.6,
        message: '반은 공개됐어. 어디인지 감 오지?',
      };
    } else if (progress >= 25) {
      // 25%~50%: 약간 공개 (흐릿하게 보임)
      return {
        progress,
        blurAmount: 8,
        opacity: 0.3,
        message: '조금씩 보이기 시작해.',
      };
    } else {
      // 0%~25%: 거의 비공개
      return {
        progress,
        blurAmount: 10,
        opacity: 0.1,
        message: '🔒 아직 멀었어. 24시간 전부터 공개돼.',
      };
    }
  };

  // 미션 교체 핸들러
  const handleSwapMission = async () => {
    if (!appointment) return;

    setIsSwapping(true);
    try {
      // 1. Swap API 호출
      const updatedAppointment = await swapMission(appointment.id);

      // 2. 약속 데이터 갱신
      setAppointment(updatedAppointment);

      // 3. 모달 닫기
      setShowPlanBModal(false);

      // 4. 성공 토스트 메시지
      alert('새로운 루트로 변경 완료! 🎉');
    } catch (err) {
      console.error('미션 교체 실패:', err);
      alert('미션 교체에 실패했어. 다시 시도해봐.');
    } finally {
      setIsSwapping(false);
    }
  };

  // 원래대로 할게 핸들러 (긍정 강화)
  const handleKeepOriginal = () => {
    setShowPlanBModal(false);
    setShowPositiveToast(true);

    // 3초 후 토스트 자동 숨김
    setTimeout(() => {
      setShowPositiveToast(false);
    }, 3000);
  };

  // 도착 인증 (백엔드 API 호출)
  const handleArrivalCheck = async () => {
    if (!appointment) return;

    try {
      setIsArrivingLoading(true);

      // 1. 백엔드 API 호출
      await markAsArrived(appointment.id);

      // 2. 성공 후 약속 데이터 다시 불러오기 (Re-fetch)
      const updatedAppointment = await getAppointmentDetail(appointment.id);
      setAppointment(updatedAppointment);

      // 3. 폭죽 효과 (Dynamic Import로 성능 최적화)
      const confetti = (await import('canvas-confetti')).default;

      // 화면 중앙에서 폭죽 발사 (3초간)
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#D4FF00', '#00FF88', '#FF6B00', '#FF0088'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      // 4. 햅틱 피드백 (모바일만)
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]); // 징- 징-
      }

      // 5. 성공 모달 표시
      setShowArrivalSuccessModal(true);
    } catch (err) {
      console.error('도착 인증 실패:', err);
      alert('도착 인증에 실패했어. 다시 시도해봐.');
    } finally {
      setIsArrivingLoading(false);
    }
  };

  // 이미지 선택
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능해.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 해.');
      return;
    }

    setProofImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProofImageFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 미션 완료
  const handleComplete = async () => {
    if (!appointment) return;

    if (!proofImageFile) {
      alert('인증 사진을 업로드해줘!');
      return;
    }

    try {
      setIsUploading(true);

      const userId = appointment.userId || 'unknown';
      const timestamp = Date.now();
      const fileExtension = proofImageFile.name.split('.').pop();
      const filePath = `proofs/${userId}_${appointmentId}_${timestamp}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from('mission-proofs')
        .upload(filePath, proofImageFile);

      if (uploadError) {
        alert('이미지 업로드에 실패했어. 다시 시도해봐.');
        return;
      }

      const keywords = selectedKeywords.length > 0
        ? selectedKeywords
        : ['완료했어'];

      await completeAppointment(
        appointment.id,
        proofComment.trim() || '',
        keywords,
        []
      );

      alert('수고했어!');
      navigate('/appointments');
    } catch (err) {
      alert('완료 처리에 실패했어. 다시 시도해봐.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-charcoal">
        <div className="text-xl text-off-white">잠깐만...</div>
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

  // 서버 데이터 기반으로 도착 여부 판단
  const isArrived = appointment.status === 'ARRIVED' ||
                    appointment.status === 'COMPLETED' ||
                    appointment.status === 'IN_PROGRESS';

  // Timeline Step 상태 계산
  const isStep1Complete = true; // 준비는 항상 활성화
  const isStep2Complete = isArrived;
  const isStep3Unlocked = isArrived;

  return (
    <div className="min-h-screen bg-deep-charcoal flex flex-col pb-24">
      {/* ===== Header ===== */}
      <header className="px-4 sm:px-6 py-6 flex items-center justify-between border-b border-charcoal-lighter sticky top-0 z-20 bg-deep-charcoal/95 backdrop-blur-sm">
        <button
          onClick={() => {
            // Smart Navigation: 이전 페이지로 이동 (location.state?.from 또는 브라우저 히스토리)
            if (location.state?.from) {
              navigate(location.state.from);
            } else {
              navigate(-1);
            }
          }}
          className="flex items-center gap-2 text-text-gray hover:text-off-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold">뒤로</span>
        </button>

        {/* D-Day 라벨 (버튼처럼 보이지 않게) */}
        <div className="bg-electric-lime/20 text-electric-lime px-4 py-2 rounded-solotion font-extra-bold text-lg cursor-default select-none">
          {getDdayText(appointment.scheduledAt)}
        </div>

        {/* 빈 공간 (레이아웃 유지) */}
        <div className="w-20"></div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex-1 container-solotion py-8 space-y-8 overflow-y-auto scrollbar-solotion pb-24">
        {/* 미션 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-off-white text-3xl sm:text-4xl font-extra-bold tracking-tight">
            {appointment.missionTitle || '미션 미선택'}
          </h1>
          <p className="text-text-gray text-lg">
            {new Date(appointment.scheduledAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
            <div className="bg-charcoal-soft px-4 py-3 rounded-solotion inline-block">
              <p className="text-electric-lime font-bold text-lg">
                ⏱️ {getDetailedTimeRemaining(appointment.scheduledAt)}
              </p>
            </div>
          )}
        </motion.div>

        {/* 썸네일 이미지 */}
        {backgroundImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-64 sm:h-80 rounded-solotion overflow-hidden"
          >
            <img
              src={backgroundImage}
              alt={appointment.missionTitle || '미션'}
              className="w-full h-full object-cover brightness-75"
            />
          </motion.div>
        )}

        {/* ===== VERTICAL TIMELINE ===== */}
        <div className="space-y-0">
          {/* STEP 1: 준비 & 출발 (Ready) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-6 relative"
          >
            {/* Timeline Node & Line */}
            <div className="flex flex-col items-center">
              {/* Node */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl border-4 transition-all duration-500 ${
                  isStep1Complete
                    ? 'bg-electric-lime border-electric-lime shadow-lg shadow-electric-lime/50'
                    : 'bg-charcoal-lighter border-charcoal-lighter'
                }`}
              >
                🎒
              </div>
              {/* Vertical Line */}
              <div className="w-1 flex-1 min-h-[80px] bg-gradient-to-b from-electric-lime to-charcoal-lighter"></div>
            </div>

            {/* Content */}
            <div className="flex-1 pb-12">
              <div className="card space-y-4">
                <h3 className="text-off-white text-2xl font-bold flex items-center gap-2">
                  준비 & 출발
                </h3>
                <p className="text-text-gray">출발하기 전에 챙겨야 할 것들</p>
                <ul className="space-y-2">
                  {MOCK_PREPARATIONS.map((item, idx) => (
                    <li key={idx} className="text-text-gray flex items-center gap-2">
                      <span className="text-electric-lime">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* STEP 2: 이동 & 도착 (Move) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-6 relative"
          >
            {/* Timeline Node & Line */}
            <div className="flex flex-col items-center">
              {/* Node */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl border-4 transition-all duration-500 ${
                  isStep2Complete
                    ? 'bg-electric-lime border-electric-lime shadow-lg shadow-electric-lime/50'
                    : unlocked
                    ? 'bg-charcoal-soft border-electric-lime/50'
                    : 'bg-charcoal-lighter border-charcoal-lighter'
                }`}
              >
                {isStep2Complete ? '✅' : '📍'}
              </div>
              {/* Vertical Line */}
              <div
                className={`w-1 flex-1 min-h-[80px] transition-all duration-500 ${
                  isStep2Complete
                    ? 'bg-gradient-to-b from-electric-lime to-charcoal-lighter'
                    : 'bg-charcoal-lighter'
                }`}
              ></div>
            </div>

            {/* Content */}
            <div className="flex-1 pb-12">
              <div
                className={`card space-y-4 transition-all duration-500 ${
                  unlocked ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <h3 className="text-off-white text-2xl font-bold flex items-center gap-2">
                  이동 & 도착
                </h3>

                {unlocked ? (
                  <>
                    <p className="text-text-gray text-lg font-semibold">
                      {appointment.placeName || '장소 정보 없음'}
                    </p>
                    <p className="text-text-gray-dark text-sm">
                      {appointment.placeAddress || '주소 정보 없음'}
                    </p>

                    {/* 지도 버튼 - 카카오맵 통일 */}
                    <div className="w-full">
                      <a
                        href={
                          appointment.latitude && appointment.longitude
                            ? `https://map.kakao.com/link/to/${encodeURIComponent(appointment.placeName || '목적지')},${appointment.latitude},${appointment.longitude}`
                            : `https://map.kakao.com/link/search/${encodeURIComponent(appointment.placeName || '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center justify-center gap-2 text-sm w-full"
                      >
                        🗺️ 카카오맵으로 길찾기
                      </a>
                    </div>

                    {/* 도착 인증 버튼 */}
                    {!isArrived && (
                      <button
                        onClick={handleArrivalCheck}
                        disabled={isArrivingLoading}
                        className="btn-outline w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isArrivingLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span>인증 중...</span>
                          </>
                        ) : (
                          <>📍 도착 인증하기</>
                        )}
                      </button>
                    )}

                    {isArrived && (
                      <div className="bg-electric-lime/10 border border-electric-lime/30 rounded-solotion p-3 text-center">
                        <p className="text-electric-lime font-bold">✅ 도착 인증 완료!</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative">
                    {/* 점진적 블라인드 처리 */}
                    {(() => {
                      const unlockStatus = getUnlockProgress(appointment.scheduledAt);
                      return (
                        <>
                          {/* 흐릿한 장소 정보 (힌트) */}
                          <div
                            className="space-y-3 transition-all duration-700"
                            style={{
                              filter: `blur(${unlockStatus.blurAmount}px)`,
                              opacity: unlockStatus.opacity,
                            }}
                          >
                            <p className="text-text-gray text-lg font-semibold select-none">
                              {appointment.placeName || '장소 정보 없음'}
                            </p>
                            <p className="text-text-gray-dark text-sm select-none">
                              {appointment.placeAddress || '주소 정보 없음'}
                            </p>
                          </div>

                          {/* 진행 바 */}
                          <div className="mt-6 space-y-2">
                            <div className="w-full bg-charcoal-lighter rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-electric-lime h-full transition-all duration-500"
                                style={{ width: `${unlockStatus.progress}%` }}
                              />
                            </div>
                            <p className="text-text-gray text-xs text-center">
                              {unlockStatus.message}
                            </p>
                          </div>

                          {/* 잠금 아이콘 */}
                          <div className="text-center py-4">
                            <div className="text-4xl mb-2">
                              {unlockStatus.progress >= 75 ? '🔓' : unlockStatus.progress >= 50 ? '🔐' : '🔒'}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* STEP 3: 미션 수행 (Action) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-6 relative"
          >
            {/* Timeline Node (No Line - Last Step) */}
            <div className="flex flex-col items-center">
              {/* Node */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl border-4 transition-all duration-500 ${
                  isStep3Unlocked
                    ? 'bg-electric-lime border-electric-lime shadow-lg shadow-electric-lime/50'
                    : 'bg-charcoal-lighter border-charcoal-lighter'
                }`}
              >
                🔥
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div
                className={`card space-y-6 relative transition-all duration-500 ${
                  isStep3Unlocked ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <h3 className="text-off-white text-2xl font-bold flex items-center gap-2">
                  미션 수행
                </h3>

                {isStep3Unlocked ? (
                  <>
                    {/* 단계별 코스 가이드 */}
                    {appointment.missionGuide && parseGuide(appointment.missionGuide).length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-electric-lime text-lg font-bold">🗺️ 오늘의 코스</h4>
                        <div className="space-y-4">
                          {parseGuide(appointment.missionGuide).map((step, index) => (
                            <div key={index} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-electric-lime/20 border-2 border-electric-lime flex items-center justify-center text-xl">
                                  {ICON_MAP[step.icon] || '📍'}
                                </div>
                                {index < parseGuide(appointment.missionGuide).length - 1 && (
                                  <div className="w-0.5 h-full min-h-[40px] bg-electric-lime/30 mt-2"></div>
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <h5 className="text-off-white font-bold mb-1">{step.title}</h5>
                                <p className="text-text-gray text-sm leading-relaxed">{step.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 상세 코스 */}
                    <div className="space-y-3">
                      <h4 className="text-electric-lime text-lg font-bold">🗺️ 상세 코스</h4>
                      <motion.div
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 0.5 }}
                        className="text-text-gray whitespace-pre-line text-sm bg-charcoal-soft/50 p-4 rounded-lg"
                      >
                        {MOCK_DETAILED_COURSE}
                      </motion.div>
                    </div>

                    {/* 할 일 */}
                    <div className="space-y-3">
                      <h4 className="text-electric-lime text-lg font-bold">✅ 할 일</h4>
                      <motion.ul
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 0.5 }}
                        className="space-y-2"
                      >
                        {MOCK_TASKS.map((task, idx) => (
                          <li key={idx} className="text-text-gray flex items-start gap-2 text-sm">
                            <span className="text-electric-lime mt-1">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </motion.ul>
                    </div>

                    {/* 인증 섹션 */}
                    {unlocked && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                      <div className="space-y-6 pt-4 border-t border-charcoal-lighter">
                        <h4 className="text-electric-lime text-lg font-bold">📸 인증하기</h4>

                        {/* 이미지 업로드 */}
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />

                          {!previewUrl ? (
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full h-48 border-2 border-dashed border-charcoal-lighter rounded-solotion hover:border-electric-lime transition-all flex flex-col items-center justify-center gap-3"
                            >
                              <div className="text-5xl">📷</div>
                              <p className="text-text-gray">사진 추가</p>
                            </button>
                          ) : (
                            <div className="relative">
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-64 object-cover rounded-solotion"
                              />
                              <button
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 bg-charcoal-soft/90 text-off-white p-2 rounded-solotion hover:bg-charcoal-lighter"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 코멘트 */}
                        <textarea
                          value={proofComment}
                          onChange={(e) => setProofComment(e.target.value)}
                          placeholder="오늘의 작은 일탈은 어땠어?"
                          className="input w-full h-32 resize-none"
                        />

                        {/* 감성 키워드 선택 */}
                        <div>
                          <label className="block text-sm font-medium text-text-gray mb-2">
                            어땠어? (선택사항)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {EMOTION_KEYWORDS.map((keyword) => (
                              <button
                                key={keyword}
                                type="button"
                                onClick={() => {
                                  if (selectedKeywords.includes(keyword)) {
                                    setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
                                  } else {
                                    setSelectedKeywords([...selectedKeywords, keyword]);
                                  }
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                  selectedKeywords.includes(keyword)
                                    ? 'bg-electric-lime text-deep-charcoal'
                                    : 'bg-charcoal-soft text-text-gray hover:bg-charcoal-lighter'
                                }`}
                              >
                                {keyword}
                              </button>
                            ))}
                          </div>
                          {selectedKeywords.length === 0 && (
                            <p className="text-xs text-text-gray-dark mt-2">
                              * 선택하지 않으면 기본 키워드로 저장돼
                            </p>
                          )}
                        </div>

                        {/* 완료 버튼 */}
                        <button
                          onClick={handleComplete}
                          disabled={isUploading || !proofImageFile}
                          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? '업로드 중...' : '✅ 완료'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative">
                    {/* Blurred Content */}
                    <div className="blur-md select-none pointer-events-none space-y-4">
                      <div className="h-20 bg-charcoal-lighter/50 rounded-lg"></div>
                      <div className="h-32 bg-charcoal-lighter/50 rounded-lg"></div>
                      <div className="h-24 bg-charcoal-lighter/50 rounded-lg"></div>
                    </div>
                    {/* Lock Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-charcoal-soft/90 rounded-solotion">
                      <div className="text-center space-y-3">
                        <div className="text-6xl">🔒</div>
                        <p className="text-off-white font-bold text-lg">도착하면 잠금 해제</p>
                        <p className="text-text-gray text-sm">장소에 도착한 후 인증해봐</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 완료 상태 표시 */}
        {appointment.status === 'COMPLETED' && (
          <div className="card bg-electric-lime/10 border-electric-lime/30">
            <p className="text-electric-lime font-bold text-xl text-center">
              ✅ 완료된 미션이야!
            </p>
            {appointment.proofComment && (
              <p className="text-text-gray text-center mt-2 italic">"{appointment.proofComment}"</p>
            )}
          </div>
        )}
      </main>

      {/* ===== Feed Button (약속 구경) ===== */}
      {/* ===== 하단 액션 버튼 그룹 (Smart Scroll) ===== */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isScrollingDown ? '120%' : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-6 right-4 sm:right-6 z-40 flex flex-col gap-3"
      >
        {/* 피드 구경 버튼 */}
        <motion.button
          onClick={() => navigate('/feed')}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1"
        >
          <div className="bg-electric-lime text-deep-charcoal px-5 sm:px-6 py-3 sm:py-4 rounded-full shadow-2xl font-bold text-sm sm:text-base whitespace-nowrap flex items-center justify-center gap-2">
            <span>📸</span>
            <span>피드 구경</span>
          </div>
        </motion.button>

        {/* 다른 거 할래 버튼 */}
        {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
          <motion.button
            onClick={() => setShowPlanBModal(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 group"
          >
            {/* Glassmorphism 버튼 */}
            <div className="relative">
              {/* 네온 글로우 효과 */}
              <div className="absolute inset-0 bg-electric-lime/30 blur-xl rounded-full animate-pulse"></div>

              {/* 메인 버튼 */}
              <div className="relative backdrop-blur-xl bg-charcoal-soft/80 border-2 border-electric-lime/50 rounded-full shadow-2xl overflow-hidden">
                {/* 호버 시 배경 효과 */}
                <div className="absolute inset-0 bg-gradient-to-br from-electric-lime/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* 버튼 콘텐츠 */}
                <div className="relative px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-3">
                  {/* 비상구 아이콘 */}
                  <div className="text-2xl animate-bounce">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 text-electric-lime"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>

                  {/* 텍스트 라벨 */}
                  <span className="text-off-white font-bold text-sm sm:text-base whitespace-nowrap">
                    이거 말고
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        )}
      </motion.div>

      {/* ===== Arrival Success Modal ===== */}
      <AnimatePresence>
        {showArrivalSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowArrivalSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-charcoal-soft rounded-solotion-lg max-w-md w-full overflow-hidden border-2 border-electric-lime/50 shadow-2xl"
            >
              {/* 콘텐츠 */}
              <div className="p-8 space-y-6 text-center">
                {/* 대형 이모지 애니메이션 */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="text-8xl"
                >
                  🎉
                </motion.div>

                {/* 타이틀 */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-off-white text-3xl font-extra-bold"
                >
                  오, 진짜 왔네?
                </motion.h3>

                {/* 설명 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <p className="text-text-gray text-lg leading-relaxed">
                    생각보다 빠르네. 이제 블라인드를 걷어줄게.
                  </p>
                  <p className="text-electric-lime text-base font-semibold">
                    확인해봐.
                  </p>
                </motion.div>

                {/* 버튼 */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => setShowArrivalSuccessModal(false)}
                  className="btn-primary w-full py-4 text-lg font-bold"
                >
                  미션 확인하기 🔥
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 긍정 강화 토스트 ===== */}
      <AnimatePresence>
        {showPositiveToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[60] pointer-events-none"
          >
            <div className="bg-electric-lime text-deep-charcoal px-6 py-4 rounded-solotion-lg shadow-2xl border-2 border-electric-lime flex items-center gap-3">
              <span className="text-2xl">👍</span>
              <p className="font-extra-bold text-lg">잘 생각했어! 이 코스가 너한테 딱이야</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Plan B Modal ===== */}
      <AnimatePresence>
        {showPlanBModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPlanBModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-charcoal-soft rounded-solotion-lg max-w-lg w-full overflow-hidden"
            >
              {/* 이미지 */}
              {MOCK_PLAN_B.imageUrl && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={MOCK_PLAN_B.imageUrl}
                    alt={MOCK_PLAN_B.title}
                    className="w-full h-full object-cover brightness-75"
                  />
                </div>
              )}

              {/* 콘텐츠 */}
              <div className="p-6 space-y-4">
                <div className="text-center space-y-3">
                  {/* 츤데레 멘트 */}
                  <div className="text-electric-lime text-lg font-semibold italic">"{MOCK_PLAN_B.reason}"</div>
                  <h3 className="text-off-white text-2xl font-extra-bold">{MOCK_PLAN_B.title}</h3>
                </div>

                <div className="bg-charcoal-lighter/50 rounded-lg p-4 border border-electric-lime/20">
                  <p className="text-text-gray leading-relaxed">{MOCK_PLAN_B.description}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-off-white font-semibold">📍 {MOCK_PLAN_B.placeName}</p>
                  {MOCK_PLAN_B.placeAddress && (
                    <p className="text-text-gray-dark text-sm">{MOCK_PLAN_B.placeAddress}</p>
                  )}
                </div>

                {/* 버튼들 */}
                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={handleSwapMission}
                    disabled={isSwapping}
                    className="btn-primary text-center flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSwapping ? '교체 중...' : '🔄 이걸로 할래!'}
                  </button>
                  <button
                    onClick={handleKeepOriginal}
                    disabled={isSwapping}
                    className="btn-ghost hover:bg-charcoal-lighter/50 disabled:opacity-50"
                  >
                    아니야, 원래대로 할게
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MissionDetail;
