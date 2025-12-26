declare global {
  interface Window {
    kakao?: any;
  }
}

export async function loadKakaoSdk(appKey: string) {
  // ✅ autoload=false에서는 maps는 있어도 LatLng가 아직 없을 수 있음
  if (window.kakao?.maps?.LatLng) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("kakao sdk load error")));
      return;
    }

    const s = document.createElement("script");
    s.dataset.kakaoSdk = "1";
    s.async = true;

    // ✅ places/geocoder 쓰면 services 필요
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;

    s.onload = () => resolve();
    s.onerror = () => reject(new Error("kakao sdk load error"));
    document.head.appendChild(s);
  });

  // ✅ 여기서부터가 중요: maps 생성자들이 준비될 때까지 기다림
  await new Promise<void>((resolve) => {
    window.kakao.maps.load(() => resolve());
  });
}

export function getKakaoJsKey(): string | undefined {
  const key = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
  if (!key) return undefined;
  const trimmed = key.trim().replace(/^["']|["']$/g, ""); // 따옴표 제거까지
  return trimmed.length ? trimmed : undefined;
}

  
