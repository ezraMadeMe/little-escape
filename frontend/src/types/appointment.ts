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
  missionTitle?: string;
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
  /** @deprecated Use proofImageUrls instead */
  proofImageUrl?: string;
  proofImageUrls?: string[]; // 다중 이미지 URL 리스트
  reviewKeywords?: string[]; // 감성 키워드
  visitCount?: number;
  isFavorite?: boolean; // 즐겨찾기 여부
}
