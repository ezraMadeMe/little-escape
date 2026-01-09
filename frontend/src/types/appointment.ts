export interface Appointment {
  id: number;
  userId?: number;
  missionId?: number;
  missionTitle: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
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
