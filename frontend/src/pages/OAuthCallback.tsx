import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      // 토큰 저장 후 메인 페이지로 이동
      navigate('/');
    } else {
      console.error('로그인 토큰이 없습니다.');
      // 실패 시 다시 로그인 페이지로
      navigate('/login');
    }
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
