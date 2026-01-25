import { Outlet } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useBackButtonHandler } from '../hooks/useBackButtonHandler';

const MainLayout = () => {
  // 뒤로가기 두 번으로 앱 종료
  useBackButtonHandler();

  return (
    <div className="min-h-screen bg-deep-charcoal pb-24">
      {/* 메인 콘텐츠 */}
      <Outlet />

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;