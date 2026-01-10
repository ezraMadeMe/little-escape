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
