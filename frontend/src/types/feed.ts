import { User } from './user';

export type FeedStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface FeedAppointment {
  id: number;
  user: User;
  missionTitle: string;
  missionCategory: string;
  status: FeedStatus;
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
