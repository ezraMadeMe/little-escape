import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getMyInfo, deleteUser } from '../api/userApi';
import { getMyAppointments } from '../api/appointmentApi';
import { createSuggestion } from '../api/suggestionApi';
import { User } from '../types/user';
import { Appointment, AppointmentStatus } from '../types/appointment';

const MyPage = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionContent, setSuggestionContent] = useState('');
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  useEffect(() => {
    loadUserInfo();
    loadAppointments();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userInfo = await getMyInfo();
      setUser(userInfo);
    } catch (error) {
      console.error('유저 정보 조회 실패:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      setIsLoadingAppointments(true);
      const data = await getMyAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('약속 목록 조회 실패:', error);
    } finally {
      setIsLoadingAppointments(false);
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

  const handleSendSuggestion = async () => {
    if (!suggestionContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      setIsSendingSuggestion(true);
      await createSuggestion(suggestionContent);
      alert('제보가 접수되었습니다. 감사합니다! 🙏');
      setSuggestionContent('');
      setShowSuggestionModal(false);
    } catch (error) {
      console.error('제보 전송 실패:', error);
      alert('제보 전송에 실패했습니다.');
    } finally {
      setIsSendingSuggestion(false);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    const activeStatuses = [
      AppointmentStatus.CREATED,
      AppointmentStatus.UNLOCKED,
      AppointmentStatus.PENDING,
      AppointmentStatus.ACCEPTED,
    ];

    if (activeStatuses.includes(appointment.status)) {
      navigate(`/mission/${appointment.id}`);
    } else if (appointment.status === AppointmentStatus.COMPLETED) {
      navigate(`/mission/${appointment.id}`);
    } else {
      alert('이 약속은 현재 확인할 수 없습니다.');
    }
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CREATED: return '생성됨';
      case AppointmentStatus.UNLOCKED: return '잠금 해제';
      case AppointmentStatus.PENDING: return '대기 중';
      case AppointmentStatus.ACCEPTED: return '수락됨';
      case AppointmentStatus.REJECTED: return '거절됨';
      case AppointmentStatus.COMPLETED: return '완료';
      case AppointmentStatus.CANCELLED: return '취소됨';
      case AppointmentStatus.NO_SHOW: return '불참';
      default: return status;
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CREATED: return 'bg-neon-purple/10 text-neon-purple border-neon-purple/30';
      case AppointmentStatus.UNLOCKED: return 'bg-electric-lime/10 text-electric-lime border-electric-lime/30';
      case AppointmentStatus.PENDING: return 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30';
      case AppointmentStatus.ACCEPTED: return 'bg-electric-lime/10 text-electric-lime border-electric-lime/30';
      case AppointmentStatus.REJECTED: return 'bg-accent-pink/10 text-accent-pink border-accent-pink/30';
      case AppointmentStatus.COMPLETED: return 'bg-text-gray/10 text-text-gray border-text-gray/30';
      case AppointmentStatus.CANCELLED: return 'bg-text-gray-dark/10 text-text-gray-dark border-text-gray-dark/30';
      case AppointmentStatus.NO_SHOW: return 'bg-accent-pink/10 text-accent-pink border-accent-pink/30';
      default: return 'bg-text-gray/10 text-text-gray border-text-gray/30';
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

        {/* 약속 목록 섹션 */}
        <div className="px-4 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-off-white text-lg font-bold">내 약속</h3>
            <button
              onClick={() => navigate('/appointments')}
              className="text-sm text-electric-lime hover:text-electric-lime-dark font-semibold transition-colors"
            >
              전체보기 →
            </button>
          </div>

          {isLoadingAppointments ? (
            <div className="card text-center py-8">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-charcoal-lighter rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-charcoal-lighter rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="card text-center py-8">
              <span className="text-5xl mb-3 block">📅</span>
              <p className="text-text-gray mb-4">아직 약속이 없어.</p>
              <button
                onClick={() => navigate('/missions')}
                className="btn-primary inline-block"
              >
                첫 미션 시작하기 →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 3).map((appointment) => (
                <motion.button
                  key={appointment.id}
                  onClick={() => handleAppointmentClick(appointment)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="card w-full text-left clickable"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-off-white font-bold truncate">
                          {appointment.missionTitle || '미션'}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>
                      <p className="text-text-gray text-sm">
                        {new Date(appointment.scheduledAt).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-text-gray flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* 메뉴 섹션 */}
        <div className="px-4 space-y-3 mb-6">
          <h3 className="text-off-white text-lg font-bold">지원</h3>
          {menuItems.map((item, index) => (
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

        {/* 제보 버튼 */}
        <div className="px-4 text-center mt-8 mb-4">
          <button
            onClick={() => setShowSuggestionModal(true)}
            className="text-sm text-brand-muted underline hover:text-electric-lime transition-colors"
          >
            사장님한테 훈수 두기 (코스 추천/버그 제보)
          </button>
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

      {/* 제보 모달 */}
      {showSuggestionModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 z-50"
            onClick={() => {
              setShowSuggestionModal(false);
              setSuggestionContent('');
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-charcoal-soft rounded-t-3xl shadow-2xl max-w-md mx-auto border-t border-charcoal-lighter"
          >
            <div className="p-6">
              <div className="w-12 h-1 bg-charcoal-lighter rounded-full mx-auto mb-6"></div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-off-white text-xl font-extra-bold">
                    훈수 두기
                  </h3>
                </div>
                <p className="text-text-gray text-sm mb-4">
                  추천하고 싶은 코스나 발견한 버그를 알려주세요.
                </p>

                <textarea
                  value={suggestionContent}
                  onChange={(e) => setSuggestionContent(e.target.value)}
                  placeholder="야, 성수동에 OO카페는 꼭 넣어야지. 분위기 깡패임."
                  className="w-full bg-charcoal-lighter text-off-white rounded-2xl p-4 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-electric-lime/50 transition-all placeholder:text-text-gray-dark"
                  maxLength={500}
                />
                <p className="text-text-gray-dark text-xs mt-2 text-right">
                  {suggestionContent.length} / 500
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSendSuggestion}
                  disabled={isSendingSuggestion || !suggestionContent.trim()}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingSuggestion ? '보내는 중...' : '보내기'}
                </button>
                <button
                  onClick={() => {
                    setShowSuggestionModal(false);
                    setSuggestionContent('');
                  }}
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
