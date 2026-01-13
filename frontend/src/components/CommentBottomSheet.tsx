import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { FeedComment } from '../types/feed';

interface CommentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  comments: FeedComment[];
  onSubmitComment: (content: string, parentId?: number) => void;
}

const CommentBottomSheet = ({
  isOpen,
  onClose,
  comments,
  onSubmitComment,
}: CommentBottomSheetProps) => {
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    nickname: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!commentText.trim()) return;

    onSubmitComment(commentText, replyingTo?.id);
    setCommentText('');
    setReplyingTo(null);
  };

  const handleReply = (commentId: number, nickname: string) => {
    setReplyingTo({ id: commentId, nickname });
    inputRef.current?.focus();
  };

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

  const renderComment = (comment: FeedComment, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? 'ml-10 mt-3' : 'mb-4'}`}
    >
      <div className="flex items-start gap-3">
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0">
          {comment.user.profileImageUrl ? (
            <img
              src={comment.user.profileImageUrl}
              alt={comment.user.nickname}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-semibold">
              {comment.user.nickname.charAt(0)}
            </div>
          )}
        </div>

        {/* 댓글 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900">
              {comment.user.nickname}
            </span>
            <span className="text-xs text-gray-400">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700 break-words">{comment.content}</p>
          {!isReply && (
            <button
              onClick={() => handleReply(comment.id, comment.user.nickname)}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              답글 달기
            </button>
          )}
        </div>
      </div>

      {/* 대댓글 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 bg-white rounded-t-3xl z-50
          transition-transform duration-300 ease-out max-w-[430px] mx-auto
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 rounded-t-3xl px-5 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">댓글</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Comments List */}
        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">첫 댓글을 남겨보세요!</p>
            </div>
          ) : (
            comments.map((comment) => renderComment(comment))
          )}
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 pb-safe">
          {/* 답글 작성 중 표시 */}
          {replyingTo && (
            <div className="mb-2 flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
              <span className="text-sm text-gray-600">
                @{replyingTo.nickname} 님에게 답글 작성 중
              </span>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* 입력창 */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="댓글을 입력하세요..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200
                rounded-full text-sm focus:outline-none focus:ring-2
                focus:ring-purple-400 focus:border-transparent"
            />
            <button
              onClick={handleSubmit}
              disabled={!commentText.trim()}
              className={`p-2.5 rounded-full transition-colors ${
                commentText.trim()
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentBottomSheet;
