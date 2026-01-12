export interface User {
  id: number;
  nickname: string;
  email?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  isOnboarded: boolean;
  role: 'GUEST' | 'USER';
}
