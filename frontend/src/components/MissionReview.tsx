import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface MissionReviewProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  content: string;
  onContentChange: (content: string) => void;
}

const MissionReview = ({ rating, onRatingChange, content, onContentChange }: MissionReviewProps) => {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // 0 to 5 based on width
    const percent = Math.max(0, Math.min(1, x / width));
    const rawScore = percent * 5;
    
    // Round to nearest 0.5
    const score = Math.ceil(rawScore * 2) / 2;
    setHoverRating(score);
  };

  const handleClick = () => {
    onRatingChange(hoverRating);
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="space-y-4">
      {/* 별점 영역 */}
      <div className="flex flex-col items-center gap-2">
        <div 
          ref={containerRef}
          className="flex cursor-pointer relative"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverRating(0)}
          onClick={handleClick}
        >
          {[1, 2, 3, 4, 5].map((starIndex) => (
            <div key={starIndex} className="relative w-10 h-10">
              {/* Empty Star (Background) */}
              <svg 
                className="w-full h-full text-charcoal-lighter" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>

              {/* Filled Star (Overlay) */}
              <div 
                className="absolute top-0 left-0 overflow-hidden" 
                style={{ 
                  width: displayRating >= starIndex 
                    ? '100%' 
                    : displayRating >= starIndex - 0.5 
                      ? '50%' 
                      : '0%' 
                }}
              >
                <motion.svg 
                  key={`star-${starIndex}-${displayRating}`}
                  initial={{ scale: 1 }}
                  animate={displayRating >= starIndex - 0.5 ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.2 }}
                  className="w-10 h-10 text-electric-lime" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </motion.svg>
              </div>
            </div>
          ))}
        </div>
        <div className="text-electric-lime font-bold text-lg h-6">
          {displayRating > 0 ? `${displayRating}점` : '별점을 남겨줘'}
        </div>
      </div>

      {/* 리뷰 텍스트 영역 */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="오늘의 작은 일탈은 어땠어? (줄바꿈 가능)"
          className="input w-full h-40 resize-none p-4 text-base leading-relaxed whitespace-pre-wrap"
        />
        <div className="absolute bottom-3 right-3 text-xs text-text-gray-dark">
          {content.length}자
        </div>
      </div>
    </div>
  );
};

export default MissionReview;
