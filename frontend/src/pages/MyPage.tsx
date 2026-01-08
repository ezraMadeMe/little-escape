import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointments, cancelAppointment } from '../api/appointmentApi';
import { Appointment } from '../types/appointment';

function MyPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getMyAppointments();
      setAppointments(data);
      setError(null);
    } catch (err) {
      setError('약속 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    const confirmed = window.confirm('정말로 이 약속을 취소하시겠습니까?');
    if (!confirmed) return;

    try {
      setCancelling(id);
      await cancelAppointment(id);
      alert('약속이 취소되었습니다.');
      await loadAppointments();
    } catch (err) {
      console.error('약속 취소 실패:', err);
      alert('약속을 취소하는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: '대기 중',
      ACCEPTED: '수락됨',
      REJECTED: '거절됨',
      CANCELLED: '취소됨',
      COMPLETED: '완료됨',
      NO_SHOW: '불참',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      NO_SHOW: 'bg-orange-100 text-orange-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    loadAppointments();
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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            내 약속 히스토리
          </h1>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            미션 목록으로
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-xl text-gray-500">아직 예정된 일탈이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              미션 목록에서 일탈을 선택해보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {appointment.missionTitle}
                      </h2>
                      <span
                        className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">약속 날짜:</span>{' '}
                        {new Date(appointment.scheduledAt).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p>
                        <span className="font-medium">신청 날짜:</span>{' '}
                        {new Date(appointment.createdAt).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCancel(appointment.id)}
                      disabled={cancelling === appointment.id}
                      className="ml-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {cancelling === appointment.id ? '취소 중...' : '취소하기'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage;
