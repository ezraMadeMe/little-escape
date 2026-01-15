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

        {/* Main App - With Bottom Navigation */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Default Route - Feed */}
          <Route index element={<Navigate to="/feed" replace />} />

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
          path="/missions"
          element={
            <ProtectedRoute>
              <MissionList />
            </ProtectedRoute>
          }
        />
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
