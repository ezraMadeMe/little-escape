import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppointmentDetail, completeAppointment, markAsArrived } from '../api/appointmentApi';
import { Appointment } from '../types/appointment';
import { PlanB } from '../types/mission';
import { supabase } from '../lib/supabaseClient';

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

  // Plan B 모달 상태
  const [showPlanBModal, setShowPlanBModal] = useState<boolean>(false);

  useEffect(() => {
    const loadAppointment = async () => {
      if (!appointmentId) {
        alert('약속 ID가 없어.');
        navigate('/mypage');
        return;
      }

      try {
        const data = await getAppointmentDetail(Number(appointmentId));
        setAppointment(data);
      } catch (err) {
        console.error('약속 로딩 실패:', err);
        alert('약속 정보를 불러오는데 실패했어.');
        navigate('/mypage');
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId, navigate]);

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

      // 3. 성공 토스트 메시지
      alert('도착 인증 완료! 🎉\n이제 상세 코스를 볼 수 있어.');
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
      navigate('/mypage');
    } catch (err) {
      alert('완료 처리에 실패했어. 다시 시도해봐.');
    } finally {
      setIsUploading(false);
    }
  };

  // 약속 취소 (향후 취소 버튼 추가 시 사용)
  // const handleCancelAppointment = async () => {
  //   if (!appointment) return;
  //   if (!confirm('정말 이 약속을 취소할 거야?')) return;

  //   try {
  //     await cancelAppointment(appointment.id);
  //     alert('약속이 취소됐어.');
  //     navigate('/appointments');
  //   } catch (error) {
  //     console.error('약속 취소 실패:', error);
  //     alert('약속 취소에 실패했어.');
  //   }
  // };

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

  return (
    <div className="min-h-screen bg-deep-charcoal flex flex-col">
      {/* ===== Header ===== */}
      <header className="container-solotion py-6 flex items-center justify-between border-b border-charcoal-lighter">
        <button
          onClick={() => navigate('/mypage')}
          className="flex items-center gap-2 text-text-gray hover:text-off-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold">뒤로</span>
        </button>

        {/* D-Day 카운터 */}
        <div className="bg-electric-lime text-deep-charcoal px-4 py-2 rounded-solotion font-extra-bold text-lg">
          {getDdayText(appointment.scheduledAt)}
        </div>

        {/* 빈 공간 (레이아웃 유지) */}
        <div className="w-20"></div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex-1 container-solotion py-8 space-y-6 overflow-y-auto scrollbar-solotion pb-24">
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

        {/* 준비물 섹션 - 항상 보임 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card space-y-3"
        >
          <h3 className="text-off-white text-xl font-bold flex items-center gap-2">
            🎒 준비물
          </h3>
          <ul className="space-y-2">
            {MOCK_PREPARATIONS.map((item, idx) => (
              <li key={idx} className="text-text-gray flex items-center gap-2">
                <span className="text-electric-lime">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* 모임 장소 - 항상 보임 (지하철역만) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card space-y-4"
        >
          <h3 className="text-off-white text-xl font-bold flex items-center gap-2">
            📍 모임 장소
          </h3>
          {unlocked ? (
            <>
              <p className="text-text-gray text-lg">
                {appointment.placeName || '장소 정보 없음'}
              </p>
              <p className="text-text-gray-dark">
                {appointment.placeAddress || '주소 정보 없음'}
              </p>

              {/* 카카오맵/네이버맵 링크 버튼 */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {appointment.placeUrl && (
                  <a
                    href={appointment.placeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center justify-center gap-2 text-base"
                  >
                    🗺️ 카카오맵
                  </a>
                )}
                <a
                  href={`https://map.naver.com/v5/search/${encodeURIComponent(appointment.placeName || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center justify-center gap-2 text-base"
                >
                  🗺️ 네이버맵
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>인증 중...</span>
                    </>
                  ) : (
                    <>📍 도착 인증하기</>
                  )}
                </button>
              )}
              {isArrived && (
                <div className="bg-electric-lime/10 border border-electric-lime/30 rounded-solotion p-3 mt-4 text-center">
                  <p className="text-electric-lime font-bold">✅ 도착 인증 완료!</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔒</div>
              <p className="text-text-gray">D-Day가 되면 공개돼.</p>
            </div>
          )}
        </motion.div>

        {/* 상세 코스 - 도착 인증 후에만 보임 (Progressive Disclosure) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card space-y-3 relative"
        >
          <h3 className="text-off-white text-xl font-bold flex items-center gap-2">
            🗺️ 상세 코스
          </h3>
          {isArrived ? (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.5 }}
              className="text-text-gray whitespace-pre-line"
            >
              {MOCK_DETAILED_COURSE}
            </motion.div>
          ) : (
            <div className="relative">
              <div className="blur-md select-none text-text-gray whitespace-pre-line">
                {MOCK_DETAILED_COURSE}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-charcoal-soft/80 rounded-solotion">
                <div className="text-center">
                  <div className="text-4xl mb-2">🔒</div>
                  <p className="text-off-white font-bold">도착 인증 후 공개</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* 할 일 - 도착 인증 후에만 보임 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card space-y-3 relative"
        >
          <h3 className="text-off-white text-xl font-bold flex items-center gap-2">
            ✅ 할 일
          </h3>
          {isArrived ? (
            <motion.ul
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              {MOCK_TASKS.map((task, idx) => (
                <li key={idx} className="text-text-gray flex items-start gap-2">
                  <span className="text-electric-lime mt-1">•</span>
                  <span>{task}</span>
                </li>
              ))}
            </motion.ul>
          ) : (
            <div className="relative">
              <ul className="space-y-2 blur-md select-none">
                {MOCK_TASKS.map((task, idx) => (
                  <li key={idx} className="text-text-gray flex items-start gap-2">
                    <span className="text-electric-lime mt-1">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
              <div className="absolute inset-0 flex items-center justify-center bg-charcoal-soft/80 rounded-solotion">
                <div className="text-center">
                  <div className="text-4xl mb-2">🔒</div>
                  <p className="text-off-white font-bold">도착 인증 후 공개</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* 인증 섹션 */}
        {unlocked && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card space-y-6"
          >
            <h3 className="text-off-white text-xl font-bold">📸 인증하기</h3>

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
                        setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
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
          </motion.div>
        )}

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

      {/* ===== Escape FAB (Floating Action Button) ===== */}
      {/* 완료/취소된 미션에서는 숨김 */}
      {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
        <motion.button
          onClick={() => setShowPlanBModal(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-4 sm:right-6 z-40 group"
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
              <div className="relative px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
                {/* 비상구 아이콘 */}
                <div className="text-2xl animate-bounce">
                  <svg 
                    className="w-6 h-6 sm:w-7 sm:h-7 text-electric-lime" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2.5} 
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
                
                {/* 텍스트 라벨 */}
                <span className="text-off-white font-bold text-sm sm:text-base whitespace-nowrap">
                  다른 거 할래
                </span>
              </div>
            </div>
          </div>
        </motion.button>
      )}

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
                  <div className="text-electric-lime text-lg font-semibold italic">
                    "{MOCK_PLAN_B.reason}"
                  </div>
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
                  {MOCK_PLAN_B.placeUrl && (
                    <a
                      href={MOCK_PLAN_B.placeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-center flex items-center justify-center gap-2 py-3"
                    >
                      🗺️ 여기로 갈래!
                    </a>
                  )}
                  <button 
                    onClick={() => setShowPlanBModal(false)} 
                    className="btn-ghost hover:bg-charcoal-lighter/50"
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
