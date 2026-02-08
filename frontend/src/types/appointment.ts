export enum AppointmentStatus {
  CREATED = 'CREATED',     // 시간/장소만 정하고, 미션은 아직 모르는 상태
  UNLOCKED = 'UNLOCKED',   // D-1일, 미션 선택 가능
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  EXPIRED = 'EXPIRED',     // 만료됨 (24시간 내 미완료)
}

export interface Appointment {
  id: number;
  userId?: number;
  missionId?: number;
  missionTitle?: string;
  status: AppointmentStatus;
  scheduledAt: string;
  createdAt: string;
  completedAt?: string; // 완료 시각
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
  unlockToken?: string; // 미션 공개용 UUID 토큰
  missionGuide?: string; // JSON 형식 단계별 가이드
  rating?: number; // 별점 (0.0 ~ 5.0)
  missionDescription?: string; // 미션 상세 설명
  isMissionRevealed?: boolean; // 미션 공개 여부 (D-1에 공개)
}
