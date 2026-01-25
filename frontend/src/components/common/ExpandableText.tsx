import { useState, useEffect, useRef } from 'react';

const ExpandableText = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // 텍스트가 2줄을 초과하는지 확인
    if (textRef.current) {
      const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight);
      const maxHeight = lineHeight * 2; // 2줄 높이
      const actualHeight = textRef.current.scrollHeight;

      setShouldTruncate(actualHeight > maxHeight);
    }
  }, [text]);

  return (
    <div className="mb-3">
      <p
        ref={textRef}
        className={`text-text-gray text-sm leading-relaxed whitespace-pre-line ${
          !isExpanded && shouldTruncate ? 'line-clamp-2' : ''
        }`}
      >
        {text}
      </p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-electric-lime hover:text-electric-lime/80 font-bold mt-1 transition-colors"
        >
          {isExpanded ? '접기' : '더보기'}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
