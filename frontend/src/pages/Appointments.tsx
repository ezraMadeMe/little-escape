import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, PanInfo } from 'framer-motion';
import { getMyAppointments, toggleFavorite, bulkDeleteAppointments, cloneAppointment, cancelAppointment, devUnlockTomorrow, devUnlockNow } from '../api/appointmentApi';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { formatDateTime, calculateDday } from '../utils/dateUtils';
import FeaturedCard from '../components/FeaturedCard';

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
      // 인증 에러는 client.ts에서 자동으로 로그인 페이지로 리다이렉트됩니다
      // 다른 에러의 경우 사용자에게 알림
      if (error instanceof Error && !error.message.includes('Authentication') && !error.message.includes('Unauthorized')) {
        alert('약속 목록을 불러오는데 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 진행 중인 약속 중 가장 가까운 1개 (Hero Section용)
  const upcomingAppointment = appointments
    .filter((apt) => 
      apt.status === AppointmentStatus.CREATED ||
      apt.status === AppointmentStatus.UNLOCKED ||
      apt.status === AppointmentStatus.PENDING || 
      apt.status === AppointmentStatus.ACCEPTED
    )
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const filteredAppointments = appointments.filter((apt) => {
    // Hero Section에 표시된 약속은 리스트에서 제외
    if (upcomingAppointment && apt.id === upcomingAppointment.id) return false;

    // 즐겨찾기 필터
    if (showFavoritesOnly && !apt.isFavorite) return false;

    // 상태 필터
    if (filter === 'active') {
      return apt.status === AppointmentStatus.CREATED ||
             apt.status === AppointmentStatus.UNLOCKED ||
             apt.status === AppointmentStatus.PENDING || 
             apt.status === AppointmentStatus.ACCEPTED;
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

  // 개발용: 약속 날짜를 내일로 변경
  const handleDevUnlockTomorrow = async (appointmentId: number) => {
    console.log('============ [개발용] D-1로 변경 버튼 클릭 ============');
    console.log('약속 ID:', appointmentId);
    console.log('현재 시간:', new Date().toISOString());
    
    if (!confirm('⚠️ [개발용] 약속 날짜를 내일(D-1)로 변경하시겠습니까?')) {
      console.log('❌ 사용자가 취소함');
      return;
    }

    try {
      console.log('📡 API 호출 시작: devUnlockTomorrow');
      const result = await devUnlockTomorrow(appointmentId);
      console.log('✅ API 호출 성공:', result);
      console.log('  - 변경된 약속 시간:', result.scheduledAt);
      console.log('  - 변경된 상태:', result.status);
      
      alert('✅ 약속 날짜가 내일로 변경되었습니다!');
      
      console.log('🔄 약속 목록 새로고침 시작');
      await loadAppointments();
      console.log('✅ 약속 목록 새로고침 완료');
    } catch (error) {
      console.error('❌ 날짜 변경 실패:', error);
      alert('날짜 변경에 실패했습니다.');
    }
    console.log('============================================');
  };

  // 개발용: 약속 날짜를 현재 시간으로 변경
  const handleDevUnlockNow = async (appointmentId: number) => {
    console.log('============ [개발용] Now로 변경 버튼 클릭 ============');
    console.log('약속 ID:', appointmentId);
    console.log('현재 시간:', new Date().toISOString());
    
    if (!confirm('⚠️ [개발용] 약속 날짜를 현재 시간으로 변경하시겠습니까?')) {
      console.log('❌ 사용자가 취소함');
      return;
    }

    try {
      console.log('📡 API 호출 시작: devUnlockNow');
      const result = await devUnlockNow(appointmentId);
      console.log('✅ API 호출 성공:', result);
      console.log('  - 변경된 약속 시간:', result.scheduledAt);
      console.log('  - 변경된 상태:', result.status);
      
      alert('✅ 약속 날짜가 현재 시간으로 변경되었습니다!');
      
      console.log('🔄 약속 목록 새로고침 시작');
      await loadAppointments();
      console.log('✅ 약속 목록 새로고침 완료');
    } catch (error) {
      console.error('❌ 날짜 변경 실패:', error);
      alert('날짜 변경에 실패했습니다.');
    }
    console.log('============================================');
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CREATED:
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
          <span>🔒</span>
          <span>미션 D-1 공개</span>
        </span>;
      case AppointmentStatus.UNLOCKED:
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
          <span>🎉</span>
          <span>미션 선택 가능</span>
        </span>;
      case AppointmentStatus.PENDING:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">미션 선택 필요</span>;
      case AppointmentStatus.ACCEPTED:
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">진행 중</span>;
      case AppointmentStatus.COMPLETED:
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">완료</span>;
      case AppointmentStatus.CANCELLED:
        return <span className="px-2 py-1 bg-charcoal-lighter text-text-gray text-xs rounded-full">취소됨</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-charcoal flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-lime"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-charcoal text-off-white">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-deep-charcoal border-b border-charcoal-lighter px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-off-white">내 약속</h1>

            <div className="flex items-center gap-2">
              {/* 즐겨찾기 필터 */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  showFavoritesOnly
                    ? 'bg-electric-lime/20 text-electric-lime'
                    : 'bg-charcoal-lighter text-text-gray hover:bg-charcoal-soft'
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
                  isSelectionMode ? 'bg-accent-pink/20 text-accent-pink' : 'bg-charcoal-lighter text-text-gray hover:bg-charcoal-soft'
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
                  ? 'bg-electric-lime text-deep-charcoal'
                  : 'bg-charcoal-lighter text-text-gray hover:bg-charcoal-soft'
              }`}
            >
              전체 ({appointments.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                filter === 'active'
                  ? 'bg-electric-lime text-deep-charcoal'
                  : 'bg-charcoal-lighter text-text-gray hover:bg-charcoal-soft'
              }`}
            >
              진행 중
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                filter === 'completed'
                  ? 'bg-electric-lime text-deep-charcoal'
                  : 'bg-charcoal-lighter text-text-gray hover:bg-charcoal-soft'
              }`}
            >
              완료
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                filter === 'cancelled'
                  ? 'bg-electric-lime text-deep-charcoal'
                  : 'bg-charcoal-lighter text-text-gray hover:bg-charcoal-soft'
              }`}
            >
              취소
            </button>
          </div>
        </div>

        {/* 다중 선택 모드 안내 */}
        {isSelectionMode && (
          <div className="bg-accent-pink/10 border-b border-accent-pink/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-accent-pink">
                {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : '삭제할 약속을 선택하세요'}
              </span>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-1.5 bg-accent-pink text-deep-charcoal text-sm font-semibold rounded-lg hover:bg-accent-pink/90 transition"
                >
                  삭제하기
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hero Section: 진행 중인 가장 가까운 약속 */}
        {upcomingAppointment && !isSelectionMode && (
          <div className="px-4 pt-4">
            <FeaturedCard 
              appointment={upcomingAppointment}
              onDevUnlockTomorrow={handleDevUnlockTomorrow}
              onDevUnlockNow={handleDevUnlockNow}
            />
          </div>
        )}

        {/* 약속 리스트 */}
        <div>
          {appointments.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-text-gray">약속이 없어요</p>
              <p className="text-sm text-text-gray-dark mt-2">새로운 약속을 잡아보세요!</p>
            </div>
          ) : filteredAppointments.length === 0 && !upcomingAppointment ? (
            <div className="text-center py-20 px-4">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-text-gray">
                {showFavoritesOnly ? '즐겨찾기한 약속이 없어요' : '해당하는 약속이 없어요'}
              </p>
            </div>
          ) : (
            <>
              {filteredAppointments.length > 0 && (
                <div className="px-4 pt-2 pb-1">
                  <h2 className="text-sm font-semibold text-text-gray">지난 약속</h2>
                </div>
              )}
              {filteredAppointments.map((appointment) => (
                <SwipeableAppointmentItem
                  key={appointment.id}
                  appointment={appointment}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(appointment.id)}
                  onToggleSelection={() => handleToggleSelection(appointment.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onSwipeRight={() => handleSwipeRight(appointment.id)}
                onSwipeLeft={() => handleSwipeLeft(appointment.id)}
                onClick={() => !isSelectionMode && navigate(`/mission/${appointment.id}`)}
                getStatusBadge={getStatusBadge}
                onDevUnlockTomorrow={handleDevUnlockTomorrow}
                onDevUnlockNow={handleDevUnlockNow}
              />
              ))}
            </>
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
  onDevUnlockTomorrow?: (id: number) => void;
  onDevUnlockNow?: (id: number) => void;
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
  onDevUnlockTomorrow,
  onDevUnlockNow,
}: SwipeableAppointmentItemProps) => {
  const [dragX, setDragX] = useState(0);
  const isDev = import.meta.env.DEV; // 개발 환경 체크
  
  // 개발용 버튼 표시 조건 로그
  // 개발 환경에서는 COMPLETED를 제외한 모든 상태에서 버튼 표시 (테스트 용이성 향상)
  const showDevButtons = isDev && !isSelectionMode && appointment.status !== AppointmentStatus.COMPLETED;
  
  if (isDev && appointment.id) {
    console.log(`[개발용 버튼 체크] 약속 ID: ${appointment.id}`);
    console.log(`  - isDev: ${isDev}`);
    console.log(`  - isSelectionMode: ${isSelectionMode}`);
    console.log(`  - appointment.status: ${appointment.status}`);
    console.log(`  - showDevButtons: ${showDevButtons}`);
    
    if (!showDevButtons && appointment.status === AppointmentStatus.COMPLETED) {
      console.log(`  ⚠️ COMPLETED 상태는 개발용 버튼을 지원하지 않습니다.`);
    }
  }

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
        className="bg-charcoal-soft border-b border-charcoal-lighter cursor-pointer"
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
                <span className="text-charcoal-lighter text-xl">☆</span>
              )}
            </button>
          )}

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-bold text-off-white truncate">
                {appointment.missionTitle || '미션 미선택'}
              </h3>
              {getStatusBadge(appointment.status)}
            </div>

            <p className="text-sm text-text-gray mb-1">
              {formatDateTime(appointment.scheduledAt)}
            </p>

            {appointment.status === AppointmentStatus.ACCEPTED && (
              <span className="text-xs font-semibold text-electric-lime">
                {calculateDday(appointment.scheduledAt)}
              </span>
            )}

            {appointment.placeName && (
              <p className="text-xs text-text-gray-dark mt-1">
                📍 {appointment.placeName}
              </p>
            )}

            {/* 개발용 버튼 (개발 환경에서만 표시) */}
            {showDevButtons && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => {
                    console.log('🔓 D-1로 변경 버튼 클릭됨!');
                    e.stopPropagation();
                    onDevUnlockTomorrow?.(appointment.id);
                  }}
                  className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition"
                >
                  🔓 D-1로 변경
                </button>
                <button
                  onClick={(e) => {
                    console.log('⏰ Now로 변경 버튼 클릭됨!');
                    e.stopPropagation();
                    onDevUnlockNow?.(appointment.id);
                  }}
                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                >
                  ⏰ Now로 변경
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Appointments;
