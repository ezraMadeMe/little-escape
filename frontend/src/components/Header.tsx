import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMyInfo } from '../api/userApi';
import { User } from '../types/user';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      console.log('Header - Token exists:', !!token);
      console.log('Header - Token value:', token);

      if (token) {
        try {
          const data = await getMyInfo();
          console.log('Header - User data loaded:', data);
          console.log('Header - User nickname:', data.nickname);
          console.log('Header - User profileImageUrl:', data.profileImageUrl);
          setUser(data);
        } catch (error) {
          console.error('Header - Failed to load user info:', error);
          if (error instanceof Error) {
            console.error('Header - Error message:', error.message);
          }
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        console.log('Header - No token found, setting user to null');
        setUser(null);
      }
    };

    loadUser();
  }, [location.pathname]); // URL 변경 시마다 사용자 정보 다시 로드

  console.log('Header render - user state:', user);
  console.log('Header render - is user truthy?', !!user);

  return (
    // 배경색/그림자 제거, 배경 블러 처리만 살짝 (유리 느낌)
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-transparent backdrop-blur-sm">
      {/* 로고 */}
      <div
        onClick={() => navigate('/')}
        className="font-bold text-xl text-purple-600 cursor-pointer"
      >
        Little Escape
      </div>

      {/* 우측 유저 영역 */}
      <div>
        {user ? (
          <div 
            // 클릭 시 약속 리스트(또는 마이페이지)로 이동
            onClick={() => navigate('/mypage')} 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
          >
            <span className="text-gray-800 font-medium text-sm">{user.nickname}</span>
            <img
              src={user.profileImageUrl || "https://via.placeholder.com/150"}
              alt="Profile"
              className="w-9 h-9 rounded-full border border-gray-200 object-cover"
            />
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-gray-500 hover:text-purple-600"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;