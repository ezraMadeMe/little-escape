import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyInfo, checkNickname, updateProfile } from '../api/userApi';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = await getMyInfo();
      setNickname(user.nickname);
      setEmail(user.email || '');
      if (user.profileImageUrl) {
        setProfilePreview(user.profileImageUrl);
      }
    } catch (error) {
      console.error('유저 정보 조회 실패:', error);
    }
  };

  const handleNicknameCheck = async () => {
    if (!nickname.trim()) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }

    try {
      const isAvailable = await checkNickname(nickname);
      if (isAvailable) {
        setNicknameError('');
        alert('사용 가능한 닉네임입니다!');
      } else {
        setNicknameError('이미 사용 중인 닉네임입니다.');
      }
    } catch (error) {
      console.error('닉네임 중복 체크 실패:', error);
      setNicknameError('중복 체크에 실패했습니다.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        nickname,
        email: email || undefined,
      };

      await updateProfile(data, profileImage || undefined);
      alert('프로필이 수정되었습니다.');
      navigate('/mypage');

    } catch (error: any) {
      console.error('프로필 수정 실패:', error);
      alert(error.message || '프로필 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-[#FDFBF7] border-b border-gray-100 px-4 py-4 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">프로필 수정</h1>
        </div>

        <div className="p-6">
          {/* 프로필 이미지 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
              프로필 사진
            </label>
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 mb-4">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center shadow-lg">
                    <svg className="w-14 h-14 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="profile-image-edit"
              />
              <label
                htmlFor="profile-image-edit"
                className="px-6 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg cursor-pointer hover:bg-purple-200 transition"
              >
                사진 변경
              </label>
            </div>
          </div>

          {/* 닉네임 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="닉네임을 입력하세요"
              />
              <button
                onClick={handleNicknameCheck}
                className="px-4 py-3 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition"
              >
                중복 체크
              </button>
            </div>
            {nicknameError && (
              <p className="text-xs text-red-500 mt-1">{nicknameError}</p>
            )}
          </div>

          {/* 이메일 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              이메일 (선택)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="example@email.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              월간 리포트 수신 등에 사용됩니다.
            </p>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={loading || !nickname.trim()}
            className="w-full py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
