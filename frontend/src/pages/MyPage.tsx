import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyInfo, deleteUser } from '../api/userApi';
import { User } from '../types/user';

const MyPage = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userInfo = await getMyInfo();
      setUser(userInfo);
    } catch (error) {
      console.error('유저 정보 조회 실패:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말로 회원 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.')) {
      return;
    }

    try {
      await deleteUser();
      localStorage.removeItem('token');
      alert('회원 탈퇴가 완료되었습니다.');
      navigate('/login');
    } catch (error) {
      console.error('회원 탈퇴 실패:', error);
      alert('회원 탈퇴에 실패했습니다.');
    }
  };

  const menuItems = [
    {
      icon: '✏️',
      title: '프로필 수정',
      description: '닉네임, 프로필 사진 변경하기',
      onClick: () => navigate('/profile-edit'),
    },
    {
      icon: '📧',
      title: '문의하기',
      description: '1:1 문의를 남겨주세요',
      onClick: () => navigate('/contact'),
    },
    {
      icon: '📄',
      title: '이용약관',
      description: '서비스 이용약관 확인하기',
      onClick: () => alert('이용약관 페이지 준비 중입니다.'),
    },
    {
      icon: '🔒',
      title: '개인정보 처리방침',
      description: '개인정보 보호정책 확인하기',
      onClick: () => alert('개인정보 처리방침 페이지 준비 중입니다.'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        </div>

        {/* 프로필 섹션 */}
        <div className="bg-white border-b border-gray-200 px-4 py-6">
          <div className="flex items-center gap-4">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">👤</span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">{user?.nickname || '사용자'}</h2>
              <p className="text-sm text-gray-600">{user?.email || '작은 일탈을 즐기는 중'}</p>
            </div>
          </div>
        </div>

        {/* 메뉴 섹션 */}
        <div className="p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 px-2 mb-3">지원</h3>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* 계정 관리 섹션 */}
        <div className="p-4 space-y-2 mt-4">
          <h3 className="text-sm font-semibold text-gray-500 px-2 mb-3">계정</h3>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚪</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">로그아웃</h4>
                <p className="text-xs text-gray-600 mt-0.5">다음에 또 만나요</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗑️</span>
              <div className="flex-1">
                <h4 className="font-semibold text-red-600">회원 탈퇴</h4>
                <p className="text-xs text-gray-600 mt-0.5">계정 및 모든 데이터가 삭제됩니다</p>
              </div>
            </div>
          </button>
        </div>

        {/* 버전 정보 */}
        <div className="p-4 text-center text-xs text-gray-400 mt-8">
          <p>작은 일탈 v1.2.0</p>
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto animate-slideUp">
            <div className="p-6">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👋</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  정말 로그아웃 하시겠어요?
                </h3>
                <p className="text-sm text-gray-600">
                  언제든지 다시 돌아올 수 있어요
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition"
                >
                  로그아웃
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MyPage;
