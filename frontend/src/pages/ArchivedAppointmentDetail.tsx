import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAppointmentDetail } from '../api/appointmentApi';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { Calendar, MapPin, Clock, ArrowLeft, Archive } from 'lucide-react';
import ImageCarousel from '../components/common/ImageCarousel';

function ArchivedAppointmentDetail() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointment = async () => {
      if (!appointmentId) {
        navigate('/appointments');
        return;
      }

      try {
        const data = await getAppointmentDetail(Number(appointmentId));
        setAppointment(data);
      } catch (err) {
        console.error('약속 로딩 실패:', err);
        alert('약속 정보를 찾을 수 없습니다.');
        navigate('/appointments');
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-charcoal flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-electric-lime/30 border-t-electric-lime rounded-full animate-spin" />
          <p className="text-text-gray text-sm">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  const isCompleted = appointment.status === AppointmentStatus.COMPLETED;
  // isCancelled은 향후 취소 상태 UI 표시에 사용 예정
  const _isCancelled = appointment.status === AppointmentStatus.CANCELLED;
  void _isCancelled; // 미사용 경고 방지

  return (
    <div className="min-h-screen bg-deep-charcoal">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-deep-charcoal/95 backdrop-blur-sm border-b border-charcoal-lighter">
        <div className="container-solotion px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-gray hover:text-off-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">뒤로</span>
          </button>
          <div className="flex items-center gap-2 text-text-gray">
            <Archive size={18} />
            <span className="text-sm font-semibold">아카이브</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container-solotion px-4 py-6 space-y-6 pb-24">
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm ${
              isCompleted
                ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30'
                : 'bg-gray-500/20 text-gray-400 border-2 border-gray-500/30'
            }`}
          >
            <span className="text-lg">{isCompleted ? '✓' : '×'}</span>
            <span>{isCompleted ? '완료된 약속' : '취소된 약속'}</span>
          </div>
        </motion.div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-3"
        >
          <h1 className="text-3xl font-extra-bold text-off-white">
            {appointment.missionTitle || '미션 미선택'}
          </h1>
          <div className="flex items-center justify-center gap-2 text-text-gray">
            <MapPin size={16} />
            <span className="text-sm">{appointment.placeName || '장소 미정'}</span>
          </div>
        </motion.div>

        {/* Images Section (완료된 경우) */}
        {isCompleted && appointment.proofImageUrls && appointment.proofImageUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-solotion overflow-hidden"
          >
            <ImageCarousel
              images={appointment.proofImageUrls}
              aspectRatio="square"
              className="w-full"
            />
          </motion.div>
        )}

        {/* Info Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          {/* Scheduled Date */}
          <div className="bg-charcoal-soft rounded-solotion p-4 space-y-2">
            <div className="flex items-center gap-2 text-text-gray-dark">
              <Calendar size={16} />
              <span className="text-xs font-semibold">약속 날짜</span>
            </div>
            <p className="text-off-white text-sm font-bold">
              {new Date(appointment.scheduledAt).toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Completed Date (완료된 경우) */}
          {isCompleted && appointment.completedAt && (
            <div className="bg-charcoal-soft rounded-solotion p-4 space-y-2">
              <div className="flex items-center gap-2 text-text-gray-dark">
                <Clock size={16} />
                <span className="text-xs font-semibold">완료 시간</span>
              </div>
              <p className="text-off-white text-sm font-bold">
                {new Date(appointment.completedAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </motion.div>

        {/* Rating Section (완료된 경우) */}
        {isCompleted && appointment.rating && appointment.rating > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-charcoal-soft rounded-solotion p-6 space-y-3"
          >
            <h3 className="text-text-gray-dark text-xs font-semibold">별점</h3>
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-2xl ${
                    i < Math.floor(appointment.rating!)
                      ? 'text-electric-lime'
                      : 'text-gray-600'
                  }`}
                >
                  ⭐
                </span>
              ))}
              <span className="text-electric-lime text-xl font-extra-bold ml-2">
                {appointment.rating.toFixed(1)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Keywords Section (완료된 경우) */}
        {isCompleted && appointment.reviewKeywords && appointment.reviewKeywords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-charcoal-soft rounded-solotion p-6 space-y-4"
          >
            <h3 className="text-text-gray-dark text-xs font-semibold">이런 느낌이었어요</h3>
            <div className="flex flex-wrap gap-2">
              {appointment.reviewKeywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-electric-lime/10 text-electric-lime text-sm font-bold rounded-full border border-electric-lime/20"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Comment Section (완료된 경우) */}
        {isCompleted && appointment.proofComment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-charcoal-soft rounded-solotion p-6 space-y-4"
          >
            <h3 className="text-text-gray-dark text-xs font-semibold">기록</h3>
            <p className="text-off-white text-base leading-relaxed whitespace-pre-line">
              {appointment.proofComment}
            </p>
          </motion.div>
        )}

        {/* Archive Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="pt-8 pb-4 flex flex-col items-center gap-3"
        >
          <div className="w-16 h-1 bg-charcoal-lighter rounded-full" />
          <p className="text-text-gray-dark text-xs text-center">
            {isCompleted
              ? '소중한 추억을 간직하고 있어요'
              : '다음에는 꼭 함께 할 거예요'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default ArchivedAppointmentDetail;
