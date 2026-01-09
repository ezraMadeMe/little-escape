import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAppointment } from '../api/appointmentApi';
import { getCurrentUser } from '../api/userApi';
import { User } from '../types/user';

function MissionList() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const isLoggedIn = !!localStorage.getItem('accessToken');

  const handleKakaoLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/kakao';
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.reload();
  };

  const handleGoToMyPage = () => {
    navigate('/mypage');
  };

  // 내일 오후 2시를 기본값으로 설정
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    // datetime-local input format: YYYY-MM-DDTHH:mm
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleCreateTimeCommitment = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      handleKakaoLogin();
      return;
    }

    if (!scheduledAt) {
      alert('시간을 선택해주세요.');
      return;
    }

    try {
      setIsCreating(true);

      // ISO 8601 형식으로 변환 (백엔드 LocalDateTime 형식)
      const dateTime = new Date(scheduledAt);
      const isoString = dateTime.toISOString();

      const appointment = await createAppointment({ scheduledAt: isoString });

      // 약속 생성 성공 시 미션 선택 페이지로 이동
      navigate(`/pick-mission/${appointment.id}`);
    } catch (err: any) {
      console.error('약속 생성 실패:', err);

      // "이미 진행 중인 약속이 있습니다" 에러 처리
      if (err.message && err.message.includes('이미 진행 중인 약속')) {
        alert('이미 진행 중인 약속이 있습니다. 기존 약속을 완료하거나 취소해주세요.');
        navigate('/mypage');
      } else {
        alert('약속을 생성하는데 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);

        if (isLoggedIn) {
          try {
            const userData = await getCurrentUser();
            setUser(userData);
          } catch (userErr) {
            console.error('사용자 정보를 불러오는데 실패했습니다:', userErr);
            localStorage.removeItem('accessToken');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // 기본 시간 설정
    setScheduledAt(getDefaultDateTime());
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      {/* 헤더 */}
      <header className="pt-6 px-6 pb-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Little Escape</h2>
          {isLoggedIn && user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoToMyPage}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                내 약속
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={handleKakaoLogin}
              className="text-sm bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <div className="max-w-md w-full space-y-8">
          {/* 감성적인 헤드라인 */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              이번 주, 나를 위해<br />
              잠시 시간을 비워둘까요?
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              작은 일탈을 위한 시간을 먼저 확보하세요.
            </p>
          </div>

          {/* 시간 선택 카드 */}
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
            <div className="space-y-3">
              <label htmlFor="datetime" className="block text-sm font-semibold text-gray-700">
                언제 시간을 내시겠어요?
              </label>
              <input
                id="datetime"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 outline-none"
              />
            </div>

            {/* 설명 텍스트 */}
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-sm text-indigo-900 leading-relaxed">
                💡 시간을 먼저 정하시면, 그 시간이 다가올 때 알림으로 어떤 일탈을 할지 선택할 수 있어요.
              </p>
            </div>
          </div>

          {/* 추가 안내 */}
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>약속 시간이 되면 알림을 보내드릴게요.</p>
            <p>그때 하고 싶은 미션을 골라보세요 ✨</p>
          </div>
        </div>
      </main>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleCreateTimeCommitment}
            disabled={isCreating || !scheduledAt}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            {isCreating ? '처리 중...' : '이 시간에 약속 잡기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MissionList;
