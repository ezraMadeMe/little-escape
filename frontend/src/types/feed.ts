import { User } from './user';

export interface FeedAppointment {
  id: number;
  user: User;
  missionTitle: string;
  missionCategory: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  content: string;
  proofImages: string[];
  bookmarkCount: number;
  commentCount: number;
  isBookmarked: boolean;
  createdAt: string;
}

export interface FeedComment {
  id: number;
  user: User;
  content: string;
  createdAt: string;
  replies?: FeedComment[];
}
