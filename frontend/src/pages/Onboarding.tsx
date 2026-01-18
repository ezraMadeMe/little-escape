import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyInfo, checkNickname, getRandomNickname, completeOnboarding } from '../api/userApi';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = await getMyInfo();

      // 이미 온보딩 완료한 유저는 메인으로
      if (user.isOnboarded) {
        navigate('/feed');
        return;
      }

      // 소셜 로그인 유저: 랜덤 닉네임 생성
      if (user.profileImageUrl) {
        setProfilePreview(user.profileImageUrl);
      }

      const randomNick = await getRandomNickname();
      setNickname(randomNick);

    } catch (error) {
      console.error('유저 정보 로드 실패:', error);
      alert('유저 정보를 불러올 수 없습니다.');
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
    // 닉네임 필수
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        nickname,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
      };

      await completeOnboarding(data, profileImage || undefined);
      alert('환영합니다! 온보딩이 완료되었습니다.');
      navigate('/feed');

    } catch (error) {
      console.error('온보딩 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '온보딩에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          프로필 설정
        </h1>
        <p className="text-sm text-center text-gray-600 mb-8">
          작은 일탈에 오신 것을 환영합니다!
        </p>

        {/* Step 1: 프로필 이미지 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            프로필 사진
          </label>
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 mb-3">
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              id="profile-image"
            />
            <label
              htmlFor="profile-image"
              className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg cursor-pointer hover:bg-purple-200 transition"
            >
              사진 변경
            </label>
          </div>
        </div>

        {/* Step 2: 닉네임 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            닉네임 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="닉네임을 입력하세요"
            />
            <button
              onClick={handleNicknameCheck}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition"
            >
              중복 체크
            </button>
          </div>
          {nicknameError && (
            <p className="text-xs text-red-500 mt-1">{nicknameError}</p>
          )}
        </div>

        {/* Step 3: 이메일 (선택) */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            이메일 (선택 - 월간 리포트 수신용)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="example@email.com"
          />
        </div>

        {/* Step 4: 휴대폰 번호 (선택 - 소셜 로그인 유저용) */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            휴대폰 번호 (선택)
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="010-0000-0000"
          />
          <p className="text-xs text-gray-500 mt-1">
            알림 수신을 원하시면 휴대폰 번호를 입력해주세요.
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !nickname.trim()}
          className="w-full py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '처리 중...' : '시작하기'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
