import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { completeAppointment, getAppointmentDetail } from '../api/appointmentApi';
import { getMyInfo } from '../api/userApi';
import { createSuggestion } from '../api/suggestionApi';
import { Appointment } from '../types/appointment';
import { User } from '../types/user';

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

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [proofComment, setProofComment] = useState<string>('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionContent, setSuggestionContent] = useState('');
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [appointmentId]);

  const loadData = async () => {
    try {
      if (!appointmentId) return;
      const [appointmentData, userData] = await Promise.all([
        getAppointmentDetail(Number(appointmentId)),
        getMyInfo(),
      ]);
      setAppointment(appointmentData);
      setUser(userData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    }
  };

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

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!appointmentId) {
      alert('약속 ID가 없습니다.');
      return;
    }

    try {
      setIsSubmitting(true);

      const keywords = selectedKeywords.length > 0
        ? selectedKeywords
        : ['완료했어'];

      await completeAppointment(
        Number(appointmentId),
        proofComment.trim(),
        keywords,
        imageFiles
      );

      alert('미션 인증이 완료되었습니다!');
      navigate('/mypage');
    } catch (error) {
      alert('인증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendSuggestion = async () => {
    if (!suggestionContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      setIsSendingSuggestion(true);
      await createSuggestion(suggestionContent);
      alert('제보가 접수되었습니다. 감사합니다! 🙏');
      setSuggestionContent('');
      setShowSuggestionModal(false);
    } catch (error) {
      console.error('제보 전송 실패:', error);
      alert('제보 전송에 실패했습니다.');
    } finally {
      setIsSendingSuggestion(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      setIsDownloading(true);
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `solotion-receipt-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('이미지 다운로드 실패:', error);
      alert('이미지 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  return (
    <div className="min-h-screen bg-deep-charcoal pb-32">
      {/* 헤더 */}
      <div className="bg-charcoal-soft border-b border-charcoal-lighter px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-charcoal-lighter rounded-lg transition"
          >
            <svg className="w-6 h-6 text-off-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-extra-bold text-off-white">미션 인증하기</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
        {/* 영수증 UI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div
            ref={receiptRef}
            className="bg-off-white mx-auto max-w-md relative"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), 98% calc(100% - 15px), 96% calc(100% - 20px), 94% calc(100% - 15px), 92% calc(100% - 20px), 90% calc(100% - 15px), 88% calc(100% - 20px), 86% calc(100% - 15px), 84% calc(100% - 20px), 82% calc(100% - 15px), 80% calc(100% - 20px), 78% calc(100% - 15px), 76% calc(100% - 20px), 74% calc(100% - 15px), 72% calc(100% - 20px), 70% calc(100% - 15px), 68% calc(100% - 20px), 66% calc(100% - 15px), 64% calc(100% - 20px), 62% calc(100% - 15px), 60% calc(100% - 20px), 58% calc(100% - 15px), 56% calc(100% - 20px), 54% calc(100% - 15px), 52% calc(100% - 20px), 50% calc(100% - 15px), 48% calc(100% - 20px), 46% calc(100% - 15px), 44% calc(100% - 20px), 42% calc(100% - 15px), 40% calc(100% - 20px), 38% calc(100% - 15px), 36% calc(100% - 20px), 34% calc(100% - 15px), 32% calc(100% - 20px), 30% calc(100% - 15px), 28% calc(100% - 20px), 26% calc(100% - 15px), 24% calc(100% - 20px), 22% calc(100% - 15px), 20% calc(100% - 20px), 18% calc(100% - 15px), 16% calc(100% - 20px), 14% calc(100% - 15px), 12% calc(100% - 20px), 10% calc(100% - 15px), 8% calc(100% - 20px), 6% calc(100% - 15px), 4% calc(100% - 20px), 2% calc(100% - 15px), 0 calc(100% - 20px))',
            }}
          >
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="text-center border-b-2 border-dashed border-deep-charcoal/20 pb-4">
                <div className="text-3xl font-black text-deep-charcoal mb-1" style={{ fontFamily: 'monospace' }}>
                  SOLOTION
                </div>
                <div className="text-xs text-deep-charcoal/60 tracking-widest">MISSION RECEIPT</div>
              </div>

              {/* Date & Time */}
              <div className="flex justify-between items-center text-sm" style={{ fontFamily: 'monospace' }}>
                <span className="text-deep-charcoal/60">DATE/TIME</span>
                <span className="font-bold text-deep-charcoal">
                  {appointment ? formatDate(appointment.scheduledAt) : new Date().toLocaleDateString('ko-KR')}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-deep-charcoal/20"></div>

              {/* Items */}
              <div className="space-y-3" style={{ fontFamily: 'monospace' }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-xs text-deep-charcoal/60 mb-1">MISSION</div>
                    <div className="font-bold text-deep-charcoal text-lg">
                      {appointment?.missionTitle || '작은 일탈'}
                    </div>
                  </div>
                </div>

                {appointment?.placeName && (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-xs text-deep-charcoal/60 mb-1">LOCATION</div>
                      <div className="text-deep-charcoal font-semibold">
                        {appointment.placeName}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-xs text-deep-charcoal/60">VISIT COUNT</span>
                  <span className="font-bold text-deep-charcoal">
                    {appointment?.visitCount || 1}회
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-deep-charcoal/20"></div>

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-black" style={{ fontFamily: 'monospace' }}>
                <span className="text-deep-charcoal">TOTAL</span>
                <span className="text-electric-lime">PRICELESS</span>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-deep-charcoal/20"></div>

              {/* Signature */}
              <div className="text-center space-y-2">
                <div className="text-xs text-deep-charcoal/60 tracking-wide">CERTIFIED BY</div>
                <div className="relative inline-block">
                  <div className="text-2xl font-black text-deep-charcoal" style={{ fontFamily: 'monospace' }}>
                    {user?.nickname || '탈출러'}
                  </div>
                  <div className="absolute -right-8 -top-2 transform rotate-12">
                    <div className="border-2 border-electric-lime rounded-full px-3 py-1 text-xs font-bold text-electric-lime">
                      ✓ DONE
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Placeholder (Optional) */}
              <div className="flex justify-center pt-4">
                <div className="w-20 h-20 bg-deep-charcoal/10 flex items-center justify-center text-xs text-deep-charcoal/40">
                  [QR]
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-deep-charcoal/40 pt-2" style={{ fontFamily: 'monospace' }}>
                THANK YOU FOR YOUR ESCAPE
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="text-center mt-6">
            <button
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
              className="btn-primary inline-flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>생성 중...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>영수증 발급받기 (이미지 저장)</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* 키워드 선택 섹션 */}
        <div>
          <h2 className="text-xl font-bold text-off-white mb-4">이 미션, 어떠셨나요?</h2>
          <div className="flex flex-wrap gap-2">
            {REVIEW_KEYWORDS.map((keyword) => (
              <button
                key={keyword}
                onClick={() => handleKeywordToggle(keyword)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  selectedKeywords.includes(keyword)
                    ? 'bg-electric-lime text-deep-charcoal'
                    : 'bg-charcoal-lighter text-text-gray hover:bg-charcoal-lighter/80'
                }`}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>

        {/* 사진 업로드 섹션 */}
        <div>
          <h2 className="text-xl font-bold text-off-white mb-4">인증샷 업로드</h2>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-charcoal-lighter hover:border-electric-lime rounded-2xl flex flex-col items-center justify-center gap-2 transition text-text-gray hover:text-electric-lime"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-semibold">사진 추가</span>
          </button>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {imagePreviews.length > 0 && (
            <p className="text-sm text-text-gray mt-2">{imagePreviews.length}장의 사진이 선택되었습니다</p>
          )}
        </div>

        {/* 텍스트 후기 섹션 */}
        <div>
          <h2 className="text-xl font-bold text-off-white mb-4">더 남기고 싶은 말이 있나요?</h2>
          <textarea
            value={proofComment}
            onChange={(e) => setProofComment(e.target.value)}
            placeholder="선택 사항입니다"
            className="w-full h-32 px-4 py-3 bg-charcoal-lighter text-off-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-lime/50 transition resize-none placeholder-text-gray-dark"
          />
          <p className="text-sm text-text-gray mt-2">{proofComment.length}자</p>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-charcoal-soft border-t border-charcoal-lighter p-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* 제보 버튼 */}
          <div className="text-center">
            <button
              onClick={() => setShowSuggestionModal(true)}
              className="text-sm text-brand-muted underline hover:text-electric-lime transition-colors"
            >
              이 코스보다 좋은 곳 아는데...
            </button>
          </div>

          {/* 완료 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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

      {/* 제보 모달 */}
      {showSuggestionModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 z-40"
            onClick={() => {
              setShowSuggestionModal(false);
              setSuggestionContent('');
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-charcoal-soft rounded-t-3xl shadow-2xl max-w-md mx-auto border-t border-charcoal-lighter"
          >
            <div className="p-6">
              <div className="w-12 h-1 bg-charcoal-lighter rounded-full mx-auto mb-6"></div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-off-white text-xl font-extra-bold">
                    더 좋은 코스 추천
                  </h3>
                </div>
                <p className="text-text-gray text-sm mb-4">
                  이곳보다 더 좋은 장소나 코스를 알려주세요!
                </p>

                <textarea
                  value={suggestionContent}
                  onChange={(e) => setSuggestionContent(e.target.value)}
                  placeholder="야, 성수동에 OO카페는 꼭 넣어야지. 분위기 깡패임."
                  className="w-full bg-charcoal-lighter text-off-white rounded-2xl p-4 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-electric-lime/50 transition-all placeholder:text-text-gray-dark"
                  maxLength={500}
                />
                <p className="text-text-gray-dark text-xs mt-2 text-right">
                  {suggestionContent.length} / 500
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSendSuggestion}
                  disabled={isSendingSuggestion || !suggestionContent.trim()}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingSuggestion ? '보내는 중...' : '보내기'}
                </button>
                <button
                  onClick={() => {
                    setShowSuggestionModal(false);
                    setSuggestionContent('');
                  }}
                  className="btn-ghost w-full"
                >
                  취소
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

export default MissionProof;
