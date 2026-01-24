import { useState, useRef, useEffect } from 'react';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
}

const ImageCarousel = ({ 
  images, 
  alt = 'image', 
  className = '', 
  aspectRatio = 'square' 
}: ImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 이미지가 없을 때 처리
  const displayImages = images.length > 0 ? images : ['https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80'];

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setActiveIndex(index);
  };

  const scrollTo = (index: number) => {
    if (!scrollContainerRef.current) return;
    
    scrollContainerRef.current.scrollTo({
      left: scrollContainerRef.current.clientWidth * index,
      behavior: 'smooth'
    });
  };

  // 비율 클래스 계산
  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    auto: 'aspect-auto'
  }[aspectRatio];

  return (
    <div className={`relative group ${className}`}>
      {/* Scroll Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex overflow-x-auto snap-x snap-mandatory scrollbar-hide ${aspectRatioClass} rounded-solotion bg-charcoal-lighter`}
        style={{ scrollBehavior: 'smooth' }}
      >
        {displayImages.map((src, index) => (
          <div 
            key={`${src}-${index}`} 
            className="flex-shrink-0 w-full h-full snap-center relative"
          >
            <img
              src={src.startsWith('http') ? src : `${import.meta.env.VITE_API_BASE_URL}${src}`}
              alt={`${alt} ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80';
              }}
            />
            {/* Overlay Gradient (Optional for text readability if needed) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Indicators */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                scrollTo(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'bg-electric-lime w-4' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Count Badge (Optional, Instagram style) */}
      {displayImages.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm font-medium">
          {activeIndex + 1} / {displayImages.length}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
