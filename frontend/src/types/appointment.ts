export enum AppointmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export interface Appointment {
  id: number;
  userId?: number;
  missionId?: number;
  missionTitle: string;
  status: AppointmentStatus;
  scheduledAt: string;
  createdAt: string;
  placeName?: string;
  placeAddress?: string;
  placeUrl?: string;
  latitude?: number;
  longitude?: number;
  missionImageUrl?: string;
  placeImageUrl?: string;
  proofComment?: string;
  visitCount?: number;
}
