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
import LocationSetting from './pages/LocationSetting';

// Dev Pages
import DevConsole from './pages/DevConsole';

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

// 랜딩 페이지 가드 (자동 로그인 체크)
const LandingGuard = () => {
  const token = localStorage.getItem('token');
  const onboardingComplete = localStorage.getItem('onboarding_complete');
  const userLocation = localStorage.getItem('user_location');

  console.log('=== LandingGuard 체크 ===');
  console.log('토큰 존재:', !!token);
  console.log('온보딩 완료:', onboardingComplete === 'true');
  console.log('위치 설정:', !!userLocation);

  // 1. 토큰 없음 -> 로그인 페이지로 이동
  if (!token || token === 'null' || token === 'undefined') {
    console.log('🚫 토큰 없음 -> 로그인 페이지로 이동');
    return <Navigate to="/login" replace />;
  }

  // 2. 토큰 있음 + 온보딩 미완료 -> 온보딩 채팅으로 이동
  if (onboardingComplete !== 'true') {
    console.log('📝 온보딩 미완료 -> 채팅 온보딩으로 이동');
    return <Navigate to="/chat" replace />;
  }

  // 3. 토큰 있음 + 온보딩 완료 + 위치 미설정 -> 위치 설정 페이지로 이동
  if (!userLocation) {
    console.log('📍 위치 미설정 -> 위치 설정 페이지로 이동');
    return <Navigate to="/location" replace />;
  }

  // 4. 토큰 있음 + 온보딩 완료 + 위치 설정 완료 -> 피드 페이지로 이동 (자동 로그인)
  console.log('✅ 자동 로그인 성공 -> 피드 페이지로 이동');
  return <Navigate to="/feed" replace />;
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

        {/* Main Entry Point - Landing Guard (자동 로그인 체크) */}
        <Route
          index
          path="/"
          element={<LandingGuard />}
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
          <Route index path="feed" element={<FeedPage />} />
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

        {/* Dev Tools - God Mode Simulation */}
        <Route path="/dev-console" element={<DevConsole />} />

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
