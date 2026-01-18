import { Mission } from '../types/mission';
import { apiFetch } from './client';

export async function fetchMissions(): Promise<Mission[]> {
  try {
    return await apiFetch<Mission[]>('/api/v1/missions');
  } catch (error) {
    console.error('Failed to fetch missions:', error);
    throw error;
  }
}

export async function getMissionTemplates(): Promise<Mission[]> {
  return fetchMissions();
}

export async function getRecommendedMissions(scheduledAt: string): Promise<Mission[]> {
  try {
    const encodedScheduledAt = encodeURIComponent(scheduledAt);
    return await apiFetch<Mission[]>(`/api/v1/missions/recommend?scheduledAt=${encodedScheduledAt}`);
  } catch (error) {
    console.error('Failed to fetch recommended missions:', error);
    throw error;
  }
}

/**
 * 오늘의 미션 한 개를 가져옵니다 (랜덤 추천)
 */
export async function getTodayMission(userId?: number, scheduledAt?: string): Promise<Mission> {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId.toString());
    if (scheduledAt) params.append('scheduledAt', scheduledAt);

    const queryString = params.toString();
    const url = queryString ? `/api/v1/missions/today?${queryString}` : '/api/v1/missions/today';

    return await apiFetch<Mission>(url);
  } catch (error) {
    console.error('Failed to fetch today mission:', error);
    throw error;
  }
}
