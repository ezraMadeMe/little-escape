import { apiFetch } from './client';
import { User } from '../types/user';

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/api/v1/users/me');
}
