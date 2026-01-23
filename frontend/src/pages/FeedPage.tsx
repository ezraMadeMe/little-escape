import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Bookmark, Clock, Calendar } from 'lucide-react';
import { getPublicFeed, FeedItem, toggleSaveAppointment, toggleLikeAppointment } from '../api/appointmentApi';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import EscLikeButton from '../components/EscLikeButton';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { showToast } from '../utils/toast';

const FeedPage = () => {
  const navigate = useNavigate();
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async (pageNum: number = page) => {
    try {
      setLoading(true);
      const data = await getPublicFeed(pageNum, 20);

      if (data.length < 20) {
        setHasMore(false);
      }

      setFeeds(prev => pageNum === 0 ? data : [...prev, ...data]);
    } catch (error) {
      console.error('피드 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFeeds(nextPage);
    }
  };

  // Infinite Scroll 훅 사용
  const observerTarget = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading,
    threshold: 0.5,
  });

  // 좋아요 토글 핸들러
  const handleToggleLike = async (appointmentId: number) => {
    try {
      // 낙관적 업데이트 (Optimistic Update)
      setFeeds(prev =>
        prev.map(feed =>
          feed.appointmentId === appointmentId
            ? { ...feed, isLikedByMe: !feed.isLikedByMe }
            : feed
        )
      );

      const isLiked = await toggleLikeAppointment(appointmentId);

      // API 응답과 동기화
      setFeeds(prev =>
        prev.map(feed =>
          feed.appointmentId === appointmentId
            ? { ...feed, isLikedByMe: isLiked }
            : feed
        )
      );

      if (isLiked) {
        showToast('좋아요! 💚');
      }
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      // 실패 시 원래 상태로 롤백
      setFeeds(prev =>
        prev.map(feed =>
          feed.appointmentId === appointmentId
            ? { ...feed, isLikedByMe: !feed.isLikedByMe }
            : feed
        )
      );
      showToast('좋아요 중 오류가 발생했어요');
    }
  };

  // 북마크 토글 핸들러
  const handleToggleSave = async (appointmentId: number) => {
    try {
      // 낙관적 업데이트
      setFeeds(prev =>
        prev.map(feed =>
          feed.appointmentId === appointmentId
            ? { ...feed, isSavedByMe: !feed.isSavedByMe }
            : feed
        )
      );

      const isSaved = await toggleSaveAppointment(appointmentId);

      // API 응답과 동기화
      setFeeds(prev =>
        prev.map(feed =>
          feed.appointmentId === appointmentId
            ? { ...feed, isSavedByMe: isSaved }
            : feed
        )
      );

      if (isSaved) {
        showToast('저장한 일탈 목록에 추가했어요 📂');
      } else {
        showToast('저장 목록에서 제거했어요');
      }
    } catch (error) {
      console.error('북마크 토글 실패:', error);
      // 실패 시 원래 상태로 롤백
      setFeeds(prev =>
        prev.map(feed =>
          feed.appointmentId === appointmentId
            ? { ...feed, isSavedByMe: !feed.isSavedByMe }
            : feed
        )
      );
      showToast('저장하는 중 오류가 발생했어요');
    }
  };

  if (loading && feeds.length === 0) {
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
          className="text-2xl text-off-white font-bold mb-4"
        >
          📸
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-charcoal pb-24">
      {/* Header */}
      <header className="bg-charcoal-soft/95 backdrop-blur-lg border-b border-charcoal-lighter sticky top-0 z-10">
        <div className="container-solotion py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-off-white text-2xl font-extra-bold">잘 쉰 사람들 목록</h1>
            <button
              onClick={() => navigate('/appointments')}
              className="flex items-center gap-2 px-4 py-2 bg-charcoal-lighter hover:bg-charcoal-lighter/80 text-off-white rounded-lg transition"
            >
              <Calendar size={18} />
              <span className="text-sm font-bold">나의 쉼</span>
            </button>
          </div>
        </div>
      </header>

      {/* Feed List */}
      <div className="container-solotion py-6 space-y-4">
        {feeds.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🌍</div>
            <p className="text-text-gray mb-2">아직 제대로 쉰 사람이 없어요</p>
            <p className="text-text-gray-dark text-sm">
              쉬었음과 함께 제대로 쉬어요
            </p>
          </motion.div>
        ) : (
          feeds.map((feed, index) => {
            // 상태별 스타일링
            const isScheduled = feed.status === 'ACCEPTED';
            const isArrived = feed.status === 'ARRIVED';
            const isCompleted = feed.status === 'COMPLETED';

            return (
              <motion.div
                key={`${feed.appointmentId}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card overflow-hidden ${
                  isScheduled
                    ? 'border-2 border-electric-lime/30'
                    : isArrived
                    ? 'border-2 border-accent-pink/30'
                    : ''
                }`}
              >
                {/* 상태 배지 (라이브 느낌) */}
                {(isScheduled || isArrived) && (
                  <div
                    className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${
                      isScheduled
                        ? 'bg-electric-lime/10 text-electric-lime'
                        : 'bg-accent-pink/10 text-accent-pink'
                    }`}
                  >
                    {isArrived && <span className="animate-pulse">🔴</span>}
                    <span>
                      {isScheduled && `🚀 ${feed.userNickname}님이 ${feed.placeName || '목적지'}로 출발 준비 중!`}
                      {isArrived && `🔥 ${feed.userNickname}님이 ${feed.missionTitle} 수행 중!`}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-charcoal-lighter">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-electric-lime to-neon-purple rounded-full flex items-center justify-center">
                      <span className="text-deep-charcoal text-sm font-bold">
                        {feed.userNickname.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-off-white">
                        {feed.userNickname}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-text-gray">
                        <Clock size={12} />
                        <span>
                          {(() => {
                            const dateStr = isCompleted ? feed.completedAt : feed.scheduledAt;
                            if (!dateStr) return '시간 정보 없음';

                            try {
                              const date = new Date(dateStr);
                              if (isNaN(date.getTime())) return '시간 정보 없음';

                              return formatDistanceToNow(date, {
                                addSuffix: true,
                                locale: ko,
                              });
                            } catch (error) {
                              console.error('날짜 파싱 오류:', dateStr, error);
                              return '시간 정보 없음';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Content */}
              <div className="p-4">
                {/* Mission Title & Place */}
                <div className="mb-3">
                  <h3 className="text-off-white font-bold text-lg mb-1">
                    {feed.missionTitle}
                  </h3>
                  <p className="text-text-gray text-sm flex items-center gap-1">
                    <span>📍</span>
                    {feed.placeName}
                  </p>
                </div>

                {/* 진행 중 상태일 때 다른 메시지 */}
                {(isScheduled || isArrived) && (
                  <p className="text-text-gray text-sm mb-3 leading-relaxed italic">
                    {isScheduled && '곧 출발합니다. 응원해주세요! 💪'}
                    {isArrived && '지금 미션을 수행하고 있어요. 곧 인증샷이 올라올 거예요!'}
                  </p>
                )}

                {/* Comment (완료된 경우만) */}
                {isCompleted && feed.proofComment && (
                  <p className="text-text-gray text-sm mb-3 leading-relaxed">
                    {feed.proofComment}
                  </p>
                )}

                {/* Keywords (완료된 경우만) */}
                {isCompleted && feed.reviewKeywords && feed.reviewKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {feed.reviewKeywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-charcoal-lighter text-electric-lime text-xs font-semibold rounded-full"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                )}

                {/* Images (완료된 경우만) */}
                {isCompleted && feed.proofImageUrls && feed.proofImageUrls.length > 0 && (
                  <div className="mb-3 rounded-lg overflow-hidden">
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${feed.proofImageUrls[0]}`}
                      alt="proof"
                      className="w-full h-80 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80';
                      }}
                    />
                    {feed.proofImageUrls.length > 1 && (
                      <div className="text-xs text-text-gray mt-2 text-center">
                        +{feed.proofImageUrls.length - 1}장 더보기
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-charcoal-lighter">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-text-gray hover:text-electric-lime transition">
                      <MessageCircle size={18} />
                      <span className="text-sm">댓글</span>
                    </button>

                    <button
                      onClick={() => handleToggleSave(feed.appointmentId)}
                      className={`flex items-center gap-1 transition ${
                        feed.isSavedByMe
                          ? 'text-electric-lime'
                          : 'text-text-gray hover:text-electric-lime'
                      }`}
                    >
                      <Bookmark
                        size={18}
                        fill={feed.isSavedByMe ? 'currentColor' : 'none'}
                      />
                      <span className="text-sm">
                        {feed.isSavedByMe ? '저장됨' : '저장'}
                      </span>
                    </button>
                  </div>

                  {/* ESC 좋아요 버튼 */}
                  <EscLikeButton
                    isLiked={feed.isLikedByMe}
                    onLike={() => handleToggleLike(feed.appointmentId)}
                  />
                </div>
              </div>
            </motion.div>
            );
          })
        )}

        {/* Infinite Scroll Observer Target */}
        {hasMore && feeds.length > 0 && (
          <div ref={observerTarget} className="py-8 flex justify-center">
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-text-gray"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-electric-lime/30 border-t-electric-lime rounded-full"
                />
                <span className="text-sm">더 많은 피드를 불러오는 중...</span>
              </motion.div>
            )}
          </div>
        )}

        {/* 더 이상 피드가 없을 때 */}
        {!hasMore && feeds.length > 0 && (
          <div className="py-8 text-center text-text-gray-dark text-sm">
            모든 피드를 확인했어요 ✨
          </div>
        )}
      </div>

      {/* Scroll to Top FAB */}
      <ScrollToTopButton threshold={300} />
    </div>
  );
};

export default FeedPage;
