import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function MagicLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✨ 핵심: 요청을 보냈는지 체크하는 깃발
  const isRequestSent = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      alert('잘못된 접근입니다.');
      navigate('/login');
      return;
    }

    // ✨ 2. 이미 요청을 보낸 상태라면 중단 (Strict Mode 방지)
    if (isRequestSent.current) return;
    isRequestSent.current = true; // "나 이제 보낸다!" 깃발 꽂기

    const magicLogin = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/magic-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          // 백엔드 에러 메시지 확인
          const errorText = await response.text(); 
          console.error("❌ 서버 응답 에러:", response.status, errorText);
          throw new Error(`Magic login failed: ${response.status}`);
        }

        const data = await response.json();
        const { accessToken } = data;

        if (accessToken) {
          console.log("✅ 토큰 발급 성공!");
          localStorage.setItem('token', accessToken);
          alert('환영합니다!');
          navigate('/', { replace: true });
        } else {
          throw new Error('No access token received');
        }
      } catch (error) {
        console.error('🔥 최종 에러 캐치:', error);
        alert('유효하지 않은 링크이거나 만료되었습니다.');
        navigate('/login');
      }
    };

    magicLogin();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        {/* Simple Spinner */}
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">로그인 중입니다...</p>
      </div>
    </div>
  );
}

export default MagicLogin;
