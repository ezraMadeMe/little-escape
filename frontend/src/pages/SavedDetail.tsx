import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAppointmentDetail, toggleSaveAppointment } from '../api/appointmentApi';
import { Appointment } from '../types/appointment';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { showToast } from '../utils/toast';
import ImageCarousel from '../components/common/ImageCarousel';

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

// Mock 데이터 (상세 코스 예시) - 향후 코스 상세 표시에 사용
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_DETAILED_COURSE = '1. 성수역 3번 출구에서 도보 5분\n2. 골목길을 따라 왼쪽으로 돌아\n3. 빨간 간판이 보이면 2층으로 올라가면 돼';

function SavedDetail() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
        navigate(-1);
        return;
      }

      try {
        const data = await getAppointmentDetail(Number(appointmentId));
        setAppointment(data);
      } catch (err) {
        console.error('약속 로딩 실패:', err);
        alert('약속 정보를 불러오는데 실패했어.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId, navigate]);

  const handleUnsave = async () => {
    if (!appointment) return;
    
    if (!confirm('정말 저장 목록에서 삭제할까?')) return;

    try {
      await toggleSaveAppointment(appointment.id);
      showToast('저장 목록에서 삭제했어.');
      navigate(-1);
    } catch (error) {
      console.error('저장 취소 실패:', error);
      showToast('삭제 중 오류가 발생했어.');
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

  // 저장된 미션은 모든 정보를 공개함 (Read-Only)
  const backgroundImage = appointment.placeImageUrl || appointment.missionImageUrl;

  return (
    <div className="min-h-screen bg-deep-charcoal flex flex-col pb-12">
      {/* ===== Header ===== */}
      <header className="px-4 py-4 flex items-center justify-between border-b border-charcoal-lighter sticky top-0 z-20 bg-deep-charcoal/95 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-gray hover:text-off-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <h1 className="text-lg font-bold text-off-white">저장한 미션</h1>

        <button
          onClick={handleUnsave}
          className="text-text-gray hover:text-accent-pink transition-colors p-2"
        >
          <Trash2 size={24} />
        </button>
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex-1 container-solotion py-6 space-y-8 overflow-y-auto scrollbar-solotion">
        {/* 미션 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <h2 className="text-off-white text-3xl font-extra-bold tracking-tight leading-tight">
              {appointment.missionTitle || '미션 미선택'}
            </h2>
            <div className="flex items-center gap-2 text-text-gray">
              <span>📍</span>
              <span className="font-medium">{appointment.placeName || '장소 정보 없음'}</span>
            </div>
          </div>
        </motion.div>

        {/* 썸네일 이미지 (캐러셀) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-solotion overflow-hidden shadow-solotion"
        >
          <ImageCarousel
            images={
              appointment.proofImageUrls && appointment.proofImageUrls.length > 0
                ? appointment.proofImageUrls
                : backgroundImage ? [backgroundImage] : []
            }
            aspectRatio="square"
          />
        </motion.div>

        {/* 내 후기 (Rating & Review) */}
        {appointment.status === 'COMPLETED' && (
          <section className="space-y-4">
            <h3 className="text-electric-lime text-xl font-bold flex items-center gap-2">
              📝 나의 기록
            </h3>
            <div className="card bg-charcoal-soft border border-charcoal-lighter space-y-3">
              {/* 별점 */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="text-off-white font-extra-bold text-xl">
                  {appointment.rating ? appointment.rating.toFixed(1) : '0.0'}
                </span>
              </div>

              {/* 후기 텍스트 */}
              {appointment.proofComment ? (
                <p className="text-text-gray leading-relaxed whitespace-pre-wrap">
                  {appointment.proofComment}
                </p>
              ) : (
                <p className="text-text-gray-dark italic">작성된 후기가 없습니다.</p>
              )}

              {/* 키워드 */}
              {appointment.reviewKeywords && appointment.reviewKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {appointment.reviewKeywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-charcoal-lighter text-electric-lime text-xs font-semibold rounded-full"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 장소 정보 & 지도 */}
        <section className="space-y-4">
          <h3 className="text-electric-lime text-xl font-bold flex items-center gap-2">
            🗺️ 위치 정보
          </h3>
          <div className="card bg-charcoal-soft border border-charcoal-lighter">
            <p className="text-off-white font-bold text-lg mb-1">
              {appointment.placeName || '장소 정보 없음'}
            </p>
            <p className="text-text-gray text-sm mb-4">
              {appointment.placeAddress || '주소 정보 없음'}
            </p>

            {/* 지도 버튼 */}
            <a
              href={
                appointment.latitude && appointment.longitude
                  ? `https://map.kakao.com/link/to/${encodeURIComponent(appointment.placeName || '목적지')},${appointment.latitude},${appointment.longitude}`
                  : `https://map.kakao.com/link/search/${encodeURIComponent(appointment.placeName || '')}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3"
            >
              <span>🗺️ 카카오맵으로 보기</span>
            </a>
          </div>
        </section>

        {/* 미션 가이드 */}
        <section className="space-y-4">
          <h3 className="text-electric-lime text-xl font-bold flex items-center gap-2">
            📋 미션 가이드
          </h3>
          
          <div className="space-y-4">
            {/* 1. 단계별 코스 */}
            {appointment.missionGuide && parseGuide(appointment.missionGuide).length > 0 && (
              <div className="card bg-charcoal-soft border border-charcoal-lighter">
                <h4 className="text-off-white font-bold mb-2 border-b border-charcoal-lighter pb-2">추천 코스</h4>
                <div className="space-y-6">
                  {parseGuide(appointment.missionGuide).map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-electric-lime/10 border border-electric-lime/30 flex items-center justify-center text-xl">
                          {ICON_MAP[step.icon] || '📍'}
                        </div>
                        {index < parseGuide(appointment.missionGuide).length - 1 && (
                          <div className="w-0.5 h-full min-h-[20px] bg-charcoal-lighter mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h5 className="text-off-white font-bold mb-1">{step.title}</h5>
                        <p className="text-text-gray text-sm leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. 상세 설명 (Description) */}
            {appointment.missionDescription && (
              <div className="card bg-charcoal-soft border border-charcoal-lighter">
                <h4 className="text-off-white font-bold mb-2">미션 설명</h4>
                <p className="text-text-gray leading-relaxed whitespace-pre-line">
                  {appointment.missionDescription}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default SavedDetail;
