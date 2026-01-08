import { apiFetch } from './client';
import { Appointment } from '../types/appointment';

export async function createAppointment(missionId: number): Promise<Appointment> {
  return apiFetch<Appointment>('/api/v1/appointments', {
    method: 'POST',
    body: JSON.stringify({ missionId }),
  });
}

export async function getMyAppointments(): Promise<Appointment[]> {
  return apiFetch<Appointment[]>('/api/v1/appointments/me');
}

export async function cancelAppointment(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/appointments/${id}/cancel`, {
    method: 'PATCH',
  });
}
