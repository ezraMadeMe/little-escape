import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyInfo } from '../api/userApi';

function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');

      if (token) {
        localStorage.setItem('token', token);

        // 유저 정보 조회하여 온보딩 여부 확인
        try {
          const user = await getMyInfo();

          // GUEST 유저 또는 온보딩 미완료 유저 -> 온보딩 페이지로
          if (user.role === 'GUEST' || !user.isOnboarded) {
            navigate('/onboarding');
          } else {
            // 정식 회원이고 온보딩 완료 -> 메인으로
            navigate('/feed');
          }
        } catch (error) {
          console.error('유저 정보 조회 실패:', error);
          // 에러 시 기본적으로 온보딩 페이지로
          navigate('/onboarding');
        }
      } else {
        console.error('로그인 토큰이 없습니다.');
        navigate('/login');
      }

      setChecking(false);
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-lg text-gray-600">로그인 중입니다...</div>
      </div>
    </div>
  );
}

export default OAuthCallback;
