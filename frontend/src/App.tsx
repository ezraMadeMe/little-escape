import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ReactNode, useEffect } from 'react';

// Layouts
import MainLayout from './layouts/MainLayout';

// Components
import DebugOverlay from './components/DebugOverlay';

// Route Guards
import { RequireNewUser, RequireAppointment, RequireOnboarded, SmartRedirect } from './routes/RouteGuards';

// Pages
import FeedPage from './pages/FeedPage';
import Reviews from './pages/Reviews';
import Appointments from './pages/Appointments';
import MyPage from './pages/MyPage';
import ChatAppointment from './pages/ChatAppointment';
import LocationSetting from './pages/LocationSetting';

// Dev Pages
import DevConsole from './pages/DevConsole';

// Legacy Pages (필요시 유지)
import MissionList from './pages/MissionList';
import TimePicker from './pages/TimePicker';
import AuthCallback from './pages/AuthCallback';
import OAuthCallback from './pages/OAuthCallback';
import PickMission from './pages/PickMission';
import MissionDetail from './pages/MissionDetail';
import MissionProof from './pages/MissionProof';
import LoginPage from './pages/LoginPage';
import MagicLogin from './pages/MagicLogin';
import Onboarding from './pages/Onboarding';
import ProfileEdit from './pages/ProfileEdit';
import Contact from './pages/Contact';
import SavedAppointments from './pages/SavedAppointments';
import SavedDetail from './pages/SavedDetail';
import ArchivedAppointmentDetail from './pages/ArchivedAppointmentDetail';
import { getNextAppointment } from './api/appointmentApi';
import { getAppointmentNavigationPath } from './utils/appointmentNavigation';

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

/**
 * 글로벌 리다이렉트 래퍼
 * 앱 실행 시 사용자 상태를 체크하여 적절한 페이지로 리다이렉트
 */
const GlobalRedirectWrapper = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const validateRedirect = async () => {
      const appointmentId = localStorage.getItem('appointmentId');
      const onboardingComplete = localStorage.getItem('onboarding_complete');
      const currentPath = location.pathname;

      console.log('=== GlobalRedirectWrapper 체크 ===');
      console.log('현재 경로:', currentPath);
      console.log('약속 ID:', appointmentId);
      console.log('온보딩 완료:', onboardingComplete === 'true');

      // 예외 경로: 피드, 마이페이지, 약속 목록, 로그인, 약속 설정 플로우 등은 체크 안 함
      const exemptPaths = ['/feed', '/mypage', '/appointments', '/reviews', '/mission', '/login', '/oauth/callback', '/auth/callback', '/magic-login', '/dev-console', '/profile-edit', '/contact', '/mypage/saved', '/saved/detail', '/location', '/time-picker'];
      if (exemptPaths.some(path => currentPath.startsWith(path))) {
        console.log('✅ 예외 경로 - 리다이렉트 skip');
        return;
      }

      const isOnboardingPath = currentPath.startsWith('/chat') || currentPath.startsWith('/onboarding');
      if (!isOnboardingPath) {
        return;
      }

      const hasStoredAppointmentId = appointmentId &&
        appointmentId !== 'null' &&
        appointmentId !== 'undefined' &&
        appointmentId.trim() !== '' &&
        !isNaN(Number(appointmentId));

      if (hasStoredAppointmentId) {
        const nextAppointment = await getNextAppointment();

        if (cancelled) {
          return;
        }

        if (nextAppointment) {
          console.log('🎯 유효한 진행 중 약속 확인 -> /mission으로 이동!');
          const targetPath = getAppointmentNavigationPath(nextAppointment);
          navigate(targetPath, { replace: true });
          return;
        }
      }

      if (onboardingComplete === 'true') {
        console.log('⚠️ 이미 가입한 유저가 온보딩 접근 -> /feed로 튕김!');
        navigate('/feed', { replace: true });
      }
    };

    validateRedirect();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      {/* Debug Overlay - 개발 모드 전용 */}
      <DebugOverlay />

      <GlobalRedirectWrapper>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/magic-login" element={<MagicLogin />} />

        {/* Onboarding Route */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Main Entry Point - Smart Redirect */}
        <Route
          index
          path="/"
          element={<SmartRedirect />}
        />

        {/* Location Setting Route */}
        <Route
          path="/location"
          element={
            <ProtectedRoute>
              <LocationSetting />
            </ProtectedRoute>
          }
        />

        {/* Time Picker Route */}
        <Route
          path="/time-picker"
          element={
            <ProtectedRoute>
              <TimePicker />
            </ProtectedRoute>
          }
        />

        {/* Missions Route - Without Bottom Navigation (Full Screen) - 약속 필수 */}
        <Route
          path="/missions"
          element={
            <ProtectedRoute>
              <RequireAppointment>
                <MissionList />
              </RequireAppointment>
            </ProtectedRoute>
          }
        />

        {/* Main App - With Bottom Navigation (온보딩 완료 필수) */}
        <Route element={
          <ProtectedRoute>
            <RequireOnboarded>
              <MainLayout />
            </RequireOnboarded>
          </ProtectedRoute>
        }>
          {/* Bottom Nav Routes */}
          <Route index path="feed" element={<FeedPage />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="mypage" element={<MyPage />} />

          {/* Mission Detail - Now with Bottom Nav */}
          <Route
            path="mission/:appointmentId"
            element={
              <RequireAppointment>
                <MissionDetail />
              </RequireAppointment>
            }
          />

          {/* Archived Appointment Detail - Now with Bottom Nav */}
          <Route
            path="archived/:appointmentId"
            element={<ArchivedAppointmentDetail />}
          />
        </Route>

        {/* Chat Routes - Without Bottom Navigation (뉴비 전용) */}
        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute>
              <RequireNewUser>
                <ChatAppointment />
              </RequireNewUser>
            </ProtectedRoute>
          }
        />

        {/* Dev: 온보딩 채팅 (파라미터 없이 직접 접근) - 뉴비 전용 */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <RequireNewUser>
                <ChatAppointment />
              </RequireNewUser>
            </ProtectedRoute>
          }
        />

        {/* Dev: 온보딩 채팅 (Alias) - 뉴비 전용 */}
        <Route
          path="/appointment"
          element={
            <ProtectedRoute>
              <RequireNewUser>
                <ChatAppointment />
              </RequireNewUser>
            </ProtectedRoute>
          }
        />

        {/* Profile & Contact Routes */}
        <Route
          path="/profile-edit"
          element={
            <ProtectedRoute>
              <ProfileEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mypage/saved"
          element={
            <ProtectedRoute>
              <SavedAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved/detail/:appointmentId"
          element={
            <ProtectedRoute>
              <SavedDetail />
            </ProtectedRoute>
          }
        />

        {/* Dev Tools - God Mode Simulation */}
        <Route path="/dev-console" element={<DevConsole />} />

        {/* Legacy Routes - 호환성 유지 (약속 필수) */}
        <Route
          path="/pick-mission/:appointmentId"
          element={
            <ProtectedRoute>
              <RequireAppointment>
                <PickMission />
              </RequireAppointment>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mission-proof/:appointmentId"
          element={
            <ProtectedRoute>
              <RequireAppointment>
                <MissionProof />
              </RequireAppointment>
            </ProtectedRoute>
          }
        />
        </Routes>
      </GlobalRedirectWrapper>
    </BrowserRouter>
  );
}

export default App;
