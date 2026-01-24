import { useState } from 'react';
import { motion } from 'framer-motion';

interface EscLikeButtonProps {
  isLiked: boolean;
  likeCount?: number;
  onLike: () => void;
}

const EscLikeButton = ({
  isLiked,
  likeCount = 0,
  onLike
}: EscLikeButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    onLike();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative w-full py-4 rounded-xl font-bold text-sm tracking-wider
        transition-all duration-200 active:scale-[0.98]
        flex items-center justify-center px-6
        ${isLiked
          ? 'bg-brand-neon text-black shadow-[0_0_15px_#CCFF00] border-2 border-brand-neon'
          : 'bg-transparent text-brand-neon border-2 border-brand-neon hover:bg-brand-neon/5'
        }
      `}
    >
      <span className="text-center text-lg">ESC</span>
      
      <span className="absolute right-6 font-mono text-base">
        {likeCount > 999 ? '999+' : likeCount}
      </span>

      {/* 좋아요 애니메이션 이모지 */}
      {isAnimating && (
        <motion.div
          initial={{ scale: 0.5, y: 0, opacity: 0 }}
          animate={{ scale: 1.5, y: -20, opacity: [0, 1, 0] }}
          transition={{ duration: 0.6 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          💚
        </motion.div>
      )}
    </button>
  );
};

export default EscLikeButton;
