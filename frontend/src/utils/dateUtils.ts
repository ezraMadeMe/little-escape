/**
 * 날짜/시간 포맷팅 유틸리티 함수
 *
 * 서버에서 받은 UTC ISO 8601 문자열을 사용자의 로컬 시간대로 변환하여 표시합니다.
 * JavaScript의 Date 객체는 ISO 8601 문자열을 파싱할 때 자동으로 로컬 시간으로 변환합니다.
 */

/**
 * 날짜를 YYYY/MM/DD 형식으로 포맷
 * @param dateString - ISO 8601 UTC 문자열 (예: "2026-01-12T05:00:00Z")
 * @returns YYYY/MM/DD 형식의 로컬 날짜 (예: "2026/01/12")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

/**
 * 시간을 HH:mm 형식으로 포맷
 * @param dateString - ISO 8601 UTC 문자열
 * @returns HH:mm 형식의 로컬 시간 (예: "14:00")
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 날짜와 시간을 YYYY년 MM월 DD일 HH:mm 형식으로 포맷
 * @param dateString - ISO 8601 UTC 문자열
 * @returns YYYY년 MM월 DD일 HH:mm 형식의 로컬 날짜/시간
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
};

/**
 * 로케일 형식으로 날짜 포맷 (예: 2026. 1. 12.)
 * @param dateString - ISO 8601 UTC 문자열
 * @returns 로케일 형식의 로컬 날짜
 */
export const formatDateLocale = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
};

/**
 * 로케일 형식으로 시간 포맷 (예: 오후 2:00)
 * @param dateString - ISO 8601 UTC 문자열
 * @returns 로케일 형식의 로컬 시간
 */
export const formatTimeLocale = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * D-Day 계산
 * @param scheduledAt - ISO 8601 UTC 문자열
 * @returns D-Day 텍스트 (예: "D-3", "D-Day", "D+2")
 */
export const calculateDday = (scheduledAt: string): string => {
  const scheduled = new Date(scheduledAt);
  const today = new Date();

  // 시간 정보를 제거하고 날짜만 비교
  scheduled.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = scheduled.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'D-Day';
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
};

/**
 * 특정 날짜가 오늘 또는 그 이후인지 확인
 * @param scheduledAt - ISO 8601 UTC 문자열
 * @returns true if 오늘 이후, false otherwise
 */
export const isDateUnlocked = (scheduledAt: string): boolean => {
  const now = new Date();
  const scheduled = new Date(scheduledAt);

  now.setHours(0, 0, 0, 0);
  scheduled.setHours(0, 0, 0, 0);

  return now >= scheduled;
};
