import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Bookmark, Clock, Calendar } from 'lucide-react';
import { getPublicFeed, FeedItem, toggleSaveAppointment, toggleLikeAppointment } from '../api/appointmentApi';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import EscLikeButton from '../components/EscLikeButton';
import ImageCarousel from '../components/common/ImageCarousel';
import ExpandableText from '../components/common/ExpandableText';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { showToast } from '../utils/toast';
import { Comment, createComment, getComments, deleteComment } from '../api/commentApi';

const FeedPage = () => {
  const navigate = useNavigate();
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 댓글 확장 상태
  const [expandedFeedId, setExpandedFeedId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [currentComments, setCurrentComments] = useState<Comment[]>([]);

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

  // 댓글창 토글
  const handleToggleComment = async (appointmentId: number) => {
    if (expandedFeedId === appointmentId) {
      setExpandedFeedId(null);
      setCommentText('');
      setCurrentComments([]);
    } else {
      setExpandedFeedId(appointmentId);
      setCommentText('');
      try {
        const comments = await getComments(appointmentId);
        setCurrentComments(comments);
      } catch (error) {
        console.error('댓글 조회 실패:', error);
        showToast('댓글을 불러오는데 실패했어요.');
      }
    }
  };

  // 댓글 전송
  const handleSubmitComment = async (appointmentId: number) => {
    if (!commentText.trim()) return;
    
    try {
      const newComment = await createComment(appointmentId, commentText);
      setCurrentComments(prev => [newComment, ...prev]);
      setCommentText('');
      
      // 피드 목록의 댓글 수 업데이트
      setFeeds(prev => prev.map(feed => 
        feed.appointmentId === appointmentId 
          ? { ...feed, commentCount: (feed.commentCount || 0) + 1 } 
          : feed
      ));
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      showToast('댓글 작성에 실패했어요.');
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number, appointmentId: number) => {
    if (!confirm('댓글을 삭제할까요?')) return;

    try {
      await deleteComment(commentId);
      setCurrentComments(prev => prev.filter(c => c.id !== commentId));
      
      // 피드 목록의 댓글 수 업데이트
      setFeeds(prev => prev.map(feed => 
        feed.appointmentId === appointmentId 
          ? { ...feed, commentCount: Math.max(0, (feed.commentCount || 0) - 1) } 
          : feed
      ));
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      showToast('댓글 삭제에 실패했어요.');
    }
  };

  // 좋아요 토글 핸들러
  const handleToggleLike = async (appointmentId: number) => {
    try {
      // 낙관적 업데이트 (Optimistic Update)
      setFeeds(prev =>
        prev.map(feed =>
          feed.appointmentId === appointmentId
            ? {
                ...feed,
                isLikedByMe: !feed.isLikedByMe,
                likeCount: (feed.likeCount || 0) + (feed.isLikedByMe ? -1 : 1)
              }
            : feed
        )
      );

      const isLiked = await toggleLikeAppointment(appointmentId);

      // API 응답과 동기화 (카운트는 낙관적 상태 유지)
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
            ? {
                ...feed,
                isLikedByMe: !feed.isLikedByMe,
                likeCount: (feed.likeCount || 0) + (feed.isLikedByMe ? 1 : -1) // 롤백이므로 반대로
              }
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
          </div>
        </div>
      </header>

      {/* Feed List */}
      <div className="w-full pb-20">
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
                className="w-full bg-brand-gray mb-0 border-b border-gray-800 shadow-lg py-8 last:border-b-0"
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
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border-2 border-brand-neon rounded-full flex items-center justify-center bg-charcoal-lighter">
                      <span className="text-off-white text-sm font-bold">
                        {feed.userNickname.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-off-white flex items-center gap-2">
                        {feed.userNickname}
                        {/* 별점 표시 */}
                        {feed.rating && (
                          <span className="text-electric-lime text-xs font-extra-bold flex items-center">
                            ⭐ {feed.rating.toFixed(1)}
                          </span>
                        )}
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

              {/* Images (완료된 경우만) - Full Width */}
              {isCompleted && (
                <div className="w-full">
                  <ImageCarousel
                    images={feed.proofImageUrls && feed.proofImageUrls.length > 0 ? feed.proofImageUrls : []}
                    aspectRatio="square"
                    className="w-full"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4 pb-2">
                {/* Mission Title & Place & Bookmark */}
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-off-white font-bold text-lg mb-1">
                      {feed.missionTitle}
                    </h3>
                    <p className="text-text-gray text-sm flex items-center gap-1">
                      <span>📍</span>
                      {feed.placeName}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleToggleSave(feed.appointmentId)}
                    className={`transition-colors ${
                      feed.isSavedByMe
                        ? 'text-electric-lime'
                        : 'text-text-gray hover:text-electric-lime'
                    }`}
                  >
                    <Bookmark
                      size={22}
                      fill={feed.isSavedByMe ? "currentColor" : "none"}
                    />
                  </button>
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
                  <ExpandableText text={feed.proofComment} />
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

                {/* Action Buttons */}
                <div className="mt-10">
                  <EscLikeButton
                    isLiked={feed.isLikedByMe}
                    likeCount={feed.likeCount}
                    onLike={() => handleToggleLike(feed.appointmentId)}
                  />
                </div>
              </div>

              {/* Comment Section (Expandable) - MVP 단계에서 임시 숨김 */}
              {/* <AnimatePresence>
                {expandedFeedId === feed.appointmentId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden bg-charcoal-soft px-4"
                  >
                    <div className="pt-2 pb-4 space-y-3 border-t border-charcoal-lighter/50">
                      <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar">
                        {currentComments.length === 0 ? (
                          <p className="text-xs text-text-gray-dark italic py-2 text-center">
                            아직 댓글이 없어요. 첫 댓글을 남겨보세요! 👇
                          </p>
                        ) : (
                          currentComments.map((comment) => (
                            <div key={comment.id} className="flex gap-2 items-start group">
                              <div className="w-8 h-8 rounded-full bg-charcoal-lighter overflow-hidden flex-shrink-0">
                                {comment.userProfileImage ? (
                                  <img src={comment.userProfileImage} alt={comment.userNickname} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-text-gray">
                                    {comment.userNickname.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-bold text-off-white">{comment.userNickname}</span>
                                  <span className="text-[10px] text-text-gray-dark">
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
                                  </span>
                                </div>
                                <p className="text-sm text-text-gray break-words leading-relaxed">{comment.content}</p>
                              </div>
                              {comment.isMyComment && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id, feed.appointmentId)}
                                  className="text-text-gray-dark hover:text-accent-pink opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="댓글 달기..."
                          className="flex-1 bg-charcoal-lighter text-off-white text-sm px-4 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-electric-lime transition-all"
                          onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(feed.appointmentId)}
                        />
                        <button
                          onClick={() => handleSubmitComment(feed.appointmentId)}
                          disabled={!commentText.trim()}
                          className="text-electric-lime font-bold text-sm px-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          게시
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence> */}
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
    </div>
  );
};

export default FeedPage;
