import { apiFetch } from './client';
import { Appointment } from '../types/appointment';

export async function createAppointment(params: { scheduledAt: string; missionId?: number }): Promise<Appointment> {
  const body: { scheduledAt: string; missionId?: number } = {
    scheduledAt: params.scheduledAt,
  };

  if (params.missionId !== undefined) {
    body.missionId = params.missionId;
  }

  return apiFetch<Appointment>('/api/v1/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAppointmentMission(appointmentId: number, missionId: number): Promise<void> {
  return apiFetch<void>(`/api/v1/appointments/${appointmentId}/mission`, {
    method: 'PATCH',
    body: JSON.stringify({ missionId }),
  });
}

export async function getAppointmentDetail(id: number): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/v1/appointments/${id}`);
}

export async function getMyAppointments(): Promise<Appointment[]> {
  return apiFetch<Appointment[]>('/api/v1/appointments/me');
}

export async function cancelAppointment(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/appointments/${id}/cancel`, {
    method: 'PATCH',
  });
}

export async function completeAppointment(id: number, comment: string): Promise<void> {
  return apiFetch<void>(`/api/v1/appointments/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}
