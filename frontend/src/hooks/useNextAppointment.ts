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
    setLoading(true);
    try {
      const next = await getNextAppointment();
      setAppointment(next);
    } catch (error) {
      console.error('가장 가까운 약속 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTimeRemaining = () => {
    if (!appointment) {
      setTimeRemaining(null);
      setIsUrgent(false);
      return;
    }

    const now = new Date();
    const scheduledTime = new Date(appointment.scheduledAt);

    const totalMinutes = differenceInMinutes(scheduledTime, now);

    if (totalMinutes < 0) {
      // 이미 지난 시간
      setTimeRemaining('Now');
      setIsUrgent(true);
      return;
    }

    const hours = differenceInHours(scheduledTime, now);
    const minutes = totalMinutes % 60;

    if (hours >= 24) {
      // 24시간 이상 남음: 일 단위로 표시
      const days = Math.floor(hours / 24);
      setTimeRemaining(`${days}d`);
      setIsUrgent(false);
    } else if (hours > 0) {
      // 1시간~24시간 남음: 시간 단위로 표시
      setTimeRemaining(`${hours}h`);
      setIsUrgent(hours < 2); // 2시간 미만이면 긴급
    } else {
      // 1시간 미만: 분 단위로 표시
      setTimeRemaining(`${minutes}m`);
      setIsUrgent(true);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, []);

  // 1분마다 시간 업데이트
  useEffect(() => {
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // 60초

    return () => clearInterval(interval);
  }, [appointment]);

  return {
    appointment,
    timeRemaining,
    isUrgent,
    loading,
    refresh: fetchAppointment,
  };
}
