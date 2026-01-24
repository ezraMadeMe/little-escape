/**
 * Mock 데이터 유틸리티
 * Super Admin 모드에서 백엔드 없이 프론트엔드 플로우를 테스트할 수 있도록 함
 */

import { Appointment, AppointmentStatus } from '../types/appointment';
import type { FeedItem } from '../api/appointmentApi';

// Mock 유저 체크
export const isMockUser = (): boolean => {
  const token = localStorage.getItem('token');
  const isMock = token?.startsWith('mock-dev-token-') || false;
  console.log('🔍 Mock 유저 체크:', { token: token?.substring(0, 30), isMock });
  return isMock;
};

// Mock 약속 데이터 생성
export const createMockAppointment = (overrides?: Partial<Appointment>): Appointment => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    id: Math.floor(Math.random() * 10000),
    userId: 999,
    missionId: 1,
    missionTitle: '성수동 핫플 카페 탐방',
    status: AppointmentStatus.ACCEPTED,
    scheduledAt: tomorrow.toISOString(),
    createdAt: now.toISOString(),
    placeName: '성수 어느 카페',
    placeAddress: '서울시 성수동 123-45',
    placeUrl: 'https://place.map.kakao.com/123456',
    latitude: 37.5445,
    longitude: 127.0557,
    missionImageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    placeImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    visitCount: 1,
    isFavorite: false,
    missionGuide: JSON.stringify([
      { step: 1, title: '카페 도착하기', description: '성수동의 숨은 보석 같은 카페를 찾아가보세요' },
      { step: 2, title: '시그니처 메뉴 주문', description: '이 카페만의 특별한 음료를 맛보세요' },
      { step: 3, title: '인증샷 남기기', description: '카페의 분위기와 음료를 사진으로 남겨보세요' }
    ]),
    rating: 0,
    missionDescription: '성수동의 핫플 카페를 탐방하고, 혼자만의 여유를 즐겨보세요.',
    ...overrides
  };
};

// Mock 피드 아이템 생성
export const createMockFeedItem = (overrides?: Partial<FeedItem>): FeedItem => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    appointmentId: Math.floor(Math.random() * 10000),
    missionTitle: '성수동 핫플 카페 탐방',
    placeName: '성수 어느 카페',
    proofImageUrls: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80'
    ],
    proofComment: '성수동 카페 진짜 좋다! 혼자 와서 책 읽기 딱 좋은 분위기. 커피도 맛있고 사람도 많지 않아서 편하게 있다 갔어요 😊',
    userNickname: 'Super Admin',
    completedAt: yesterday.toISOString(),
    reviewKeywords: ['🌿 힐링돼요', '😌 편안해요', '👀 새로워요'],
    rating: 4.5,
    status: 'COMPLETED' as string,
    scheduledAt: yesterday.toISOString(),
    isLikedByMe: false,
    likeCount: 12,
    saveCount: 5,
    commentCount: 3,
    isSavedByMe: false,
    ...overrides
  };
};

// Mock 피드 데이터 여러 개 생성
export const createMockFeeds = (count: number = 10): FeedItem[] => {
  const feeds: FeedItem[] = [];
  const missions = [
    { title: '성수동 핫플 카페 탐방', place: '성수 어느 카페', keywords: ['🌿 힐링돼요', '😌 편안해요'] },
    { title: '을지로 레트로 바 방문', place: '을지로 어느 바', keywords: ['🔥 뿌듯해요', '💪 활기차요'] },
    { title: '북촌 한옥마을 산책', place: '북촌', keywords: ['👀 새로워요', '🌿 힐링돼요'] },
    { title: '이태원 세계 음식 탐방', place: '이태원 맛집', keywords: ['💪 활기차요', '👀 새로워요'] },
    { title: '홍대 인디 서점 방문', place: '홍대 어느 서점', keywords: ['🤫 조용해요', '😌 편안해요'] },
  ];

  for (let i = 0; i < count; i++) {
    const mission = missions[i % missions.length];
    const daysAgo = i;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    feeds.push(createMockFeedItem({
      appointmentId: 1000 + i,
      missionTitle: mission.title,
      placeName: mission.place,
      reviewKeywords: mission.keywords,
      completedAt: date.toISOString(),
      scheduledAt: date.toISOString(),
      userNickname: `탈출러${i + 1}`,
      rating: 3 + Math.random() * 2,
      likeCount: Math.floor(Math.random() * 50),
      saveCount: Math.floor(Math.random() * 20),
      commentCount: Math.floor(Math.random() * 10),
    }));
  }

  return feeds;
};

// Mock 내 약속 목록 생성
export const createMockMyAppointments = (): Appointment[] => {
  const now = new Date();

  // 1. 진행 중인 약속 (내일)
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  // 2. 완료된 약속들 (과거)
  const completed1 = new Date(now);
  completed1.setDate(completed1.getDate() - 3);

  const completed2 = new Date(now);
  completed2.setDate(completed2.getDate() - 7);

  return [
    // 진행 중인 약속
    createMockAppointment({
      id: 1001,
      status: AppointmentStatus.ACCEPTED,
      scheduledAt: tomorrow.toISOString(),
      missionTitle: '성수동 핫플 카페 탐방',
      placeName: '성수 어느 카페',
    }),
    // 완료된 약속 1
    createMockAppointment({
      id: 1002,
      status: AppointmentStatus.COMPLETED,
      scheduledAt: completed1.toISOString(),
      completedAt: completed1.toISOString(),
      missionTitle: '을지로 레트로 바 방문',
      placeName: '을지로 어느 바',
      proofImageUrls: [
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80'
      ],
      proofComment: '을지로 분위기 정말 좋았어요! 다음에 또 가고 싶네요',
      reviewKeywords: ['🔥 뿌듯해요', '💪 활기차요'],
      rating: 4.5,
    }),
    // 완료된 약속 2
    createMockAppointment({
      id: 1003,
      status: AppointmentStatus.COMPLETED,
      scheduledAt: completed2.toISOString(),
      completedAt: completed2.toISOString(),
      missionTitle: '북촌 한옥마을 산책',
      placeName: '북촌',
      proofImageUrls: [
        'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800&q=80'
      ],
      proofComment: '한옥마을 산책하면서 힐링했어요',
      reviewKeywords: ['🌿 힐링돼요', '👀 새로워요'],
      rating: 5.0,
    }),
  ];
};

// Mock 유저 정보
export const getMockUser = () => {
  const mockUser = localStorage.getItem('mock_user');
  if (mockUser) {
    return JSON.parse(mockUser);
  }
  return {
    id: 999,
    nickname: 'Super Admin',
    email: 'admin@solotion.dev',
    isOnboarded: true
  };
};
