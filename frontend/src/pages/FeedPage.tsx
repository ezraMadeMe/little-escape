import { useState } from 'react';
import {
  MessageCircle,
  Bookmark,
  MoreVertical,
  Clock,
  Download,
} from 'lucide-react';
import { FeedAppointment, FeedComment } from '../types/feed';
import CommentBottomSheet from '../components/CommentBottomSheet';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

// Mock Data
const MOCK_FEEDS: FeedAppointment[] = [
  {
    id: 1,
    user: {
      id: 1,
      nickname: '일탈러버',
      profileImageUrl: 'https://via.placeholder.com/150',
      isOnboarded: true,
      role: 'USER',
    },
    missionTitle: '혼자 영화관 가기',
    missionCategory: '문화',
    status: 'COMPLETED',
    content:
      '평일 오후에 혼자 영화 보러 갔어요! 생각보다 너무 좋네요. 팝콘도 혼자 다 먹고 🍿',
    proofImages: [
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
    ],
    bookmarkCount: 42,
    commentCount: 8,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    user: {
      id: 2,
      nickname: '자유로운영혼',
      profileImageUrl: 'https://via.placeholder.com/150',
      isOnboarded: true,
      role: 'USER',
    },
    missionTitle: '새벽 산책하기',
    missionCategory: '운동',
    status: 'COMPLETED',
    content: '오늘 새벽 6시에 한강 산책했어요. 일출이 정말 예뻤습니다 🌅',
    proofImages: [
      'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800',
    ],
    bookmarkCount: 128,
    commentCount: 23,
    isBookmarked: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    user: {
      id: 3,
      nickname: '도전왕',
      profileImageUrl: 'https://via.placeholder.com/150',
      isOnboarded: true,
      role: 'USER',
    },
    missionTitle: '처음 가보는 식당에서 식사하기',
    missionCategory: '음식',
    status: 'IN_PROGRESS',
    content: '오늘 점심은 회사 근처 새로 생긴 파스타집! 기대됩니다 🍝',
    proofImages: [
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
    ],
    bookmarkCount: 15,
    commentCount: 4,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

const MOCK_COMMENTS: { [key: number]: FeedComment[] } = {
  1: [
    {
      id: 1,
      user: {
        id: 4,
        nickname: '영화광',
        profileImageUrl: 'https://via.placeholder.com/150',
        isOnboarded: true,
        role: 'USER',
      },
      content: '저도 혼영 좋아해요! 무슨 영화 보셨어요?',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      replies: [
        {
          id: 2,
          user: {
            id: 1,
            nickname: '일탈러버',
            profileImageUrl: 'https://via.placeholder.com/150',
            isOnboarded: true,
            role: 'USER',
          },
          content: '오펜하이머 봤어요! 강추합니다',
          createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      id: 3,
      user: {
        id: 5,
        nickname: '팝콘러버',
        profileImageUrl: 'https://via.placeholder.com/150',
        isOnboarded: true,
        role: 'USER',
      },
      content: '팝콘 혼자 다 먹는거 인정 ㅋㅋㅋ',
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
  ],
  2: [
    {
      id: 4,
      user: {
        id: 6,
        nickname: '아침사람',
        profileImageUrl: 'https://via.placeholder.com/150',
        isOnboarded: true,
        role: 'USER',
      },
      content: '새벽 산책 너무 좋죠! 저도 내일 도전해볼게요',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],
  3: [],
};

const FeedPage = () => {
  const [feeds, setFeeds] = useState<FeedAppointment[]>(MOCK_FEEDS);
  const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [comments, setComments] = useState<{ [key: number]: FeedComment[] }>(
    MOCK_COMMENTS
  );

  const handleBookmarkToggle = (feedId: number) => {
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
    if (!selectedFeedId) return;

    const newComment: FeedComment = {
      id: Date.now(),
      user: {
        id: 999,
        nickname: '나',
        profileImageUrl: 'https://via.placeholder.com/150',
        isOnboarded: true,
        role: 'USER',
      },
      content,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => {
      const feedComments = prev[selectedFeedId] || [];

      if (parentId) {
        // 답글 추가
        const updatedComments = feedComments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment],
            };
          }
          return comment;
        });
        return { ...prev, [selectedFeedId]: updatedComments };
      } else {
        // 새 댓글 추가
        return {
          ...prev,
          [selectedFeedId]: [...feedComments, newComment],
        };
      }
    });

    // 댓글 수 업데이트
    setFeeds((prevFeeds) =>
      prevFeeds.map((feed) =>
        feed.id === selectedFeedId
          ? { ...feed, commentCount: feed.commentCount + 1 }
          : feed
      )
    );
  };

  const handleTakeMission = () => {
    alert('미션 생성 페이지로 이동합니다 (구현 예정)');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header 높이만큼 패딩 */}
      <div className="pt-16">
        {/* Feed List */}
        <div className="max-w-2xl mx-auto">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className="bg-white mb-2 border-b border-gray-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={feed.user.profileImageUrl}
                    alt={feed.user.nickname}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      {feed.user.nickname}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>
                        {formatDistanceToNow(new Date(feed.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition">
                  <MoreVertical size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="px-4 pb-3">
                {/* Status Badge & Mission Title */}
                <div className="mb-2">
                  <span
                    className={`
                    inline-block px-2 py-1 rounded-full text-xs font-medium mr-2
                    ${
                      feed.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }
                  `}
                  >
                    {feed.status === 'COMPLETED' ? '✓ 성공' : '진행 중'}
                  </span>
                  <span className="font-bold text-gray-900">
                    {feed.missionTitle}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                  {feed.content}
                </p>

                {/* Images */}
                {feed.proofImages.length > 0 && (
                  <div className="mb-3 rounded-lg overflow-hidden">
                    <img
                      src={feed.proofImages[0]}
                      alt="proof"
                      className="w-full h-80 object-cover"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-4 py-2">
                  {/* Comment */}
                  <button
                    onClick={() => handleCommentClick(feed.id)}
                    className="flex items-center gap-1 text-gray-600 hover:text-purple-600 transition"
                  >
                    <MessageCircle size={20} />
                    <span className="text-sm font-medium">
                      {feed.commentCount}
                    </span>
                  </button>

                  {/* Bookmark */}
                  <button
                    onClick={() => handleBookmarkToggle(feed.id)}
                    className={`
                      flex items-center gap-1 transition
                      ${
                        feed.isBookmarked
                          ? 'text-purple-600'
                          : 'text-gray-600 hover:text-purple-600'
                      }
                    `}
                  >
                    <Bookmark
                      size={20}
                      fill={feed.isBookmarked ? 'currentColor' : 'none'}
                    />
                    <span className="text-sm font-medium">
                      {feed.bookmarkCount}
                    </span>
                  </button>
                </div>

                {/* Take Mission Button */}
                <button
                  onClick={handleTakeMission}
                  className="
                    w-full mt-3 px-4 py-2.5
                    bg-purple-50 hover:bg-purple-100
                    text-purple-700 font-medium text-sm
                    rounded-lg transition
                    flex items-center justify-center gap-2
                  "
                >
                  <Download size={18} />
                  이 일탈 가져오기
                </button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {feeds.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🌍</div>
              <p className="text-gray-600">
                다른 사람들의 작은 일탈을 구경해보세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comment Bottom Sheet */}
      <CommentBottomSheet
        isOpen={isCommentSheetOpen}
        onClose={() => setIsCommentSheetOpen(false)}
        comments={selectedFeedId ? comments[selectedFeedId] || [] : []}
        onSubmitComment={handleSubmitComment}
      />
    </div>
  );
};

export default FeedPage;
