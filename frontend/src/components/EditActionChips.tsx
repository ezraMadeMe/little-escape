interface EditActionChipsProps {
  onTimeChange: () => void;
  onLocationChange: () => void;
}

const EditActionChips = ({ onTimeChange, onLocationChange }: EditActionChipsProps) => {
  console.log('============ EditActionChips 렌더링 ============');

  return (
    <div className="w-full bg-white rounded-2xl px-4 py-4 shadow-sm">
      <p className="text-sm text-gray-600 mb-3">
        약속을 수정하시겠어요? ✏️
      </p>

      {/* 가로 스크롤 가능한 액션 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* 시간 변경 */}
        <button
          onClick={onTimeChange}
          className="flex-shrink-0 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
        >
          <span className="text-lg">📅</span>
          <span className="text-sm whitespace-nowrap">시간 변경</span>
        </button>

        {/* 위치 변경 */}
        <button
          onClick={onLocationChange}
          className="flex-shrink-0 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
        >
          <span className="text-lg">📍</span>
          <span className="text-sm whitespace-nowrap">위치 변경</span>
        </button>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default EditActionChips;
