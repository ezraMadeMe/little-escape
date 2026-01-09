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
      <div className="max-w-6xl mx-auto">
        {/* 헤더 영역 */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              오늘의 작은 일탈을 선택하세요
            </h1>
            <p className="text-gray-600">당신의 일상에 특별함을 더해보세요</p>
          </div>

          {isLoggedIn && user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                {user.nickname}님
              </span>
              <button
                onClick={handleGoToMyPage}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                내 약속
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={handleKakaoLogin}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.546 1.725 4.77 4.312 6.052l-.878 3.241c-.063.233.182.425.39.306l3.816-2.186C10.416 18.063 11.19 18 12 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
              </svg>
              카카오 로그인
            </button>
          )}
        </div>

        {/* 미션 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {missions.map((mission) => (
            <div
              key={mission.id}
              onClick={() => handleSelectMission(mission.id)}
              className="relative h-48 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group"
              style={{
                backgroundImage: mission.imageUrl
                  ? `url(${mission.imageUrl})`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* 어두운 오버레이 */}
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-all duration-300" />

              {/* 호버 시 스케일 효과 */}
              <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                {/* 컨텐츠 */}
                <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-white">
                  {/* 카테고리 & 난이도 뱃지 */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                      {mission.category}
                    </span>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                      {mission.difficultyLevel}
                    </span>
                  </div>

                  {/* 미션 제목 (중앙) */}
                  <h2 className="text-2xl font-bold text-center drop-shadow-lg mb-3 px-4">
                    {mission.title}
                  </h2>

                  {/* 설명 */}
                  <p className="text-sm text-center text-gray-200 drop-shadow-md line-clamp-2 px-6 mb-4">
                    {mission.description}
                  </p>

                  {/* 선택 버튼 (호버 시 표시) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      disabled={creatingAppointment === mission.id}
                      className="bg-white/90 hover:bg-white text-gray-900 font-bold py-2 px-6 rounded-lg shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMission(mission.id);
                      }}
                    >
                      {creatingAppointment === mission.id ? '처리 중...' : '이 일탈 선택하기 ✨'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {missions.length === 0 && (
          <div className="text-center text-gray-500 mt-12 py-20">
            <p className="text-xl">등록된 미션이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MissionList;
