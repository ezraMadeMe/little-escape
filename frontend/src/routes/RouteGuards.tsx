import { ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

// ID 유효성 검사 헬퍼 함수
const isValidId = (id: string | null): boolean => {
  return !!(id && id !== 'null' && id !== 'undefined' && id.trim() !== '' && !isNaN(Number(id)));
};

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
  if (isValidId(appointmentId)) {
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
 */
export const SmartRedirect = () => {
  const token = localStorage.getItem('token');
  const appointmentId = localStorage.getItem('appointmentId');
  const onboardingComplete = localStorage.getItem('onboarding_complete');

  console.log('=== SmartRedirect 체크 ===');
  console.log('토큰:', !!token);
  console.log('약속 ID:', appointmentId);
  console.log('온보딩 완료:', onboardingComplete === 'true');

  // 1. 토큰 없음 -> 로그인 페이지
  if (!token || token === 'null' || token === 'undefined') {
    console.log('🚫 토큰 없음 -> /login');
    return <Navigate to="/login" replace />;
  }

  // 2. Priority 1: 진행 중인 약속이 있으면 약속 상세로
  if (isValidId(appointmentId)) {
    console.log('🎯 진행 중인 약속 있음 -> /mission으로 이동');
    return <Navigate to={`/mission/${appointmentId}`} replace />;
  }

  // 3. Priority 2: 온보딩 완료 -> 피드로
  if (onboardingComplete === 'true') {
    console.log('✅ 온보딩 완료 -> /feed');
    return <Navigate to="/feed" replace />;
  }

  // 4. Priority 3: 뉴비 -> 채팅 온보딩으로
  console.log('📝 신규 유저 -> /chat');
  return <Navigate to="/chat" replace />;
};
