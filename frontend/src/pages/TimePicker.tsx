import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createAppointment } from '../api/appointmentApi';
import { ChevronLeft } from 'lucide-react';
import { showToast } from '../utils/toast';

const TimePicker = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 오늘부터 7일간의 날짜 생성
  const getNextSevenDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // 시간 옵션 생성 (9시 ~ 22시)
  const timeOptions = [];
  for (let hour = 9; hour <= 22; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 22) {
      timeOptions.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  const formatDate = (date: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];

    return {
      short: `${month}/${day}`,
      full: `${month}월 ${day}일 (${dayOfWeek})`,
      dayOfWeek,
    };
  };

  // 약속 상태 초기화 함수
  const resetAppointmentState = () => {
    console.log('🔄 약속 상태 초기화');
    setSelectedDate(null);
    setSelectedTime(null);
    localStorage.removeItem('appointmentId');
    localStorage.removeItem('selected_mission');
    console.log('✅ 약속 관련 데이터 싹 제거 완료');
  };

  // 뒤로 가기 핸들러
  const handleGoBack = () => {
    if (selectedDate || selectedTime) {
      if (confirm('선택한 시간 정보가 초기화됩니다. 뒤로 가시겠어요?')) {
        resetAppointmentState();
        navigate('/location');
      }
    } else {
      navigate('/location');
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      showToast('약속 시간을 정해야 추천해줄 수 있어!');
      return;
    }

    try {
      setIsLoading(true);

      // 선택한 날짜와 시간을 합쳐서 ISO 문자열 생성
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // 위치 정보 가져오기
      const locationData = localStorage.getItem('user_location');
      let userLatitude = null;
      let userLongitude = null;

      if (locationData) {
        const location = JSON.parse(locationData);
        userLatitude = location.lat;
        userLongitude = location.lng;
      }

      console.log('약속 생성 시작:', {
        scheduledAt: scheduledDateTime.toISOString(),
        userLatitude,
        userLongitude,
      });

      // 약속 생성 (미션은 아직 선택 안 함)
      const appointment = await createAppointment({
        scheduledAt: scheduledDateTime.toISOString(),
        userLatitude,
        userLongitude,
      });

      console.log('약속 생성 완료:', appointment);

      // appointmentId를 localStorage에 저장
      localStorage.setItem('appointmentId', appointment.id.toString());

      // 미션 선택 페이지로 이동
      navigate('/missions');
    } catch (error) {
      console.error('약속 생성 실패:', error);
      alert('약속 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-charcoal flex flex-col">
      {/* Header */}
      <header className="container-solotion py-6">
        <button
          onClick={handleGoBack}
          className="mb-4 text-text-gray hover:text-off-white transition flex items-center gap-2"
        >
          <ChevronLeft size={20} />
          <span>뒤로</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-2"
        >
          <h1 className="text-off-white text-3xl font-extra-bold">
            언제 출발할래?
          </h1>
          <p className="text-text-gray text-base">
            약속 시간을 정해주면 그때 미션을 줄게.
          </p>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container-solotion py-6 space-y-8">
        {/* 날짜 선택 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-off-white text-xl font-bold flex items-center gap-2">
            <span>📅</span>
            <span>날짜</span>
          </h2>

          <div className="grid grid-cols-7 gap-2">
            {getNextSevenDays().map((date, index) => {
              const formatted = formatDate(date);
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const isToday = index === 0;

              return (
                <motion.button
                  key={date.toISOString()}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-electric-lime text-deep-charcoal shadow-lg shadow-electric-lime/20'
                      : 'bg-charcoal-soft text-off-white hover:bg-charcoal-lighter'
                  }`}
                >
                  <div className="text-xs mb-1 opacity-70">
                    {formatted.dayOfWeek}
                  </div>
                  <div className="text-sm font-bold">
                    {formatted.short}
                  </div>
                  {isToday && (
                    <div className="text-xs mt-1 text-electric-lime">
                      오늘
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 시간 선택 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-off-white text-xl font-bold flex items-center gap-2">
            <span>⏰</span>
            <span>시간</span>
          </h2>

          <div className="grid grid-cols-4 gap-3">
            {timeOptions.map((time) => {
              const isSelected = selectedTime === time;

              return (
                <motion.button
                  key={time}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTime(time)}
                  className={`py-3 px-4 rounded-xl font-bold transition-all ${
                    isSelected
                      ? 'bg-electric-lime text-deep-charcoal shadow-lg shadow-electric-lime/20'
                      : 'bg-charcoal-soft text-off-white hover:bg-charcoal-lighter'
                  }`}
                >
                  {time}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 선택 요약 */}
        {selectedDate && selectedTime && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="card bg-charcoal-soft/50 p-4"
          >
            <p className="text-text-gray text-sm mb-2">선택한 시간</p>
            <p className="text-off-white text-lg font-bold">
              {formatDate(selectedDate).full} {selectedTime}
            </p>
          </motion.div>
        )}
      </main>

      {/* Bottom CTA */}
      <footer className="sticky bottom-0 left-0 right-0 bg-charcoal-soft/95 backdrop-blur-lg border-t border-charcoal-lighter p-6 pb-8">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedTime || isLoading}
          className={`w-full text-xl py-4 font-bold rounded-solotion transition-all ${
            !selectedDate || !selectedTime || isLoading
              ? 'bg-charcoal-lighter text-text-gray cursor-not-allowed'
              : 'btn-primary hover:scale-105 active:scale-95'
          }`}
        >
          {isLoading
            ? '약속 생성 중...'
            : selectedDate && selectedTime
            ? `좋아, 나갈게 🚀`
            : '날짜와 시간을 선택해주세요'}
        </motion.button>
      </footer>
    </div>
  );
};

export default TimePicker;
