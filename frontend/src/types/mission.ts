export interface Mission {
  id: number;
  title: string;
  description: string;
  category: string;
  difficultyLevel?: string;
  condition?: string;
  imageUrl?: string;
  locationType?: 'INDOOR' | 'OUTDOOR' | 'ANY';
  timeOfDay?: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'ANY';
  createdAt?: string;
  updatedAt?: string;
  // 장소 정보
  location?: LocationInfo;
  // 만날 시간 (예: "오후 3:00")
  timeToMeet?: string;
  // 미션 완료 여부
  isCompleted?: boolean;
  // Progressive Disclosure: 점진적으로 공개되는 정보
  preparations?: string[]; // 준비물 리스트
  detailedCourse?: string; // 상세 코스 (도착 후 공개)
  tasks?: string[]; // 할 일 목록 (도착 후 공개)
  // Plan B: 예비 코스
  planB?: PlanB;
}

// 장소 정보 인터페이스
export interface LocationInfo {
  name: string;        // 장소명 (예: "성수역 3번 출구")
  address?: string;    // 주소
  latitude?: number;   // 위도
  longitude?: number;  // 경도
}

// Plan B 인터페이스 - 사용자 불안감 해소용 예비 플랜
export interface PlanB {
  title: string;
  description: string;
  placeName: string;
  placeAddress?: string;
  placeUrl?: string;
  imageUrl?: string;
  reason: string; // 왜 이 플랜을 준비했는지 설명 (츤데레 톤)
}
