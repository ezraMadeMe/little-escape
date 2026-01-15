import { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { FeedComment } from '../types/feed';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

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
  const [commentInput, setCommentInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    nickname: string;
  } | null>(null);

  // 바텀시트가 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = () => {
    if (!commentInput.trim()) return;

    onSubmitComment(commentInput, replyingTo?.id);
    setCommentInput('');
    setReplyingTo(null);
  };

  const handleReply = (comment: FeedComment) => {
    setReplyingTo({
      id: comment.id,
      nickname: comment.user.nickname,
    });
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white rounded-t-3xl
          max-h-[80vh] flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            댓글 {comments.length}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">첫 댓글을 남겨보세요!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                {/* Main Comment */}
                <div className="flex gap-3">
                  <img
                    src={
                      comment.user.profileImageUrl ||
                      'https://via.placeholder.com/40'
                    }
                    alt={comment.user.nickname}
                    className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">
                        {comment.user.nickname}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 break-words">
                      {comment.content}
                    </p>
                    <button
                      onClick={() => handleReply(comment)}
                      className="text-xs text-gray-500 hover:text-purple-600 font-medium"
                    >
                      답글 달기
                    </button>
                  </div>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-12 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <img
                          src={
                            reply.user.profileImageUrl ||
                            'https://via.placeholder.com/40'
                          }
                          alt={reply.user.nickname}
                          className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">
                              {reply.user.nickname}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(reply.createdAt), {
                                addSuffix: true,
                                locale: ko,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 break-words">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 px-6 py-4 pb-safe">
          {replyingTo && (
            <div className="flex items-center justify-between mb-2 px-3 py-2 bg-purple-50 rounded-lg">
              <span className="text-sm text-purple-700">
                @{replyingTo.nickname} 님에게 답글 작성 중
              </span>
              <button
                onClick={cancelReply}
                className="text-purple-600 hover:text-purple-800"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={
                replyingTo
                  ? '답글을 입력하세요...'
                  : '댓글을 입력하세요...'
              }
              className="
                flex-1 px-4 py-3
                border border-gray-300 rounded-full
                focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                text-sm placeholder:text-gray-400
              "
            />
            <button
              onClick={handleSubmit}
              disabled={!commentInput.trim()}
              className="
                p-3 bg-purple-600 rounded-full
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:bg-purple-700 transition
              "
            >
              <Send size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentBottomSheet;
