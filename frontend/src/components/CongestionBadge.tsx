interface CongestionBadgeProps {
  level: number; // 1-5
  placeName: string;
  variant?: 'default' | 'compact' | 'detailed';
}

/**
 * 혼잡도 시각화 배지 컴포넌트
 *
 * 서울시 실시간 혼잡도를 색상과 텍스트로 표시
 *
 * @param level - 혼잡도 레벨 (1: 여유, 2: 보통, 3: 약간 붐빔, 4: 붐빔, 5: 매우 붐빔)
 * @param placeName - 장소명
 * @param variant - 표시 스타일 ('default' | 'compact' | 'detailed')
 *
 * @example
 * <CongestionBadge level={1} placeName="광화문·덕수궁" />
 * <CongestionBadge level={3} placeName="강남역" variant="compact" />
 */
const CongestionBadge = ({
  level,
  placeName,
  variant = 'default'
}: CongestionBadgeProps) => {

  // 혼잡도 레벨에 따른 스타일 정보
  const getCongestionStyle = () => {
    switch (level) {
      case 1: // 여유
        return {
          icon: '🟢',
          text: '지금 여유로워요',
          shortText: '여유',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-300',
          gradientFrom: 'from-green-400',
          gradientTo: 'to-emerald-500',
        };
      case 2: // 보통
        return {
          icon: '🔵',
          text: '보통이에요',
          shortText: '보통',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-300',
          gradientFrom: 'from-blue-400',
          gradientTo: 'to-cyan-500',
        };
      case 3: // 약간 붐빔
        return {
          icon: '🟡',
          text: '조금 붐빌 수 있어요',
          shortText: '약간 붐빔',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-300',
          gradientFrom: 'from-yellow-400',
          gradientTo: 'to-amber-500',
        };
      case 4: // 붐빔
        return {
          icon: '🟠',
          text: '혼잡해요',
          shortText: '붐빔',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-300',
          gradientFrom: 'from-orange-400',
          gradientTo: 'to-red-500',
        };
      case 5: // 매우 붐빔
        return {
          icon: '🔴',
          text: '매우 혼잡해요',
          shortText: '매우 붐빔',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-300',
          gradientFrom: 'from-red-400',
          gradientTo: 'to-rose-600',
        };
      default:
        return {
          icon: '⚪',
          text: '정보 없음',
          shortText: '정보 없음',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
          gradientFrom: 'from-gray-400',
          gradientTo: 'to-gray-500',
        };
    }
  };

  const style = getCongestionStyle();

  // Compact 버전: 작은 배지 (미션 카드 헤더용)
  if (variant === 'compact') {
    return (
      <span
        className={`
          inline-flex items-center gap-1.5
          px-3 py-1
          ${style.bgColor} ${style.textColor}
          text-xs font-semibold
          rounded-full
          border ${style.borderColor}
        `}
      >
        <span className="text-xs">{style.icon}</span>
        <span>{style.shortText}</span>
      </span>
    );
  }

  // Detailed 버전: 그라디언트 배경 + 그림자 효과 (강조용)
  if (variant === 'detailed') {
    return (
      <div
        className={`
          flex items-center gap-2
          px-4 py-2.5
          bg-gradient-to-r ${style.gradientFrom} ${style.gradientTo}
          text-white
          rounded-full
          shadow-lg hover:shadow-xl
          transform hover:scale-105
          transition-all duration-200
        `}
      >
        <span className="text-lg">{style.icon}</span>
        <div className="flex flex-col">
          <span className="text-xs font-medium opacity-90">{placeName}</span>
          <span className="text-sm font-bold">{style.text}</span>
        </div>
      </div>
    );
  }

  // Default 버전: 표준 배지 (미션 카드 본문용)
  return (
    <div
      className={`
        inline-flex items-center gap-2
        px-3 py-1.5
        ${style.bgColor} ${style.textColor}
        text-sm font-semibold
        rounded-full
        border ${style.borderColor}
      `}
    >
      <span>{style.icon}</span>
      <span>{style.text}</span>
    </div>
  );
};

export default CongestionBadge;
