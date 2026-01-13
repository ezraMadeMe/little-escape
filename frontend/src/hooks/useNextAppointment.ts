import { useState, useEffect } from 'react';
import { Appointment } from '../types/appointment';
import { getNextAppointment } from '../api/appointmentApi';
import { differenceInHours, differenceInMinutes } from 'date-fns';

interface UseNextAppointmentReturn {
  appointment: Appointment | null;
  timeRemaining: string | null;
  isUrgent: boolean;
  loading: boolean;
  refresh: () => void;
}

export function useNextAppointment(): UseNextAppointmentReturn {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAppointment = async () => {
    console.log('🔍 [useNextAppointment] fetchAppointment 시작');
    setLoading(true);
    try {
      const next = await getNextAppointment();
      console.log('🔍 [useNextAppointment] getNextAppointment 결과:', next);
      setAppointment(next);
      console.log('🔍 [useNextAppointment] appointment state 업데이트 완료');
    } catch (error) {
      console.error('❌ [useNextAppointment] 가장 가까운 약속 조회 실패:', error);
    } finally {
      setLoading(false);
      console.log('🔍 [useNextAppointment] loading 완료');
    }
  };

  const updateTimeRemaining = () => {
    console.log('⏱️ [useNextAppointment] updateTimeRemaining 시작');
    console.log('⏱️ [useNextAppointment] appointment:', appointment);
    
    if (!appointment) {
      console.log('⏱️ [useNextAppointment] 약속 없음 - timeRemaining: null');
      setTimeRemaining(null);
      setIsUrgent(false);
      return;
    }

    const now = new Date();
    const scheduledTime = new Date(appointment.scheduledAt);
    
    console.log('⏱️ [useNextAppointment] 현재 시간:', now.toISOString());
    console.log('⏱️ [useNextAppointment] 약속 시간:', scheduledTime.toISOString());

    const totalMinutes = differenceInMinutes(scheduledTime, now);
    console.log('⏱️ [useNextAppointment] 남은 시간(분):', totalMinutes);

    if (totalMinutes < 0) {
      // 이미 지난 시간
      console.log('⏱️ [useNextAppointment] 시간 지남 - timeRemaining: Now');
      setTimeRemaining('Now');
      setIsUrgent(true);
      return;
    }

    const hours = differenceInHours(scheduledTime, now);
    const minutes = totalMinutes % 60;
    
    console.log('⏱️ [useNextAppointment] 남은 시간(시간):', hours);
    console.log('⏱️ [useNextAppointment] 남은 시간(분 나머지):', minutes);

    if (hours >= 24) {
      // 24시간 이상 남음: 일 단위로 표시
      const days = Math.floor(hours / 24);
      console.log(`⏱️ [useNextAppointment] 일 단위 - timeRemaining: ${days}d`);
      setTimeRemaining(`${days}d`);
      setIsUrgent(false);
    } else if (hours > 0) {
      // 1시간~24시간 남음: 시간 단위로 표시
      console.log(`⏱️ [useNextAppointment] 시간 단위 - timeRemaining: ${hours}h, isUrgent: ${hours < 2}`);
      setTimeRemaining(`${hours}h`);
      setIsUrgent(hours < 2); // 2시간 미만이면 긴급
    } else {
      // 1시간 미만: 분 단위로 표시
      console.log(`⏱️ [useNextAppointment] 분 단위 - timeRemaining: ${minutes}m, isUrgent: true`);
      setTimeRemaining(`${minutes}m`);
      setIsUrgent(true);
    }
  };

  useEffect(() => {
    console.log('🚀 [useNextAppointment] 컴포넌트 마운트 - fetchAppointment 호출');
    fetchAppointment();
  }, []);

  // 1분마다 시간 업데이트
  useEffect(() => {
    console.log('🔄 [useNextAppointment] appointment 변경됨 - updateTimeRemaining 시작');
    updateTimeRemaining();
    const interval = setInterval(() => {
      console.log('⏰ [useNextAppointment] 1분 경과 - updateTimeRemaining 호출');
      updateTimeRemaining();
    }, 60000); // 60초

    return () => {
      console.log('🛑 [useNextAppointment] interval 정리');
      clearInterval(interval);
    };
  }, [appointment]);

  return {
    appointment,
    timeRemaining,
    isUrgent,
    loading,
    refresh: fetchAppointment,
  };
}
