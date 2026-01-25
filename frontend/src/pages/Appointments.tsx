import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getMyAppointments,
  getSavedAppointments,
  toggleSaveAppointment,
  deleteAppointment,
  devUnlockTomorrow,
  devUnlockNow
} from '../api/appointmentApi';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { FeedItem } from '../api/appointmentApi';
import { formatDateTime } from '../utils/dateUtils';
import FeaturedCard from '../components/FeaturedCard';
import { MapPin, Trash2 } from 'lucide-react';
import { showToast } from '../utils/toast';

const Appointments = () => {
  const navigate = useNavigate();
  
  // Tabs: 'my' (내 약속) | 'saved' (저장된 약속)
  const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');

  // State for My Appointments
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [isMyLoading, setIsMyLoading] = useState(true);

  // State for Saved Appointments
  const [savedAppointments, setSavedAppointments] = useState<FeedItem[]>([]);
  const [isSavedLoading, setIsSavedLoading] = useState(true);

  useEffect(() => {
    loadMyAppointments();
    loadSavedAppointments();
  }, []);

  const loadMyAppointments = async () => {
    try {
      setIsMyLoading(true);
      const data = await getMyAppointments();
      setMyAppointments(data);
    } catch (error) {
      console.error('내 약속 로딩 실패:', error);
    } finally {
      setIsMyLoading(false);
    }
  };

  const loadSavedAppointments = async () => {
    try {
      setIsSavedLoading(true);
      const data = await getSavedAppointments();
      setSavedAppointments(data);
    } catch (error) {
      console.error('저장된 약속 로딩 실패:', error);
    } finally {
      setIsSavedLoading(false);
    }
  };

  // --- Actions for My Appointments ---

  const handleDeleteAppointment = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('정말 삭제하시겠습니까?\n이 작업은 복구할 수 없습니다.')) return;
    try {
      await deleteAppointment(id);
      showToast('약속이 완전히 삭제되었습니다.');
      loadMyAppointments();
    } catch (error) {
      showToast('삭제에 실패했습니다.');
    }
  };


  // --- Actions for Saved Appointments ---

  const handleUnsave = async (e: React.MouseEvent, appointmentId: number) => {
    e.stopPropagation();
    if (!confirm('저장 목록에서 삭제하시겠습니까?')) return;
    try {
      await toggleSaveAppointment(appointmentId);
      setSavedAppointments(prev => prev.filter(item => item.appointmentId !== appointmentId));
      showToast('삭제되었습니다.');
    } catch (error) {
      showToast('삭제 실패');
    }
  };

  // --- Filtering Logic for My Appointments ---

  // Hero Section (가장 가까운 진행 중 약속)
  const upcomingAppointment = myAppointments
    .filter((apt) =>
      apt.status === AppointmentStatus.CREATED ||
      apt.status === AppointmentStatus.UNLOCKED ||
      apt.status === AppointmentStatus.PENDING ||
      apt.status === AppointmentStatus.ACCEPTED
    )
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  // 마지막 완료된 약속 (진행 중인 약속이 없을 때 표시)
  const lastCompletedAppointment = myAppointments
    .filter((apt) => apt.status === AppointmentStatus.COMPLETED)
    .sort((a, b) => new Date(b.completedAt || b.scheduledAt).getTime() - new Date(a.completedAt || a.scheduledAt).getTime())[0];

  // List Items (Hero 제외, 필터 적용)
  const filteredMyAppointments = myAppointments.filter((apt) => {
    if (upcomingAppointment && apt.id === upcomingAppointment.id) return false;

    if (filter === 'completed') return apt.status === AppointmentStatus.COMPLETED;
    if (filter === 'cancelled') return apt.status === AppointmentStatus.CANCELLED;
    return true;
  });

  // --- Swipe Logic ---
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeTab === 'my') {
      setActiveTab('saved');
    }
    if (isRightSwipe && activeTab === 'saved') {
      setActiveTab('my');
    }
  };

  return (
    <div className="min-h-screen bg-deep-charcoal pb-24">
      {/* 1. 상단 헤더 (고정 탭뷰) */}
      <header className="sticky top-0 z-20 bg-deep-charcoal border-b border-charcoal-lighter">
        <div className="flex">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors relative ${
              activeTab === 'my' ? 'text-electric-lime' : 'text-text-gray hover:text-off-white'
            }`}
          >
            내 약속
            {activeTab === 'my' && (
              <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric-lime" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors relative ${
              activeTab === 'saved' ? 'text-electric-lime' : 'text-text-gray hover:text-off-white'
            }`}
          >
            저장된 약속
            {activeTab === 'saved' && (
              <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric-lime" />
            )}
          </button>
        </div>
      </header>

      {/* 2. 탭 컨텐츠 (Swipeable) */}
      <div 
        className="container-solotion py-4 min-h-[80vh]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'my' ? (
            <motion.div
              key="my"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* 2-1. Hero Section (진행 중인 약속 또는 빈 상태) */}
              {upcomingAppointment ? (
                <div className="mb-6">
                  <FeaturedCard
                    appointment={upcomingAppointment}
                    onDevUnlockTomorrow={devUnlockTomorrow}
                    onDevUnlockNow={devUnlockNow}
                  />
                </div>
              ) : (
                <div className="mb-6">
                  {/* 빈 상태 카드 */}
                  <div
                    className="relative w-full rounded-solotion overflow-hidden shadow-solotion cursor-pointer border-2 border-electric-lime/30"
                    onClick={() => navigate('/location')}
                  >
                    {/* Background Image */}
                    <img
                      src={lastCompletedAppointment?.missionImageUrl || lastCompletedAppointment?.placeImageUrl || 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80'}
                      alt="새로운 약속 만들기"
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal via-deep-charcoal/80 to-deep-charcoal/60 opacity-95"></div>

                    <div className="relative p-6 text-off-white flex flex-col justify-between h-full min-h-[200px]">
                      <div>
                        <h2 className="text-2xl font-extra-bold mb-2 leading-tight">
                          새로운 일탈을 시작해볼까?
                        </h2>
                        <p className="text-sm text-text-gray font-medium">
                          {lastCompletedAppointment
                            ? `마지막 약속으로부터 ${Math.floor((Date.now() - new Date(lastCompletedAppointment.completedAt || lastCompletedAppointment.scheduledAt).getTime()) / (1000 * 60 * 60 * 24))}일째`
                            : '첫 번째 약속을 만들어보세요!'}
                        </p>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-text-gray-dark mb-1">다음 도전까지</span>
                          <span className="text-4xl font-black tracking-tighter text-electric-lime">
                            지금
                          </span>
                        </div>
                        <button className="bg-electric-lime text-deep-charcoal px-6 py-2 rounded-full font-extra-bold text-sm hover:bg-electric-lime/90 transition-colors">
                          약속 잡기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2-2. 필터 탭 (Hero 하단 배치) */}
              <div className="flex border-b border-charcoal-lighter mb-4">
                {(['all', 'completed', 'cancelled'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 pb-3 text-center text-sm font-bold transition-colors relative ${
                      filter === f
                        ? 'text-electric-lime'
                        : 'text-text-gray hover:text-off-white'
                    }`}
                  >
                    {f === 'all' && '전체'}
                    {f === 'completed' && '완료'}
                    {f === 'cancelled' && '취소'}
                    {filter === f && (
                      <motion.div
                        layoutId="filter-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric-lime"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* 2-3. 내 약속 리스트 (2열 그리드) */}
              {filteredMyAppointments.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-text-gray text-sm">해당하는 약속이 없어요</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredMyAppointments.map((apt) => {
                    // 이미지 결정: 완료 인증샷 > 장소 이미지 > 미션 이미지 > 기본값
                    const displayImage = apt.proofImageUrls?.[0] || apt.placeImageUrl || apt.missionImageUrl || 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&q=80';
                    
                    return (
                      <div
                        key={apt.id}
                        className="card p-0 overflow-hidden relative group cursor-pointer"
                        onClick={() => {
                          const isArchived = apt.status === AppointmentStatus.COMPLETED ||
                                           apt.status === AppointmentStatus.CANCELLED;
                          navigate(isArchived ? `/archived/${apt.id}` : `/mission/${apt.id}`);
                        }}
                      >
                        {/* 썸네일 */}
                        <div className="relative h-40 bg-charcoal-lighter">
                          <img
                            src={displayImage}
                            alt={apt.missionTitle}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                          
                          {/* 3. 간단한 액션 버튼 (휴지통) */}
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              onClick={(e) => handleDeleteAppointment(e, apt.id)}
                              className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-text-gray hover:text-accent-pink hover:bg-black/60 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {/* 상태 배지 및 별점 */}
                          <div className="absolute bottom-2 left-2 flex items-center gap-2">
                            {apt.status === AppointmentStatus.COMPLETED && (
                              <>
                                <span className="bg-green-500/90 text-white text-[10px] px-2 py-1 rounded-full font-bold">완료</span>
                                {apt.rating && apt.rating > 0 && (
                                  <div className="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                                    {[...Array(5)].map((_, i) => (
                                      <span
                                        key={i}
                                        className={`text-xs ${i < Math.floor(apt.rating!) ? 'text-electric-lime' : 'text-gray-500'}`}
                                      >
                                        ⭐
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                            {apt.status === AppointmentStatus.CANCELLED && (
                              <span className="bg-gray-500/90 text-white text-[10px] px-2 py-1 rounded-full font-bold">취소됨</span>
                            )}
                          </div>
                        </div>

                        {/* 정보 */}
                        <div className="p-3">
                          <h3 className="text-off-white font-bold text-sm mb-1 line-clamp-1">
                            {apt.missionTitle || '미션 미선택'}
                          </h3>
                          <div className="flex items-center gap-1 text-text-gray text-xs mb-1">
                            <MapPin size={12} />
                            <span className="line-clamp-1">{apt.placeName || '장소 미정'}</span>
                          </div>
                          <p className="text-text-gray-dark text-[10px]">
                            {formatDateTime(apt.scheduledAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* 저장된 약속 리스트 (2열 그리드) */}
              {savedAppointments.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-3">📂</div>
                  <p className="text-text-gray text-sm">저장된 약속이 없어요</p>
                  <button onClick={() => navigate('/feed')} className="mt-4 text-electric-lime text-xs underline">
                    피드 둘러보기
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {savedAppointments.map((item) => (
                    <div
                      key={item.appointmentId}
                      className="card p-0 overflow-hidden relative group cursor-pointer"
                      onClick={() => navigate(`/saved/detail/${item.appointmentId}`)}
                    >
                      {/* 썸네일 */}
                      <div className="relative h-40 bg-charcoal-lighter">
                        <img
                          src={item.proofImageUrls?.[0] ? `${import.meta.env.VITE_API_BASE_URL}${item.proofImageUrls[0]}` : 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&q=80'}
                          alt={item.missionTitle}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

                        {/* 삭제 버튼 */}
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => handleUnsave(e, item.appointmentId)}
                            className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-text-gray hover:text-accent-pink hover:bg-black/60 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* 정보 */}
                      <div className="p-3">
                        <h3 className="text-off-white font-bold text-sm mb-1 line-clamp-1">
                          {item.missionTitle}
                        </h3>
                        <div className="flex items-center gap-1 text-text-gray text-xs mb-1">
                          <MapPin size={12} />
                          <span className="line-clamp-1">{item.placeName}</span>
                        </div>
                        <p className="text-text-gray-dark text-[10px]">
                          by {item.userNickname}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Appointments;