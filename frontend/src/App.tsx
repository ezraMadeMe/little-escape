import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import FeedPage from './pages/FeedPage';
import Reviews from './pages/Reviews';
import Appointments from './pages/Appointments';
import MyPage from './pages/MyPage';
import ChatAppointment from './pages/ChatAppointment';

// Legacy Pages (필요시 유지)
import MissionList from './pages/MissionList';
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

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// 온보딩 체크 컴포넌트 (메인 엔트리 포인트용)
const OnboardingGuard = () => {
  const token = localStorage.getItem('token');
  const onboardingComplete = localStorage.getItem('onboarding_complete');

  console.log('=== OnboardingGuard 체크 ===');
  console.log('토큰 존재:', !!token);
  console.log('온보딩 완료:', onboardingComplete === 'true');

  // 1. 토큰 없음 -> 로그인 페이지
  if (!token || token === 'null' || token === 'undefined') {
    console.log('🚫 토큰 없음 -> 로그인 페이지로 이동');
    return <Navigate to="/login" replace />;
  }

  // 2. 토큰 있음 + 온보딩 미완료 -> 온보딩 채팅
  if (onboardingComplete !== 'true') {
    console.log('📝 온보딩 미완료 -> 채팅 온보딩으로 이동');
    return <Navigate to="/chat" replace />;
  }

  // 3. 토큰 있음 + 온보딩 완료 -> 메인 화면
  console.log('✅ 온보딩 완료 -> 메인 미션 화면으로 이동');
  return <Navigate to="/missions" replace />;
};

function App() {
  return (
    <BrowserRouter>
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

        {/* Main Entry Point - Onboarding Guard */}
        <Route
          index
          path="/"
          element={<OnboardingGuard />}
        />

        {/* Missions Route - Without Bottom Navigation (Full Screen) */}
        <Route
          path="/missions"
          element={
            <ProtectedRoute>
              <MissionList />
            </ProtectedRoute>
          }
        />

        {/* Main App - With Bottom Navigation */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          {/* Bottom Nav Routes */}
          <Route path="feed" element={<FeedPage />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="mypage" element={<MyPage />} />
        </Route>

        {/* Chat Routes - Without Bottom Navigation */}
        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute>
              <ChatAppointment />
            </ProtectedRoute>
          }
        />
        
        {/* Dev: 온보딩 채팅 (파라미터 없이 직접 접근) */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatAppointment />
            </ProtectedRoute>
          }
        />
        
        {/* Dev: 온보딩 채팅 (Alias) */}
        <Route
          path="/appointment"
          element={
            <ProtectedRoute>
              <ChatAppointment />
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

        {/* Legacy Routes - 호환성 유지 */}
        <Route
          path="/pick-mission/:appointmentId"
          element={
            <ProtectedRoute>
              <PickMission />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mission/:appointmentId"
          element={
            <ProtectedRoute>
              <MissionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mission-proof/:appointmentId"
          element={
            <ProtectedRoute>
              <MissionProof />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
