import { apiFetch } from './client';
import { Appointment, AppointmentStatus } from '../types/appointment';

const ACTIVE_APPOINTMENT_STATUSES = new Set<AppointmentStatus>([
  AppointmentStatus.CREATED,
  AppointmentStatus.UNLOCKED,
  AppointmentStatus.PENDING,
  AppointmentStatus.ACCEPTED,
  AppointmentStatus.ARRIVED,
  AppointmentStatus.IN_PROGRESS,
]);

export async function createAppointment(params: {
  scheduledAt: string;
  missionId?: number;
  departureLatitude?: number;
  departureLongitude?: number;
  searchRadius?: number;
  userLatitude?: number | null;
  userLongitude?: number | null;
}): Promise<Appointment> {
  const body: any = {
    scheduledAt: params.scheduledAt,
  };

  if (params.missionId !== undefined) {
    body.missionId = params.missionId;
  }

  if (params.departureLatitude !== undefined) {
    body.departureLatitude = params.departureLatitude;
  }

  if (params.departureLongitude !== undefined) {
    body.departureLongitude = params.departureLongitude;
  }

  if (params.searchRadius !== undefined) {
    body.searchRadius = params.searchRadius;
  }

  if (params.userLatitude !== undefined && params.userLatitude !== null) {
    body.userLatitude = params.userLatitude;
  }

  if (params.userLongitude !== undefined && params.userLongitude !== null) {
    body.userLongitude = params.userLongitude;
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

export interface FeedItem {
  appointmentId: number;
  missionTitle: string;
  placeName: string;
  proofImageUrls: string[];
  proofComment: string | null;
  userNickname: string;
  completedAt: string;
  reviewKeywords: string[];
  rating?: number; // 별점 (0.0 ~ 5.0)
  status: string; // ACCEPTED, ARRIVED, COMPLETED 등
  scheduledAt: string;
  isLikedByMe: boolean; // 현재 사용자가 좋아요 했는지 여부
  likeCount?: number;
  saveCount?: number;
  commentCount?: number;
  isSavedByMe: boolean; // 현재 사용자가 저장했는지 여부
}

export async function getPublicFeed(page: number = 0, size: number = 20): Promise<FeedItem[]> {
  return apiFetch<FeedItem[]>(`/api/v1/appointments/feed?page=${page}&size=${size}`);
}

export async function cancelAppointment(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/appointments/${id}/cancel`, {
    method: 'PATCH',
  });
}

export async function completeAppointment(
  id: number,
  comment: string,
  keywords: string[],
  files: File[],
  rating?: number,
  proofImageUrls?: string[]
): Promise<void> {
  const formData = new FormData();

  // 1. JSON 데이터를 Blob으로 변환
  const requestDto = {
    proofComment: comment || null,
    reviewKeywords: keywords,
    rating: rating,
    proofImageUrls: proofImageUrls
  };
  const jsonBlob = new Blob([JSON.stringify(requestDto)], { type: "application/json" });
  formData.append("request", jsonBlob);

  // 2. 파일 데이터 추가
  files.forEach((file) => {
    formData.append("files", file);
  });

  // 3. 디버깅용 로그 (실제 전송되는 데이터 확인)
  console.log("=== 전송 데이터 준비 완료 ===");
  console.log("Request DTO:", requestDto);
  console.log("Files count:", files.length);
  files.forEach((file, index) => {
    console.log(`File ${index + 1}:`, { name: file.name, size: file.size, type: file.type });
  });

  // FormData는 console.log(formData)로 내용이 안 보임. 아래처럼 확인해야 함.
  console.log("FormData entries:");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const token = localStorage.getItem('token');
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/appointments/${id}/complete`;

  console.log('API Request - URL:', url);
  console.log('API Request - Method:', 'POST');

  // 4. Fetch 요청 전송
  // 중요: Content-Type 헤더를 설정하지 않음 -> 브라우저가 boundary를 자동으로 붙임
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
    headers: {
      'ngrok-skip-browser-warning': 'true',  // ngrok 경고 페이지 우회
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      // Content-Type은 명시하지 않음! 브라우저가 자동으로 multipart/form-data; boundary=... 를 설정
    },
  });

  console.log('API Response - Status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    console.error('API Response - Error:', errorData);
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
  }

  console.log('API Response - Success');
}

export async function cloneAppointment(appointmentId: number): Promise<number> {
  const response = await apiFetch<Appointment>(`/api/v1/appointments/${appointmentId}/clone`, {
    method: 'POST',
  });
  return response.id;
}

// Favorite functionality has been merged into Save/Bookmark functionality
// export async function toggleFavorite(appointmentId: number): Promise<void> {
//   return apiFetch<void>(`/api/v1/appointments/${appointmentId}/favorite`, {
//     method: 'PATCH',
//   });
// }

export async function markAsArrived(appointmentId: number): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/v1/appointments/${appointmentId}/arrive`, {
    method: 'PATCH',
  });
}

export async function bulkDeleteAppointments(appointmentIds: number[]): Promise<void> {
  return apiFetch<void>('/api/v1/appointments/bulk', {
    method: 'DELETE',
    body: JSON.stringify(appointmentIds),
  });
}

/**
 * 약속 완전 삭제 (Hard Delete)
 * 약속과 연관된 모든 데이터(저장, 좋아요, 댓글)를 영구적으로 삭제합니다.
 * @param appointmentId 삭제할 약속 ID
 */
export async function deleteAppointment(appointmentId: number): Promise<void> {
  return apiFetch<void>(`/api/v1/appointments/${appointmentId}`, {
    method: 'DELETE',
  });
}

// ========================================
// 개발용 API (테스트 전용)
// ========================================

// 개발용: 약속 시간 타임 트래블 (현재로 당기기 - 관리자용)
export async function adminTimeTravel(appointmentId: number): Promise<void> {
  await apiFetch<void>(`${import.meta.env.VITE_API_BASE_URL}/api/admin/appointments/${appointmentId}/time-travel`, {
    method: 'PATCH',
  });
}

// 개발용: 약속 날짜를 내일(D-1)로 변경
export async function devUnlockTomorrow(appointmentId: number): Promise<Appointment> {
  console.log('============ [API] devUnlockTomorrow 호출 ============');
  console.log('요청 URL:', `/api/v1/appointments/${appointmentId}/dev/unlock-tomorrow`);
  console.log('요청 메서드: PUT');
  console.log('약속 ID:', appointmentId);
  
  const result = await apiFetch<Appointment>(`/api/v1/appointments/${appointmentId}/dev/unlock-tomorrow`, {
    method: 'PUT',
  });
  
  console.log('✅ API 응답 성공:', result);
  console.log('============================================');
  return result;
}

// 개발용: 약속 날짜를 현재 시간으로 변경
export async function devUnlockNow(appointmentId: number): Promise<Appointment> {
  console.log('============ [API] devUnlockNow 호출 ============');
  console.log('요청 URL:', `/api/v1/appointments/${appointmentId}/dev/unlock-now`);
  console.log('요청 메서드: PUT');
  console.log('약속 ID:', appointmentId);
  
  const result = await apiFetch<Appointment>(`/api/v1/appointments/${appointmentId}/dev/unlock-now`, {
    method: 'PUT',
  });
  
  console.log('✅ API 응답 성공:', result);
  console.log('============================================');
  return result;
}

// 미션 교체 (Swap)
export async function swapMission(appointmentId: number): Promise<Appointment> {
  console.log('=== 미션 교체 API 호출 ===');
  console.log('약속 ID:', appointmentId);

  const result = await apiFetch<Appointment>(`/api/v1/appointments/${appointmentId}/swap`, {
    method: 'PATCH',
  });

  console.log('✅ 미션 교체 성공:', result);
  return result;
}

// 가장 가까운 예정된 약속 조회
export async function getNextAppointment(): Promise<Appointment | null> {
  try {
    const appointments = await getMyAppointments();

    console.log('📋 전체 약속 목록:', appointments);
    console.log('📋 약속 개수:', appointments.length);

    // 완료되지 않은 약속만 필터링 (PENDING, ACCEPTED 포함)
    const activeAppointments = appointments.filter((apt) =>
      ACTIVE_APPOINTMENT_STATUSES.has(apt.status)
    );

    console.log('🔄 진행 중인 약속:', activeAppointments);
    console.log('🔄 진행 중인 약속 개수:', activeAppointments.length);

    if (activeAppointments.length === 0) {
      console.log('❌ 진행 중인 약속 없음');
      localStorage.removeItem('appointmentId');
      return null;
    }

    // 예정 시간 기준 오름차순 정렬 (가장 가까운 약속이 먼저)
    const sorted = activeAppointments.sort((a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    console.log('✅ 가장 가까운 약속:', sorted[0]);
    console.log('  - ID:', sorted[0].id);
    console.log('  - Status:', sorted[0].status);
    console.log('  - Mission:', sorted[0].missionTitle || '미선택');
    console.log('  - Scheduled:', sorted[0].scheduledAt);

    localStorage.setItem('appointmentId', String(sorted[0].id));
    return sorted[0];
  } catch (error) {
    console.error('❌ 다음 약속 조회 실패:', error);
    localStorage.removeItem('appointmentId');
    return null;
  }
}

// ========================================
// 저장 기능 (Scrap/Bookmark)
// ========================================

/**
 * 약속 좋아요/좋아요 취소 (토글)
 * @param appointmentId 좋아요할 약속 ID
 * @returns 좋아요 여부 (true: 좋아요됨, false: 좋아요 취소됨)
 */
export async function toggleLikeAppointment(appointmentId: number): Promise<boolean> {
  const response = await apiFetch<{ isLiked: boolean; message: string }>(
    `/api/v1/appointments/${appointmentId}/like`,
    {
      method: 'POST',
    }
  );
  return response.isLiked;
}

/**
 * 약속 저장/저장 취소 (토글)
 * @param appointmentId 저장할 약속 ID
 * @returns 저장 여부 (true: 저장됨, false: 저장 취소됨)
 */
export async function toggleSaveAppointment(appointmentId: number): Promise<boolean> {
  const response = await apiFetch<{ isSaved: boolean; message: string }>(
    `/api/v1/appointments/${appointmentId}/save`,
    {
      method: 'POST',
    }
  );
  return response.isSaved;
}

/**
 * 사용자가 저장한 약속 목록 조회
 * @returns 저장된 약속 리스트
 */
export async function getSavedAppointments(): Promise<FeedItem[]> {
  return apiFetch<FeedItem[]>('/api/v1/appointments/saved');
}
