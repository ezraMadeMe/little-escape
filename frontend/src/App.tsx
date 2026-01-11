import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MissionList from './pages/MissionList';
import AuthCallback from './pages/AuthCallback'; // 기존 콜백 유지 (혹은 제거 가능)
import OAuthCallback from './pages/OAuthCallback';
import MyPage from './pages/MyPage';
import PickMission from './pages/PickMission';
import MissionDetail from './pages/MissionDetail';
import MissionProof from './pages/MissionProof';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import MagicLogin from './pages/MagicLogin';
import { ReactNode } from 'react';

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// 헤더를 포함한 메인 레이아웃 컴포넌트 (조건부 렌더링을 위해 분리)
const AppContent = () => {
  const location = useLocation();
  const showHeader = location.pathname !== '/login' && location.pathname !== '/magic-login';

  return (
    <>
      {showHeader && <Header />}
      <div className={showHeader ? 'pt-16' : ''}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/magic-login" element={<MagicLogin />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <MissionList />
            </ProtectedRoute>
          } />
          <Route path="/mypage" element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          } />
          <Route path="/pick-mission/:appointmentId" element={
            <ProtectedRoute>
              <PickMission />
            </ProtectedRoute>
          } />
          <Route path="/mission/:appointmentId" element={
            <ProtectedRoute>
              <MissionDetail />
            </ProtectedRoute>
          } />
          <Route path="/mission-proof/:appointmentId" element={
            <ProtectedRoute>
              <MissionProof />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
