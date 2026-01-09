import { Mission } from '../types/mission';

const API_BASE_URL = `http://${window.location.hostname}:8080/api/v1`;

export async function fetchMissions(): Promise<Mission[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/missions`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Mission[] = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch missions:', error);
    throw error;
  }
}

export async function getMissionTemplates(): Promise<Mission[]> {
  return fetchMissions();
}
