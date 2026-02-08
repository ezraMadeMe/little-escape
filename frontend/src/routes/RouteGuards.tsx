import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getMyInfo } from '../api/userApi';
import { getNextAppointment } from '../api/appointmentApi';

// ID 유효성 검사 헬퍼 함수
const isValidId = (id: string | null): boolean => {
  return !!(id && id !== 'null' && id !== 'undefined' && id.trim() !== '' && !isNaN(Number(id)));
};

/**
 * 뉴비 전용 라우트 가드
 * 이미 온보딩을 완료했거나 약속이 있는 사용자는 접근 불가
 * 용도: /chat (온보딩) 보호
 *
 * 크로스 디바이스 지원: 서버에서 isOnboarded 상태를 비동기로 확인
 */
export const RequireNewUser = ({ children }: { children: ReactNode }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const onboardingComplete = localStorage.getItem('onboarding_complete');
      const appointmentId = localStorage.getItem('appointmentId');

      // 1. 약속이 있는 경우 -> 미션 상세 페이지로
      if (isValidId(appointmentId)) {
        console.warn('⚠️ [RequireNewUser] 약속이 있는 유저 -> /mission으로 리다이렉트');
        setShouldRedirect(`/mission/${appointmentId}`);
        setIsChecking(false);
        return;
      }

      // 2. localStorage에 온보딩 완료 표시 -> 피드로
      if (onboardingComplete === 'true') {
        console.warn('⚠️ [RequireNewUser] 온보딩 완료 유저 (로컬) -> /feed로 리다이렉트');
        setShouldRedirect('/feed');
        setIsChecking(false);
        return;
      }

      // 3. 서버에서 isOnboarded 확인 (크로스 디바이스 지원)
      try {
        const user = await getMyInfo();
        const hasPreferences = user.mbti || user.soloLevel;

        if (user.isOnboarded || hasPreferences) {
          console.warn('⚠️ [RequireNewUser] 온보딩 완료 유저 (서버) -> /feed로 리다이렉트');
          localStorage.setItem('onboarding_complete', 'true');
          setShouldRedirect('/feed');
          setIsChecking(false);
          return;
        }
      } catch (error) {
        console.log('ℹ️ [RequireNewUser] 서버 확인 실패, 로컬 상태 기반 진행:', error);
      }

      // 4. 신규 유저 -> 온보딩 진행
      console.log('✅ [RequireNewUser] 신규 유저 -> 온보딩 진행');
      setIsChecking(false);
    };

    checkStatus();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-charcoal">
        <div className="w-8 h-8 border-4 border-electric-lime border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (shouldRedirect) {
    return <Navigate to={shouldRedirect} replace />;
  }

  return <>{children}</>;
};

/**
 * 약속 필수 라우트 가드
 * 약속이 없는 사용자는 접근 불가
 * 용도: /missions, /mission/:id 등
 */
export const RequireAppointment = ({ children }: { children: ReactNode }) => {
  const params = useParams();
  const appointmentId = localStorage.getItem('appointmentId');

  // URL 파라미터의 appointmentId 또는 localStorage의 appointmentId 확인
  const urlAppointmentId = params.appointmentId;

  console.log('🔍 [RequireAppointment] 체크');
  console.log('  - URL appointmentId:', urlAppointmentId);
  console.log('  - localStorage appointmentId:', appointmentId);

  // URL에 appointmentId가 있으면 localStorage에 저장하고 통과
  if (urlAppointmentId && isValidId(urlAppointmentId)) {
    console.log('✅ [RequireAppointment] URL appointmentId 유효 -> 접근 허용');
    // localStorage 동기화
    if (appointmentId !== urlAppointmentId) {
      localStorage.setItem('appointmentId', urlAppointmentId);
    }
    return <>{children}</>;
  }

  // localStorage의 appointmentId가 유효하면 통과
  if (isValidId(appointmentId)) {
    console.log('✅ [RequireAppointment] localStorage appointmentId 유효 -> 접근 허용');
    return <>{children}</>;
  }

  // 둘 다 없으면 /feed로 리다이렉트
  console.warn('⚠️ [RequireAppointment] 약속이 없는 유저 -> /feed로 리다이렉트');
  return <Navigate to="/feed" replace />;
};

/**
 * 온보딩 완료 필수 라우트 가드
 * 온보딩을 완료하지 않은 사용자는 접근 불가
 * 단, 예정된 약속이 있는 경우는 예외 (피드/마이페이지 접근 허용)
 * 용도: /feed, /mypage 등 메인 기능
 */
export const RequireOnboarded = ({ children }: { children: ReactNode }) => {
  const onboardingComplete = localStorage.getItem('onboarding_complete');
  const appointmentId = localStorage.getItem('appointmentId');

  // 예정된 약속이 있으면 온보딩 완료 여부와 관계없이 접근 허용
  if (isValidId(appointmentId)) {
    console.log('✅ [RequireOnboarded] 약속이 있는 유저 -> 접근 허용');
    return <>{children}</>;
  }

  // 약속이 없고 온보딩도 미완료 -> /chat로 리다이렉트
  if (onboardingComplete !== 'true') {
    console.warn('⚠️ [RequireOnboarded] 온보딩 미완료 유저 -> /chat로 리다이렉트');
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
};

/**
 * 글로벌 리다이렉트 로직
 * 앱 최초 진입 시 사용자 상태에 따라 적절한 페이지로 이동
 * 서버에서 isOnboarded 상태를 확인하여 자동로그인 시 온보딩 스킵
 */
export const SmartRedirect = () => {
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      const token = localStorage.getItem('token');
      const appointmentId = localStorage.getItem('appointmentId');
      const onboardingComplete = localStorage.getItem('onboarding_complete');

      console.log('=== SmartRedirect 체크 ===');
      console.log('토큰:', !!token);
      console.log('약속 ID:', appointmentId);
      console.log('온보딩 완료 (로컬):', onboardingComplete === 'true');

      // 1. 토큰 없음 -> 로그인 페이지
      if (!token || token === 'null' || token === 'undefined') {
        console.log('🚫 토큰 없음 -> /login');
        setRedirectPath('/login');
        setIsLoading(false);
        return;
      }

      // 2. 서버에서 유저 정보 확인 (자동로그인 시 isOnboarded 확인)
      try {
        const user = await getMyInfo();
        console.log('✅ 유저 정보 조회 성공:', user);

        // 서버의 isOnboarded가 true면 localStorage에도 동기화
        // 또는 MBTI/선호도가 설정되어 있으면 온보딩 완료로 간주 (기존 유저 호환)
        const hasPreferences = user.mbti || user.soloLevel;
        if (user.isOnboarded || hasPreferences) {
          localStorage.setItem('onboarding_complete', 'true');
          console.log('📝 온보딩 완료 상태 동기화됨 (isOnboarded:', user.isOnboarded, ', hasPreferences:', !!hasPreferences, ')');
        }

        // 3. 진행 중인 약속 확인
        try {
          const nextAppointment = await getNextAppointment();
          if (nextAppointment) {
            console.log('🎯 진행 중인 약속 발견:', nextAppointment);
            localStorage.setItem('appointmentId', String(nextAppointment.id));

            // 미완료 약속 (장소/미션 미선택)은 피드로 이동
            // 피드에서 배너를 통해 이어서 진행 가능
            const isIncomplete = !nextAppointment.placeName || !nextAppointment.missionTitle;
            if (isIncomplete) {
              console.log('📋 미완료 약속 -> /feed로 이동 (배너에서 이어하기)');
              setRedirectPath('/feed');
              setIsLoading(false);
              return;
            }

            // 정상적인 약속 (장소+미션 모두 있음) -> 미션 상세 페이지로
            console.log('✅ 완료된 약속 -> /mission으로 이동:', nextAppointment.id);
            setRedirectPath(`/mission/${nextAppointment.id}`);
            setIsLoading(false);
            return;
          }
        } catch {
          console.log('ℹ️ 진행 중인 약속 없음 (정상)');
        }

        // 4. 약속 없음 + 온보딩 상태로 분기
        if (user.isOnboarded || onboardingComplete === 'true') {
          console.log('✅ 온보딩 완료 -> /feed');
          setRedirectPath('/feed');
        } else {
          console.log('📝 신규 유저 -> /chat');
          setRedirectPath('/chat');
        }
      } catch (error) {
        console.error('❌ 유저 정보 조회 실패:', error);

        // 401 에러인 경우 토큰 만료 -> 로그인 페이지로
        const isAuthError = error instanceof Error &&
          (error.message.includes('401') || error.message.includes('Unauthorized'));

        if (isAuthError) {
          console.log('🚫 인증 에러 -> /login');
          localStorage.removeItem('token');
          setRedirectPath('/login');
          setIsLoading(false);
          return;
        }

        // 네트워크 에러 등 다른 에러인 경우 localStorage 기반 fallback
        console.log('⚠️ API 에러, localStorage 기반 fallback');
        if (isValidId(appointmentId)) {
          setRedirectPath(`/mission/${appointmentId}`);
        } else if (onboardingComplete === 'true') {
          setRedirectPath('/feed');
        } else {
          // 온보딩 미완료지만 토큰은 있음 -> 일단 /feed로 (서버 재연결 시 확인)
          setRedirectPath('/feed');
        }
      }

      setIsLoading(false);
    };

    checkUserStatus();
  }, []);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-charcoal">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-electric-lime border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-text-gray">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 리다이렉트
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // fallback
  return <Navigate to="/login" replace />;
};
