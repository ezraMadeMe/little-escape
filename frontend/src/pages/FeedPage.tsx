import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Bookmark, Clock } from 'lucide-react';
import { getPublicFeed, FeedItem } from '../api/appointmentApi';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const FeedPage = () => {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      setLoading(true);
      const data = await getPublicFeed(page, 20);

      if (data.length < 20) {
        setHasMore(false);
      }

      setFeeds(prev => page === 0 ? data : [...prev, ...data]);
    } catch (error) {
      console.error('피드 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadFeeds();
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
          <h1 className="text-off-white text-2xl font-extra-bold">피드</h1>
          <p className="text-text-gray text-sm mt-1">다른 사람들의 작은 일탈</p>
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
            <p className="text-text-gray mb-2">아직 공개된 인증샷이 없어요</p>
            <p className="text-text-gray-dark text-sm">
              먼저 미션을 완료하고 인증해보세요!
            </p>
          </motion.div>
        ) : (
          feeds.map((feed, index) => (
            <motion.div
              key={`${feed.appointmentId}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card overflow-hidden"
            >
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
                        {formatDistanceToNow(new Date(feed.completedAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
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

                {/* Comment */}
                {feed.proofComment && (
                  <p className="text-text-gray text-sm mb-3 leading-relaxed">
                    {feed.proofComment}
                  </p>
                )}

                {/* Keywords */}
                {feed.reviewKeywords && feed.reviewKeywords.length > 0 && (
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

                {/* Images */}
                {feed.proofImageUrls && feed.proofImageUrls.length > 0 && (
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
                <div className="flex items-center gap-4 pt-3 border-t border-charcoal-lighter">
                  <button className="flex items-center gap-1 text-text-gray hover:text-electric-lime transition">
                    <MessageCircle size={18} />
                    <span className="text-sm">댓글</span>
                  </button>

                  <button className="flex items-center gap-1 text-text-gray hover:text-electric-lime transition">
                    <Bookmark size={18} />
                    <span className="text-sm">저장</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}

        {/* Load More Button */}
        {hasMore && feeds.length > 0 && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="btn-secondary w-full disabled:opacity-50"
          >
            {loading ? '로딩 중...' : '더보기'}
          </button>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
