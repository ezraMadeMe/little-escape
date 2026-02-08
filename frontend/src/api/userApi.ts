import { apiFetch } from './client';
import { User } from '../types/user';

export async function getMyInfo(): Promise<User> {
  return apiFetch<User>('/api/v1/users/me');
}

export async function checkNickname(nickname: string): Promise<boolean> {
  const response = await apiFetch<{ available: boolean }>(`/api/v1/users/check-nickname?nickname=${encodeURIComponent(nickname)}`);
  return response.available;
}

export async function getRandomNickname(): Promise<string> {
  const response = await apiFetch<{ nickname: string }>('/api/v1/users/random-nickname');
  return response.nickname;
}

export async function completeOnboarding(data: {
  nickname: string;
  email?: string;
  phoneNumber?: string;
}, profileImage?: File): Promise<{ user: User; token: string }> {
  const formData = new FormData();

  const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  formData.append('data', jsonBlob);

  if (profileImage) {
    formData.append('profileImage', profileImage);
  }

  const token = localStorage.getItem('token');
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/users/onboarding`;

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || 'Onboarding failed');
  }

  const result = await response.json();

  // 새로운 토큰 저장 (계정 통합 시 userId 변경됨)
  if (result.token) {
    localStorage.setItem('token', result.token);
  }

  return result;
}

export async function updateProfile(data: {
  nickname?: string;
  email?: string;
}, profileImage?: File): Promise<User> {
  const formData = new FormData();

  const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  formData.append('data', jsonBlob);

  if (profileImage) {
    formData.append('profileImage', profileImage);
  }

  const token = localStorage.getItem('token');
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/users/profile`;

  const response = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    body: formData,
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || 'Profile update failed');
  }

  return response.json();
}

export async function deleteUser(): Promise<void> {
  return apiFetch<void>('/api/v1/users/me', {
    method: 'DELETE',
  });
}

export async function sendContactEmail(data: {
  subject: string;
  content: string;
}, images?: File[]): Promise<void> {
  const formData = new FormData();

  const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  formData.append('data', jsonBlob);

  if (images && images.length > 0) {
    images.forEach((image) => {
      formData.append('images', image);
    });
  }

  const token = localStorage.getItem('token');
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/users/contact`;

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || 'Contact email failed');
  }
}

/**
 * 채팅 온보딩 데이터 저장 (MBTI 등)
 */
export async function saveChatOnboardingData(data: {
  nickname: string;
  mbti: string;
}): Promise<void> {
  console.log('💾 채팅 온보딩 데이터 저장:', data);

  // localStorage에도 저장 (캐싱 목적)
  localStorage.setItem('user_preferences', JSON.stringify({
    mbti: data.mbti,
    updatedAt: new Date().toISOString(),
  }));

  // 백엔드 API 호출
  return apiFetch<void>('/api/v1/users/preferences', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}