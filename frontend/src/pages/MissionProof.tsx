import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { completeAppointment } from '../api/appointmentApi';

const REVIEW_KEYWORDS = [
  '🌿 힐링돼요',
  '🔥 뿌듯해요',
  '🤫 조용해요',
  '💪 활기차요',
  '👀 새로워요',
  '😌 편안해요',
];

function MissionProof() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [proofComment, setProofComment] = useState<string>('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeywordToggle = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
    } else {
      setSelectedKeywords([...selectedKeywords, keyword]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        return false;
      }
      return true;
    });

    setImageFiles([...imageFiles, ...newFiles]);

    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedKeywords.length === 0) {
      alert('최소 1개 이상의 감성 키워드를 선택해주세요.');
      return;
    }

    if (!appointmentId) {
      alert('약속 ID가 없습니다.');
      return;
    }

    try {
      setIsSubmitting(true);

      await completeAppointment(
        Number(appointmentId),
        proofComment.trim(),
        selectedKeywords,
        imageFiles
      );

      alert('미션 인증이 완료되었습니다!');
      navigate('/mypage');
    } catch (error) {
      console.error('인증 실패:', error);
      alert('인증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">미션 인증하기</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
        {/* 키워드 선택 섹션 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">이 미션, 어떠셨나요?</h2>
          <p className="text-sm text-gray-600 mb-4">느낀 감정을 선택해주세요 (복수 선택 가능)</p>
          <div className="flex flex-wrap gap-3">
            {REVIEW_KEYWORDS.map(keyword => (
              <button
                key={keyword}
                onClick={() => handleKeywordToggle(keyword)}
                className={`px-5 py-3 rounded-full font-semibold transition-all ${
                  selectedKeywords.includes(keyword)
                    ? 'bg-purple-600 text-white border-2 border-purple-600'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                }`}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 업로드 섹션 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">인증 사진 (선택)</h2>
          <p className="text-sm text-gray-600 mb-4">미션을 수행한 순간을 남겨보세요</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          <div className="flex gap-3 overflow-x-auto pb-2">
            {/* Add button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-28 h-28 border-2 border-dashed border-gray-300 hover:border-purple-400 bg-gray-50 hover:bg-purple-50 transition flex flex-col items-center justify-center gap-2"
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs text-gray-600">사진 추가</span>
            </button>

            {/* Image previews */}
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative flex-shrink-0 w-28 h-28 group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {imagePreviews.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">{imagePreviews.length}장의 사진이 선택되었습니다</p>
          )}
        </div>

        {/* 텍스트 후기 섹션 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">더 남기고 싶은 말이 있나요?</h2>
          <textarea
            value={proofComment}
            onChange={(e) => setProofComment(e.target.value)}
            placeholder="선택 사항입니다"
            className="w-full h-32 px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition resize-none text-gray-900 placeholder-gray-400"
          />
          <p className="text-sm text-gray-500 mt-2">{proofComment.length}자</p>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedKeywords.length === 0}
            className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>인증 중...</span>
              </>
            ) : (
              <span>인증 완료하고 일탈 끝내기</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MissionProof;
