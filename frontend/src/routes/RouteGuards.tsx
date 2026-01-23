import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * 뉴비 전용 라우트 가드
 * 이미 온보딩을 완료했거나 약속이 있는 사용자는 접근 불가
 * 용도: /chat (온보딩) 보호
 */
export const RequireNewUser = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const onboardingComplete = localStorage.getItem('onboarding_complete');
  const appointmentId = localStorage.getItem('appointmentId');

  // 약속이 있는 경우 -> 미션 상세 페이지로 강제 이동
  if (appointmentId && appointmentId !== 'null' && appointmentId !== 'undefined') {
    console.warn('⚠️ [RequireNewUser] 약속이 있는 유저 -> /mission으로 리다이렉트');
    return <Navigate to={`/mission/${appointmentId}`} replace />;
  }

  // 온보딩 완료한 경우 -> 피드로 이동
  if (onboardingComplete === 'true') {
    console.warn('⚠️ [RequireNewUser] 온보딩 완료 유저 -> /feed로 리다이렉트');
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};

/**
 * 약속 필수 라우트 가드
 * 약속이 없는 사용자는 접근 불가
 * 용도: /missions, /mission/:id 등
 */
export const RequireAppointment = ({ children }: { children: ReactNode }) => {
  const appointmentId = localStorage.getItem('appointmentId');

  // appointmentId가 없거나 유효하지 않으면 /feed로 리다이렉트
  if (!appointmentId || appointmentId === 'null' || appointmentId === 'undefined') {
    console.warn('⚠️ [RequireAppointment] 약속이 없는 유저 -> /feed로 리다이렉트');
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
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
  if (appointmentId && appointmentId !== 'null' && appointmentId !== 'undefined') {
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
 */
export const SmartRedirect = () => {
  const token = localStorage.getItem('token');
  const appointmentId = localStorage.getItem('appointmentId');
  const onboardingComplete = localStorage.getItem('onboarding_complete');
  const userLocation = localStorage.getItem('user_location');

  console.log('=== SmartRedirect 체크 ===');
  console.log('토큰:', !!token);
  console.log('약속 ID:', appointmentId);
  console.log('온보딩 완료:', onboardingComplete === 'true');
  console.log('위치 설정:', !!userLocation);

  // 1. 토큰 없음 -> 로그인 페이지
  if (!token || token === 'null' || token === 'undefined') {
    console.log('🚫 토큰 없음 -> /login');
    return <Navigate to="/login" replace />;
  }

  // 2. 약속 있음 -> 미션 상세 페이지 (최우선!)
  if (appointmentId && appointmentId !== 'null' && appointmentId !== 'undefined') {
    console.log('🎯 약속 있음 -> /mission으로 "납치"');
    return <Navigate to={`/mission/${appointmentId}`} replace />;
  }

  // 3. 온보딩 미완료 -> 온보딩 채팅
  if (onboardingComplete !== 'true') {
    console.log('📝 온보딩 미완료 -> /chat');
    return <Navigate to="/chat" replace />;
  }

  // 4. 위치 미설정 -> 위치 설정 페이지
  if (!userLocation) {
    console.log('📍 위치 미설정 -> /location');
    return <Navigate to="/location" replace />;
  }

  // 5. 모든 조건 만족 -> 피드
  console.log('✅ 기본 진입 -> /feed');
  return <Navigate to="/feed" replace />;
};
