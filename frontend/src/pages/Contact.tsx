import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendContactEmail } from '../api/userApi';

const Contact = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages((prev) => [...prev, ...filesArray]);

      // 미리보기 생성
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        subject,
        content,
      };

      await sendContactEmail(data, images.length > 0 ? images : undefined);
      alert('문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
      navigate('/mypage');

    } catch (error: any) {
      console.error('문의 발송 실패:', error);
      alert(error.message || '문의 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-charcoal text-off-white">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-deep-charcoal border-b border-charcoal-lighter px-4 py-4 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-off-white hover:text-electric-lime transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-off-white">문의하기</h1>
        </div>

        <div className="p-6">
          <p className="text-sm text-text-gray mb-6">
            서비스 이용 중 불편하신 점이나 개선이 필요한 부분을 알려주세요.
          </p>

          {/* 제목 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-text-gray mb-2">
              제목 <span className="text-accent-pink">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 bg-charcoal-lighter text-off-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-lime"
              placeholder="문의 제목을 입력하세요"
            />
          </div>

          {/* 내용 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-text-gray mb-2">
              내용 <span className="text-accent-pink">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-charcoal-lighter text-off-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-lime h-40 resize-none"
              placeholder="문의 내용을 자세히 작성해주세요"
            />
          </div>

          {/* 이미지 첨부 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-text-gray mb-2">
              이미지 첨부 (선택)
            </label>

            {/* 이미지 미리보기 */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-charcoal-lighter"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-accent-pink text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              id="contact-images"
            />
            <label
              htmlFor="contact-images"
              className="w-full py-3 px-4 border-2 border-dashed border-charcoal-lighter rounded-lg text-center text-sm text-text-gray cursor-pointer hover:border-electric-lime hover:text-electric-lime transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              이미지 추가
            </label>
            <p className="text-xs text-text-gray-dark mt-2">
              스크린샷이나 관련 이미지를 첨부하시면 더 빠른 답변이 가능합니다.
            </p>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={loading || !subject.trim() || !content.trim()}
            className="w-full py-4 bg-gradient-to-br from-electric-lime to-neon-purple text-deep-charcoal font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '발송 중...' : '문의하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contact;
