import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyInfo } from '../api/userApi';
import { getNextAppointment } from '../api/appointmentApi';
import { getAppointmentNavigationPath } from '../utils/appointmentNavigation';

function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');

      if (token) {
        // 1. 토큰 저장
        localStorage.setItem('token', token);
        console.log('✅ OAuth 토큰 저장 완료');

        // 2. 유저 정보 조회
        try {
          const user = await getMyInfo();
          console.log('✅ 유저 정보 조회 성공:', user);

          // 3. 온보딩 상태 확인
          const isOnboarded = user.isOnboarded || localStorage.getItem('onboarding_complete') === 'true';

          // 4. 진행 중인 약속 확인 (최우선)
          try {
            const nextAppointment = await getNextAppointment();

            if (nextAppointment) {
              // 🎯 Priority 1: 진행 중인 약속이 있으면 무조건 약속 상세로!
              console.log('🎯 진행 중인 약속 발견! -> 약속 상세로 이동:', nextAppointment.id);
              localStorage.setItem('appointmentId', String(nextAppointment.id));
              localStorage.setItem('onboarding_complete', 'true');
              navigate(getAppointmentNavigationPath(nextAppointment), { replace: true });
              return;
            }
          } catch (appointmentError) {
            console.log('ℹ️ 진행 중인 약속 없음 (정상)');
          }

          // 5. 약속이 없는 경우 온보딩 상태로 분기
          if (!isOnboarded) {
            // Priority 2: 온보딩 미완료 -> 채팅 온보딩으로
            console.log('📝 온보딩 미완료 -> 채팅 온보딩 시작');
            navigate('/chat', { replace: true });
          } else {
            // Priority 3: 온보딩 완료 + 약속 없음 -> 피드로
            console.log('✅ 온보딩 완료 -> 피드로 이동');
            localStorage.setItem('onboarding_complete', 'true');
            navigate('/feed', { replace: true });
          }
        } catch (error) {
          console.error('❌ 유저 정보 조회 실패:', error);

          // 에러 발생 시에도 토큰이 있으므로 채팅 온보딩으로 시도
          console.log('⚠️ 에러 발생, 채팅 온보딩으로 이동');
          navigate('/chat', { replace: true });
        }
      } else {
        console.error('❌ 로그인 토큰이 없습니다.');
        navigate('/login', { replace: true });
      }
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
