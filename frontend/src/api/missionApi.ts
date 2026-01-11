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
