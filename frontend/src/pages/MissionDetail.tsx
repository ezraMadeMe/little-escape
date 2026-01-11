import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppointmentDetail, completeAppointment } from '../api/appointmentApi';
import { Appointment } from '../types/appointment';
import { supabase } from '../lib/supabaseClient';

type Tab = 'info' | 'map' | 'record';

function MissionDetail() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [proofComment, setProofComment] = useState<string>('');
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadAppointment = async () => {
      if (!appointmentId) {
        alert('약속 ID가 없습니다.');
        navigate('/mypage');
        return;
      }

      try {
        const data = await getAppointmentDetail(Number(appointmentId));
        setAppointment(data);
      } catch (err) {
        console.error('약속 로딩 실패:', err);
        alert('약속 정보를 불러오는데 실패했습니다.');
        navigate('/mypage');
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId, navigate]);

  const getDdayText = (scheduledAt: string): string => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    now.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);

    const diff = Math.floor((scheduled.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'D-Day';
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  const isPlaceUnlocked = (scheduledAt: string): boolean => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    now.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);
    return now >= scheduled;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setProofImageFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProofImageFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleComplete = async () => {
    if (!appointment) return;

    // Validate that image is selected
    if (!proofImageFile) {
      alert('인증 사진을 업로드해주세요!');
      return;
    }

    try {
      setIsUploading(true);

      // Upload image to Supabase Storage
      const userId = appointment.userId || 'unknown';
      const timestamp = Date.now();
      const fileExtension = proofImageFile.name.split('.').pop();
      const filePath = `proofs/${userId}_${appointmentId}_${timestamp}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from('mission-proofs')
        .upload(filePath, proofImageFile);

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('mission-proofs')
        .getPublicUrl(filePath);

      const proofImageUrl = urlData.publicUrl;

      // Complete appointment with both image URL and comment
      await completeAppointment(appointment.id, {
        proofComment: proofComment.trim() || '',
        proofImageUrl
      });

      alert('수고하셨습니다!');
      navigate('/mypage');
    } catch (err) {
      console.error('완료 처리 실패:', err);
      alert('완료 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-xl text-white">로딩 중...</div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  const unlocked = isPlaceUnlocked(appointment.scheduledAt);
  const backgroundImage = unlocked
    ? appointment.placeImageUrl || appointment.missionImageUrl
    : appointment.missionImageUrl;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-900">
      {/* 배경 이미지 - 화면 가로폭 꽉 채움 */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          filter: 'brightness(0.4)',
        }}
      />

      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 상단 헤더 (Safe Area 고려) */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 pt-10 pb-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/mypage')}
            className="text-white/90 hover:text-white transition-colors flex items-center gap-2 p-2 -ml-2 hover:bg-white/10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-base font-bold">나의 기록으로</span>
          </button>

          {/* D-Day 카운터 - 직각 디자인 */}
          <div className="bg-white/10 backdrop-blur-md px-5 py-2 border border-white/20">
            <span className="text-white font-bold text-lg tracking-wide">
              {getDdayText(appointment.scheduledAt)}
            </span>
          </div>
        </div>

        {/* 미션 제목 및 변경 버튼 */}
        <div className="text-center relative">
          <h1 className="text-3xl font-bold text-white mb-4 drop-shadow-xl leading-tight px-4">
            {appointment.missionTitle || '미션 미선택'}
          </h1>

          {!unlocked && (
            <button
              onClick={() => navigate(`/pick-mission/${appointmentId}`)}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 text-base text-white/90 transition-colors backdrop-blur-sm border border-white/10 mb-4"
            >
              <span>🔄 다른 일탈 찾아보기</span>
            </button>
          )}

          <p className="text-white/80 text-base font-medium">
            {new Date(appointment.scheduledAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* 하단 패널 - 직각 디자인 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/10 backdrop-blur-xl border-t border-white/20">
        {/* 탭 헤더 */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 h-14 text-center font-bold text-lg transition-all ${
              activeTab === 'info'
                ? 'text-white bg-white/10 border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            ℹ️ 일탈 가이드
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 h-14 text-center font-bold text-lg transition-all ${
              activeTab === 'map'
                ? 'text-white bg-white/10 border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            🗺️ 비밀 장소
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 h-14 text-center font-bold text-lg transition-all ${
              activeTab === 'record'
                ? 'text-white bg-white/10 border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            📝 나의 기록
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-8 pb-20 max-h-[55vh] overflow-y-auto overscroll-contain">
          {/* Tab 1: 정보 */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-white/90 text-xl font-light italic mb-8 drop-shadow-md">
                  "혼자만의 시간을 즐기세요"
                </p>
              </div>

              <div className="bg-white/5 p-6 border-b border-white/10">
                <h3 className="text-white font-bold text-xl mb-3">미션 설명</h3>
                <p className="text-white/90 leading-relaxed text-lg">
                  {appointment.missionTitle
                    ? '이 미션을 통해 당신만의 특별한 시간을 만들어보세요. 일상에서 벗어나 새로운 경험을 해보는 시간입니다.'
                    : '미션을 선택해주세요.'}
                </p>
              </div>

              <div className="bg-white/5 p-6 border-b border-white/10">
                <h3 className="text-white font-bold text-xl mb-3">수행 조건</h3>
                <ul className="text-white/90 space-y-3 text-lg">
                  <li>• 약속 시간에 지정된 장소를 방문하세요</li>
                  <li>• 그 순간을 온전히 즐기세요</li>
                  <li>• 완료 후 소감을 남겨주세요</li>
                </ul>
              </div>

              {appointment.visitCount && appointment.visitCount > 1 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-5 border border-amber-500/30 text-center">
                  <p className="text-amber-200 font-bold text-lg">
                    🏅 {appointment.visitCount}번째 만남입니다!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: 장소 */}
          {activeTab === 'map' && (
            <div className="space-y-6">
              {!unlocked ? (
                <div className="text-center py-12">
                  <div className="text-7xl mb-6">🔒</div>
                  <h3 className="text-white font-bold text-2xl mb-3">미스터리 장소</h3>
                  <p className="text-white/80 text-lg">
                    당일에 공개됩니다. 조금만 기다려주세요!
                  </p>
                  <div className="mt-10 bg-white/5 p-5 border border-white/10">
                    <p className="text-white/70 text-base">
                      D-Day가 되면 이곳에 장소 정보가 표시됩니다
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white/10 p-6 border-b border-white/20">
                    <h3 className="text-white font-bold text-2xl mb-3">
                      {appointment.placeName || '장소 정보 없음'}
                    </h3>
                    <p className="text-white/80 text-lg mb-6">
                      {appointment.placeAddress || '주소 정보 없음'}
                    </p>

                    {appointment.placeUrl && (
                      <a
                        href={appointment.placeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full h-14 bg-white/90 hover:bg-white text-gray-900 font-bold text-lg transition-all"
                      >
                        🗺️ 비밀 장소 확인하기
                      </a>
                    )}
                  </div>

                  {appointment.placeImageUrl && (
                    <div className="w-full overflow-hidden border-b border-white/20">
                      <img
                        src={appointment.placeImageUrl}
                        alt={appointment.placeName || '장소'}
                        className="w-full h-56 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: 기록 */}
          {activeTab === 'record' && (
            <div className="space-y-8">
              {/* Image Upload Section - Instagram Story Style */}
              <div>
                <h3 className="text-white font-bold text-xl mb-4">📸 인증샷 올리기</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {!previewUrl ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED'}
                    className="relative w-full h-72 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-white/30 hover:border-white/50 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="relative">
                        <div className="relative w-20 h-20 bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white font-bold text-lg">인증 사진을 추가해주세요</p>
                        <p className="text-white/60 text-sm">탭하여 갤러리에서 선택</p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="relative w-full h-96 overflow-hidden border-2 border-white/20 group">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-all border border-white/20 opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Memo Section */}
              <div>
                <h3 className="text-white font-bold text-xl mb-4">✍️ 오늘의 기록</h3>
                <textarea
                  value={proofComment}
                  onChange={(e) => setProofComment(e.target.value)}
                  placeholder="오늘의 작은 일탈은 어땠나요?"
                  disabled={appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED'}
                  className="w-full h-40 px-5 py-4 bg-white/10 border border-white/20 text-white text-lg placeholder-white/40 focus:bg-white/20 focus:border-white/40 transition-all outline-none resize-none disabled:opacity-50"
                />
              </div>

              {/* Complete Button */}
              {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && unlocked && (
                <button
                  onClick={handleComplete}
                  disabled={isUploading || !proofImageFile}
                  className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <span>✅ 일탈 완료 도장 찍기</span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </>
                  )}
                </button>
              )}

              {/* Completed Status */}
              {appointment.status === 'COMPLETED' && (
                <div className="space-y-4">
                  <div className="bg-green-500/20 border border-green-500/30 p-6 text-center">
                    <p className="text-green-200 font-bold text-xl mb-2">✅ 완료된 미션입니다</p>
                    {appointment.proofComment && (
                      <p className="text-green-100 text-lg italic mt-3">"{appointment.proofComment}"</p>
                    )}
                  </div>
                  {appointment.proofImageUrl && (
                    <div className="w-full overflow-hidden border border-white/20">
                      <img
                        src={appointment.proofImageUrl}
                        alt="Proof"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MissionDetail;
