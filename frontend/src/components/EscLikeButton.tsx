import { useState } from 'react';
import { motion } from 'framer-motion';

interface EscLikeButtonProps {
  isLiked: boolean;
  onLike: () => void;
}

const EscLikeButton = ({
  isLiked,
  onLike
}: EscLikeButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);

    // 애니메이션 완료 후 플래그 리셋
    setTimeout(() => setIsAnimating(false), 600);

    // 콜백 실행
    onLike();
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      className={`relative group ${isLiked ? 'keycap-liked' : 'keycap-default'}`}
    >
      {/* 키캡 본체 */}
      <div
        className={`
          relative px-4 py-2 rounded-lg font-bold text-xs tracking-wider
          transition-all duration-300 transform
          ${isLiked
            ? 'bg-gradient-to-br from-electric-lime to-neon-purple text-deep-charcoal shadow-lg shadow-electric-lime/50'
            : 'bg-charcoal-lighter text-text-gray shadow-md border border-charcoal-lighter hover:border-electric-lime/30'
          }
          ${isLiked ? 'translate-y-0' : 'translate-y-[-2px]'}
          group-hover:translate-y-0
        `}
        style={{
          boxShadow: isLiked
            ? '0 0 20px rgba(204, 255, 0, 0.5), inset 0 -2px 4px rgba(0,0,0,0.2)'
            : 'inset 0 -3px 0 rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        <span className="drop-shadow-sm">ESC</span>
      </div>

      {/* 키캡 그림자/베이스 */}
      <div
        className={`
          absolute inset-0 rounded-lg -z-10 transition-all duration-300
          ${isLiked
            ? 'bg-electric-lime/20 blur-sm'
            : 'bg-deep-charcoal/50'
          }
          ${isLiked ? 'translate-y-1' : 'translate-y-0'}
          group-hover:translate-y-1
        `}
      />

      {/* 좋아요 애니메이션 */}
      {isAnimating && (
        <motion.div
          initial={{ scale: 1.5, y: -10, opacity: 1 }}
          animate={{ scale: 1, y: -30, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 text-electric-lime text-xl"
        >
          💚
        </motion.div>
      )}
    </motion.button>
  );
};

export default EscLikeButton;
