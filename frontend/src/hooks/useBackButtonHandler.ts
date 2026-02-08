import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { showToast } from '../utils/toast';

/**
 * 뒤로가기 버튼 핸들러
 * 루트 페이지(피드, 약속, 리뷰, 마이페이지)에서 뒤로가기 두 번 누르면 앱 종료
 */
export const useBackButtonHandler = () => {
  const location = useLocation();
  const lastBackPressTime = useRef<number>(0);
  const BACK_PRESS_INTERVAL = 2000; // 2초 이내에 두 번 눌러야 종료

  // 루트 페이지 목록 (Bottom Navigation이 있는 페이지)
  const rootPages = ['/feed', '/appointments', '/reviews', '/mypage'];

  const isRootPage = useCallback(() => {
    return rootPages.includes(location.pathname);
  }, [location.pathname]);

  const handleBackButton = useCallback((e: PopStateEvent) => {
    const currentTime = Date.now();

    // 루트 페이지가 아니면 일반 뒤로가기 동작
    if (!isRootPage()) {
      return;
    }

    // 루트 페이지에서 뒤로가기
    e.preventDefault();

    // 2초 이내에 다시 뒤로가기 누름
    if (currentTime - lastBackPressTime.current < BACK_PRESS_INTERVAL) {
      // 앱 종료 (브라우저 탭 닫기)
      console.log('🚪 앱 종료');

      // PWA에서는 window.close()가 동작하지 않을 수 있음
      // 대신 히스토리를 최소화하고 사용자에게 안내
      if (window.history.length > 1) {
        window.history.go(-(window.history.length - 1));
      } else {
        // 브라우저 탭 닫기 시도
        window.close();

        // window.close()가 실패하면 (대부분의 경우) 안내 메시지
        setTimeout(() => {
          showToast('앱을 종료하려면 홈 버튼을 눌러주세요');
        }, 100);
      }
    } else {
      // 첫 번째 뒤로가기
      lastBackPressTime.current = currentTime;
      showToast('뒤로가기 버튼을 한 번 더 누르면 종료됩니다');

      // 히스토리에 현재 페이지 추가 (뒤로가기 방지)
      window.history.pushState(null, '', location.pathname);
    }
  }, [isRootPage, location.pathname]);

  useEffect(() => {
    // 루트 페이지에서만 이벤트 리스너 등록
    if (!isRootPage()) {
      return;
    }

    // 히스토리에 현재 페이지 추가 (뒤로가기 이벤트를 가로채기 위함)
    window.history.pushState(null, '', location.pathname);

    // popstate 이벤트 리스너 등록
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [isRootPage, handleBackButton, location.pathname]);

  return null;
};
