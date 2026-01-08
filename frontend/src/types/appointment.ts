export interface Appointment {
  id: number;
  userId?: number;
  missionId?: number;
  missionTitle: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  scheduledAt: string;
  createdAt: string;
}
