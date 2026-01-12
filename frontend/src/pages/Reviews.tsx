import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointments } from '../api/appointmentApi';
import { Appointment, AppointmentStatus } from '../types/appointment';
import MissionCard from '../components/MissionCard';

const Reviews = () => {
  const navigate = useNavigate();
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompletedAppointments();
  }, []);

  const loadCompletedAppointments = async () => {
    try {
      const appointments = await getMyAppointments();
      const completed = appointments.filter(apt => apt.status === AppointmentStatus.COMPLETED);
      setCompletedAppointments(completed);
    } catch (error) {
      console.error('완료된 약속 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">추억 기록 📸</h1>
          <p className="text-sm text-gray-600 mt-1">
            {completedAppointments.length}개의 추억이 있어요
          </p>
        </div>

        {completedAppointments.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="text-6xl mb-4">🌱</div>
            <p className="text-gray-600 mb-2">아직 완료한 미션이 없어요</p>
            <p className="text-sm text-gray-400 mb-6">
              첫 번째 작은 일탈을 시작해보세요!
            </p>
            <button
              onClick={() => navigate('/chat/new')}
              className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
            >
              약속 잡으러 가기
            </button>
          </div>
        ) : (
          <div>
            {completedAppointments.map((appointment) => {
              // 방문 횟수 계산
              const count = completedAppointments.filter(
                apt => apt.missionId === appointment.missionId && apt.status === AppointmentStatus.COMPLETED
              ).length;

              return (
                <MissionCard
                  key={appointment.id}
                  appointment={appointment}
                  count={count}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
