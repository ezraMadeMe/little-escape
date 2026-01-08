import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMissions } from '../api/missionApi';
import { getCurrentUser } from '../api/userApi';
import { createAppointment } from '../api/appointmentApi';
import { Mission } from '../types/mission';
import { User } from '../types/user';

function MissionList() {
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingAppointment, setCreatingAppointment] = useState<number | null>(null);

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

  const handleSelectMission = async (missionId: number) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setCreatingAppointment(missionId);
      await createAppointment(missionId);
      alert('약속이 잡혔습니다! 이번 주말을 기대하세요.');
    } catch (err) {
      console.error('약속 생성 실패:', err);
      alert('약속을 생성하는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setCreatingAppointment(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const missionsData = await fetchMissions();
        setMissions(missionsData);

        if (isLoggedIn) {
          try {
            const userData = await getCurrentUser();
            setUser(userData);
          } catch (userErr) {
            console.error('사용자 정보를 불러오는데 실패했습니다:', userErr);
            localStorage.removeItem('accessToken');
          }
        }

        setError(null);
      } catch (err) {
        setError('미션을 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            작은 일탈 미션
          </h1>

          {isLoggedIn && user ? (
            <div className="flex items-center gap-4">
              <span className="text-lg font-medium text-gray-700">
                {user.nickname}님, 안녕하세요!
              </span>
              <button
                onClick={handleGoToMyPage}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                마이페이지
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <span className="text-sm text-gray-600">로그인해주세요</span>
              <button
                onClick={handleKakaoLogin}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.546 1.725 4.77 4.312 6.052l-.878 3.241c-.063.233.182.425.39.306l3.816-2.186C10.416 18.063 11.19 18 12 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
                </svg>
                카카오 로그인
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  {mission.category}
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {mission.difficultyLevel}
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {mission.title}
              </h2>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {mission.description}
              </p>

              {mission.condition && (
                <div className="mt-4 pt-4 border-t border-gray-200 mb-4">
                  <p className="text-xs text-gray-500">
                    조건: {mission.condition}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleSelectMission(mission.id)}
                disabled={creatingAppointment === mission.id}
                className="mt-auto w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                {creatingAppointment === mission.id ? '처리 중...' : '이 일탈 선택하기'}
              </button>
            </div>
          ))}
        </div>

        {missions.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            등록된 미션이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

export default MissionList;
