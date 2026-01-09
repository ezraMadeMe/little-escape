import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MissionList from './pages/MissionList';
import AuthCallback from './pages/AuthCallback';
import MyPage from './pages/MyPage';
import PickMission from './pages/PickMission';
import MissionDetail from './pages/MissionDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MissionList />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/pick-mission/:appointmentId" element={<PickMission />} />
        <Route path="/mission/:appointmentId" element={<MissionDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
