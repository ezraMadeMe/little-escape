import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, PanInfo } from 'framer-motion';
import { getMyAppointments, toggleFavorite, bulkDeleteAppointments, cloneAppointment, cancelAppointment } from '../api/appointmentApi';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { formatDateTime, calculateDday } from '../utils/dateUtils';

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 다중 선택 모드
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await getMyAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('약속 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    // 즐겨찾기 필터
    if (showFavoritesOnly && !apt.isFavorite) return false;

    // 상태 필터
    if (filter === 'active') {
      return apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.ACCEPTED;
    }
    if (filter === 'completed') {
      return apt.status === AppointmentStatus.COMPLETED;
    }
    if (filter === 'cancelled') {
      return apt.status === AppointmentStatus.CANCELLED;
    }
    return true;
  });

  const handleToggleFavorite = async (e: React.MouseEvent, appointmentId: number) => {
    e.stopPropagation();
    try {
      await toggleFavorite(appointmentId);
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId ? { ...apt, isFavorite: !apt.isFavorite } : apt
        )
      );
    } catch (error) {
      console.error('즐겨찾기 실패:', error);
      alert('즐겨찾기 처리에 실패했습니다.');
    }
  };

  const handleToggleSelection = (appointmentId: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}개의 약속을 삭제하시겠습니까?`)) return;

    try {
      await bulkDeleteAppointments(Array.from(selectedIds));
      alert('삭제되었습니다.');
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      loadAppointments();
    } catch (error) {
      console.error('다중 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleSwipeRight = async (appointmentId: number) => {
    // 복제 (다시 잡기)
    try {
      const newAppointmentId = await cloneAppointment(appointmentId);
      navigate(`/chat/${newAppointmentId}`);
    } catch (error) {
      console.error('약속 복제 실패:', error);
      alert('약속 복제에 실패했습니다.');
    }
  };

  const handleSwipeLeft = async (appointmentId: number) => {
    // 삭제
    if (!confirm('이 약속을 삭제하시겠습니까?')) return;

    try {
      await cancelAppointment(appointmentId);
      loadAppointments();
    } catch (error) {
      console.error('약속 삭제 실패:', error);
      alert('약속 삭제에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">미션 선택 필요</span>;
      case AppointmentStatus.ACCEPTED:
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">진행 중</span>;
      case AppointmentStatus.COMPLETED:
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">완료</span>;
      case AppointmentStatus.CANCELLED:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">취소됨</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-[#FDFBF7] border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">내 약속</h1>

            <div className="flex items-center gap-2">
              {/* 즐겨찾기 필터 */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  showFavoritesOnly
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ⭐ {showFavoritesOnly ? '전체보기' : '즐겨찾기'}
              </button>

              {/* 휴지통 (다중 선택 모드) */}
              <button
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedIds(new Set());
                }}
                className={`p-2 rounded-full transition ${
                  isSelectionMode ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* 필터 탭 */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체 ({appointments.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                filter === 'active'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              진행 중
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                filter === 'completed'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              완료
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                filter === 'cancelled'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              취소
            </button>
          </div>
        </div>

        {/* 다중 선택 모드 안내 */}
        {isSelectionMode && (
          <div className="bg-purple-50 border-b border-purple-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-700">
                {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : '삭제할 약속을 선택하세요'}
              </span>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition"
                >
                  삭제하기
                </button>
              )}
            </div>
          </div>
        )}

        {/* 약속 리스트 */}
        <div>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-600">
                {showFavoritesOnly ? '즐겨찾기한 약속이 없어요' : '약속이 없어요'}
              </p>
              <p className="text-sm text-gray-400 mt-2">새로운 약속을 잡아보세요!</p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <SwipeableAppointmentItem
                key={appointment.id}
                appointment={appointment}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(appointment.id)}
                onToggleSelection={() => handleToggleSelection(appointment.id)}
                onToggleFavorite={handleToggleFavorite}
                onSwipeRight={() => handleSwipeRight(appointment.id)}
                onSwipeLeft={() => handleSwipeLeft(appointment.id)}
                onClick={() => !isSelectionMode && navigate(`/chat/${appointment.id}`)}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// 스와이프 가능한 약속 아이템 컴포넌트
interface SwipeableAppointmentItemProps {
  appointment: Appointment;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: () => void;
  onToggleFavorite: (e: React.MouseEvent, id: number) => void;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onClick: () => void;
  getStatusBadge: (status: AppointmentStatus) => JSX.Element | null;
}

const SwipeableAppointmentItem = ({
  appointment,
  isSelectionMode,
  isSelected,
  onToggleSelection,
  onToggleFavorite,
  onSwipeRight,
  onSwipeLeft,
  onClick,
  getStatusBadge,
}: SwipeableAppointmentItemProps) => {
  const [dragX, setDragX] = useState(0);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      // 오른쪽 스와이프 - 복제
      onSwipeRight();
    } else if (info.offset.x < -threshold) {
      // 왼쪽 스와이프 - 삭제
      onSwipeLeft();
    }

    setDragX(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* 배경 액션 (스와이프 시 보임) */}
      {dragX > 20 && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-start px-6">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="ml-2 text-white font-semibold">다시 잡기</span>
        </div>
      )}
      {dragX < -20 && (
        <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6">
          <span className="mr-2 text-white font-semibold">삭제</span>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      )}

      {/* 메인 아이템 */}
      <motion.div
        drag={isSelectionMode ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={(event, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        className="bg-[#FDFBF7] border-b border-gray-100 cursor-pointer"
      >
        <div
          onClick={isSelectionMode ? onToggleSelection : onClick}
          className="px-4 py-4 flex items-start gap-3"
        >
          {/* 선택 모드: 체크박스 */}
          {isSelectionMode && (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelection}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </div>
          )}

          {/* 즐겨찾기 별 */}
          {!isSelectionMode && (
            <button
              onClick={(e) => onToggleFavorite(e, appointment.id)}
              className="flex items-center justify-center w-6 h-6 mt-1"
            >
              {appointment.isFavorite ? (
                <span className="text-yellow-500 text-xl">★</span>
              ) : (
                <span className="text-gray-300 text-xl">☆</span>
              )}
            </button>
          )}

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-bold text-gray-900 truncate">
                {appointment.missionTitle || '미션 미선택'}
              </h3>
              {getStatusBadge(appointment.status)}
            </div>

            <p className="text-sm text-gray-600 mb-1">
              {formatDateTime(appointment.scheduledAt)}
            </p>

            {appointment.status === AppointmentStatus.ACCEPTED && (
              <span className="text-xs font-semibold text-purple-600">
                {calculateDday(appointment.scheduledAt)}
              </span>
            )}

            {appointment.placeName && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {appointment.placeName}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Appointments;
