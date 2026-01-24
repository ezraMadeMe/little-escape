import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin } from 'lucide-react';
import { getSavedAppointments, FeedItem, toggleSaveAppointment } from '../api/appointmentApi';
import { showToast } from '../utils/toast';

const SavedAppointments = () => {
  const navigate = useNavigate();
  const [savedAppointments, setSavedAppointments] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedAppointments();
  }, []);

  const loadSavedAppointments = async () => {
    try {
      setLoading(true);
      const data = await getSavedAppointments();
      setSavedAppointments(data);
    } catch (error) {
      console.error('저장 목록 로딩 실패:', error);
      showToast('저장 목록을 불러오는 중 오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (appointmentId: number) => {
    try {
      await toggleSaveAppointment(appointmentId);
      // 로컬 상태에서 제거
      setSavedAppointments(prev => prev.filter(item => item.appointmentId !== appointmentId));
      showToast('저장 목록에서 제거했어요');
    } catch (error) {
      console.error('저장 취소 실패:', error);
      showToast('저장 취소 중 오류가 발생했어요');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-charcoal flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="text-2xl text-off-white font-bold"
        >
          📂
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-charcoal pb-24">
      {/* Header */}
      <header className="bg-charcoal-soft/95 backdrop-blur-lg border-b border-charcoal-lighter sticky top-0 z-10">
        <div className="container-solotion py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-off-white hover:text-electric-lime transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-off-white text-2xl font-extra-bold">저장한 일탈</h1>
            <p className="text-text-gray text-sm mt-1">
              {savedAppointments.length}개의 약속을 저장했어요
            </p>
          </div>
        </div>
      </header>

      {/* Saved List */}
      <div className="container-solotion py-6">
        {savedAppointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📂</div>
            <p className="text-text-gray mb-2">아직 저장한 일탈이 없어요</p>
            <p className="text-text-gray-dark text-sm mb-6">
              피드에서 마음에 드는 약속을 저장해보세요!
            </p>
            <button
              onClick={() => navigate('/feed')}
              className="btn-primary"
            >
              피드 둘러보기
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {savedAppointments.map((item, index) => (
              <motion.div
                key={item.appointmentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-0 overflow-hidden relative group cursor-pointer"
                onClick={() => {
                  // 저장한 일탈 상세 보기 (SavedDetail)
                  navigate(`/saved/detail/${item.appointmentId}`);
                }}
              >
                {/* 썸네일 */}
                <div className="relative h-40 bg-charcoal-lighter">
                  {item.proofImageUrls && item.proofImageUrls.length > 0 ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${item.proofImageUrls[0]}`}
                      alt={item.missionTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      ✨
                    </div>
                  )}

                  {/* 삭제 버튼 (호버 시 표시) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnsave(item.appointmentId);
                    }}
                    className="absolute top-2 right-2 bg-deep-charcoal/80 text-off-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent-pink"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 정보 */}
                <div className="p-3">
                  <h3 className="text-off-white font-bold text-sm mb-1 line-clamp-1">
                    {item.missionTitle}
                  </h3>
                  <div className="flex items-center gap-1 text-text-gray text-xs">
                    <MapPin size={12} />
                    <span className="line-clamp-1">{item.placeName}</span>
                  </div>
                  <p className="text-text-gray-dark text-xs mt-1">
                    {item.userNickname}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedAppointments;
