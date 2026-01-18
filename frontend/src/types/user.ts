export interface User {
  id: number;
  nickname: string;
  email?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  isOnboarded: boolean;
  role: 'GUEST' | 'USER';
  mbti?: string;      // I 또는 E
  soloLevel?: number; // 1~10 (혼밥 레벨)
}
