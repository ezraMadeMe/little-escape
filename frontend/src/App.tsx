import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MissionList from './pages/MissionList';
import AuthCallback from './pages/AuthCallback';
import MyPage from './pages/MyPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MissionList />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
