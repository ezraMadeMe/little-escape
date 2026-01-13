import { useState } from 'react';
import { MessageCircle, Bookmark, MoreVertical, Share2 } from 'lucide-react';
import { FeedAppointment, FeedComment } from '../types/feed';
import CommentBottomSheet from '../components/CommentBottomSheet';

// Mock 데이터
const MOCK_FEEDS: FeedAppointment[] = [
  {
    id: 1,
    user: {
      id: 1,
      nickname: '일탈러버',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      isOnboarded: true,
      role: 'USER',
    },
    missionTitle: '낯선 카페에서 책 읽기',
    missionCategory: '문화생활',
    status: 'COMPLETED',
    content: '오늘 처음 가본 카페에서 책을 읽었어요! 생각보다 너무 좋았습니다. 다음에 또 와야겠어요 😊',
    proofImages: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'],
    bookmarkCount: 24,
    commentCount: 12,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    user: {
      id: 2,
      nickname: '모험가',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      isOnboarded: true,
      role: 'USER',
    },
    missionTitle: '새로운 음식점 방문하기',
    missionCategory: '맛집탐방',
    status: 'COMPLETED',
    content: '동네에 있는 새로운 일식집을 다녀왔어요. 오마카세가 정말 맛있었습니다!',
    proofImages: [
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
    ],
    bookmarkCount: 45,
    commentCount: 28,
    isBookmarked: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 3,
    user: {
      id: 3,
      nickname: '산책왕',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
      isOnboarded: true,
      role: 'USER',
    },
    missionTitle: '공원에서 아침 산책하기',
    missionCategory: '운동',
    status: 'IN_PROGRESS',
    content: '아침 일찍 일어나서 한강 공원을 산책했어요. 상쾌한 공기를 마시니 기분이 좋네요!',
    proofImages: ['https://images.unsplash.com/photo-1541623089466-8e777dd05d70?w=800'],
    bookmarkCount: 18,
    commentCount: 7,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

const MOCK_COMMENTS: Record<number, FeedComment[]> = {
  1: [
    {
      id: 1,
      user: {
        id: 4,
        nickname: '북러버',
        isOnboarded: true,
        role: 'USER',
      },
      content: '어떤 책 읽으셨어요? 궁금해요!',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      replies: [
        {
          id: 2,
          user: {
            id: 1,
            nickname: '일탈러버',
            isOnboarded: true,
            role: 'USER',
          },
          content: '무라카미 하루키의 "상실의 시대"를 읽었어요 😊',
          createdAt: new Date(Date.now() - 1200000).toISOString(),
        },
      ],
    },
    {
      id: 3,
      user: {
        id: 5,
        nickname: '카페인중독',
        isOnboarded: true,
        role: 'USER',
      },
      content: '분위기 좋아보여요! 위치가 어디인가요?',
      createdAt: new Date(Date.now() - 900000).toISOString(),
    },
  ],
  2: [
    {
      id: 4,
      user: {
        id: 6,
        nickname: '초밥매니아',
        isOnboarded: true,
        role: 'USER',
      },
      content: '오마카세 가격이 어떻게 되나요?',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  3: [],
};

const Feed = () => {
  const [feeds, setFeeds] = useState<FeedAppointment[]>(MOCK_FEEDS);
  const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const handleBookmark = (feedId: number) => {
    setFeeds((prevFeeds) =>
      prevFeeds.map((feed) =>
        feed.id === feedId
          ? {
              ...feed,
              isBookmarked: !feed.isBookmarked,
              bookmarkCount: feed.isBookmarked
                ? feed.bookmarkCount - 1
                : feed.bookmarkCount + 1,
            }
          : feed
      )
    );
  };

  const handleCommentClick = (feedId: number) => {
    setSelectedFeedId(feedId);
    setIsCommentSheetOpen(true);
  };

  const handleSubmitComment = (content: string, parentId?: number) => {
    console.log('댓글 작성:', { feedId: selectedFeedId, content, parentId });
    // TODO: API 연동
  };

  const handleImportMission = (feed: FeedAppointment) => {
    alert(`"${feed.missionTitle}" 미션 생성 페이지로 이동합니다 (구현 예정)`);
  };

  const getStatusBadge = (status: 'IN_PROGRESS' | 'COMPLETED') => {
    if (status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          ✓ 미션 성공
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        → 진행중
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 max-w-[430px] mx-auto">
        <div className="px-5 py-4">
          <h1 className="text-xl font-bold text-gray-900">피드</h1>
          <p className="text-sm text-gray-500 mt-1">다른 사람들의 작은 일탈</p>
        </div>
      </header>

      {/* Feed List */}
      <div className="pt-16 max-w-[430px] mx-auto">
        {feeds.map((feed) => (
          <article
            key={feed.id}
            className="bg-white border-b-8 border-gray-100 p-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Profile Image */}
                {feed.user.profileImageUrl ? (
                  <img
                    src={feed.user.profileImageUrl}
                    alt={feed.user.nickname}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                    {feed.user.nickname.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {feed.user.nickname}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(feed.createdAt)}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-3">
              <div className="mb-2">{getStatusBadge(feed.status)}</div>
              <h3 className="font-bold text-gray-900 mb-2 text-base">
                {feed.missionTitle}
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {feed.content}
              </p>
            </div>

            {/* Images */}
            {feed.proofImages.length > 0 && (
              <div className="mb-4 -mx-5">
                <img
                  src={feed.proofImages[0]}
                  alt="미션 인증"
                  className="w-full h-80 object-cover"
                />
                {feed.proofImages.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    +{feed.proofImages.length - 1}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mb-3 pt-2">
              <button
                onClick={() => handleCommentClick(feed.id)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <MessageCircle size={20} />
                <span className="text-sm font-medium">{feed.commentCount}</span>
              </button>
              <button
                onClick={() => handleBookmark(feed.id)}
                className={`flex items-center gap-1.5 transition-colors ${
                  feed.isBookmarked
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <Bookmark
                  size={20}
                  fill={feed.isBookmarked ? 'currentColor' : 'none'}
                />
                <span className="text-sm font-medium">{feed.bookmarkCount}</span>
              </button>
              <button className="flex items-center gap-1.5 text-gray-600 hover:text-purple-600 transition-colors ml-auto">
                <Share2 size={20} />
              </button>
            </div>

            {/* Import Mission Button */}
            <button
              onClick={() => handleImportMission(feed)}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500
                text-white font-semibold rounded-xl hover:from-purple-600
                hover:to-pink-600 transition-all shadow-sm"
            >
              이 일탈 가져오기
            </button>
          </article>
        ))}

        {/* Empty State */}
        {feeds.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌍</div>
            <p className="text-gray-600">아직 피드가 없어요</p>
            <p className="text-sm text-gray-400 mt-2">
              첫 번째 미션을 완료하고 공유해보세요!
            </p>
          </div>
        )}
      </div>

      {/* Comment Bottom Sheet */}
      {selectedFeedId !== null && (
        <CommentBottomSheet
          isOpen={isCommentSheetOpen}
          onClose={() => setIsCommentSheetOpen(false)}
          comments={MOCK_COMMENTS[selectedFeedId] || []}
          onSubmitComment={handleSubmitComment}
        />
      )}
    </div>
  );
};

export default Feed;
