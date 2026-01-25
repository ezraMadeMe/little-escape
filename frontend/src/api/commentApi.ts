import { apiFetch } from './client';

export interface Comment {
  id: number;
  content: string;
  userNickname: string;
  userProfileImage: string | null;
  isMyComment: boolean;
  createdAt: string;
}

export async function createComment(appointmentId: number, content: string): Promise<Comment> {
  return apiFetch<Comment>('/api/v1/comments', {
    method: 'POST',
    body: JSON.stringify({ appointmentId, content }),
  });
}

export async function getComments(appointmentId: number): Promise<Comment[]> {
  return apiFetch<Comment[]>(`/api/v1/comments/appointment/${appointmentId}`);
}

export async function deleteComment(commentId: number): Promise<void> {
  return apiFetch<void>(`/api/v1/comments/${commentId}`, {
    method: 'DELETE',
  });
}
