import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getMyInfo, deleteUser } from '../api/userApi';
import { User } from '../types/user';

const MyPage = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
    localStorage.clear();
    console.log('✅ 로그아웃: localStorage 초기화 완료');
    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말로 회원 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.')) {
      return;
    }

    try {
      await deleteUser();
      localStorage.clear();
      alert('회원 탈퇴가 완료되었습니다.');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('회원 탈퇴 실패:', error);
      alert('회원 탈퇴에 실패했습니다.');
    }
  };

  const myActivityItems = [
    {
      icon: '📂',
      title: '저장한 일탈',
      description: '마음에 든 약속 모아보기',
      onClick: () => navigate('/mypage/saved'),
      highlight: true,
    },
    {
      icon: '✏️',
      title: '프로필 수정',
      description: '닉네임, 프로필 사진 변경하기',
      onClick: () => navigate('/profile-edit'),
    },
  ];

  const devItems = [
    {
      icon: '📧',
      title: '문의하기',
      description: '1:1 문의를 남겨주세요',
      onClick: () => navigate('/contact'),
    },
  ];

  return (
    <div className="min-h-screen bg-deep-charcoal">
      <div className="container-solotion pb-24">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-charcoal-lighter px-4 py-6"
        >
          <h1 className="text-off-white text-2xl font-extra-bold">마이페이지</h1>
        </motion.div>

        {/* 프로필 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mx-4 my-6"
        >
          <div className="flex items-center gap-4">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-electric-lime/30"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-electric-lime to-neon-purple rounded-full flex items-center justify-center">
                <span className="text-deep-charcoal text-2xl font-bold">👤</span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-off-white text-lg font-bold">{user?.nickname || '사용자'}</h2>
              <p className="text-text-gray text-sm">{user?.email || '작은 일탈을 즐기는 중'}</p>
            </div>
          </div>
        </motion.div>

        {/* 나의 활동 */}
        <div className="px-4 space-y-3 mb-6">
          <h3 className="text-off-white text-lg font-bold">나의 활동</h3>
          {myActivityItems.map((item, index) => (
            <motion.button
              key={index}
              onClick={item.onClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="card w-full text-left clickable"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <h4 className="text-off-white font-semibold">{item.title}</h4>
                  <p className="text-text-gray text-sm mt-0.5">{item.description}</p>
                </div>
                <svg className="w-5 h-5 text-text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.button>
          ))}
        </div>

        {/* 개발자에게 */}
        <div className="px-4 space-y-3 mb-6">
          <h3 className="text-off-white text-lg font-bold">개발자에게</h3>
          {devItems.map((item, index) => (
            <motion.button
              key={index}
              onClick={item.onClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="card w-full text-left clickable"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <h4 className="text-off-white font-semibold">{item.title}</h4>
                  <p className="text-text-gray text-sm mt-0.5">{item.description}</p>
                </div>
                <svg className="w-5 h-5 text-text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.button>
          ))}
        </div>

        {/* 계정 관리 섹션 */}
        <div className="px-4 space-y-3">
          <h3 className="text-off-white text-lg font-bold">계정</h3>

          <motion.button
            onClick={() => setShowLogoutConfirm(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card w-full text-left clickable"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚪</span>
              <div className="flex-1">
                <h4 className="text-off-white font-semibold">로그아웃</h4>
                <p className="text-text-gray text-sm mt-0.5">다음에 또 만나.</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            onClick={handleDeleteAccount}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card w-full text-left clickable border-accent-pink/30"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗑️</span>
              <div className="flex-1">
                <h4 className="text-accent-pink font-semibold">회원 탈퇴</h4>
                <p className="text-text-gray text-sm mt-0.5">계정 및 모든 데이터가 삭제돼.</p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* 버전 정보 */}
        <div className="px-4 text-center text-xs text-text-gray-dark mb-6">
          <p>작은 일탈 v1.2.0</p>
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 z-50"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-charcoal-soft rounded-t-3xl shadow-2xl max-w-md mx-auto border-t border-charcoal-lighter"
          >
            <div className="p-6">
              <div className="w-12 h-1 bg-charcoal-lighter rounded-full mx-auto mb-6"></div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-charcoal-lighter rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👋</span>
                </div>
                <h3 className="text-off-white text-xl font-extra-bold mb-2">
                  정말 로그아웃할 거야?
                </h3>
                <p className="text-text-gray text-sm">
                  언제든지 다시 돌아올 수 있어.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleLogout}
                  className="btn-primary w-full"
                >
                  로그아웃
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn-ghost w-full"
                >
                  취소
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default MyPage;