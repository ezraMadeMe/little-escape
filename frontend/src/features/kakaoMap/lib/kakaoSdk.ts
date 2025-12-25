declare global {
    interface Window {
      kakao?: any;
    }
  }
  
export async function loadKakaoSdk(appKey: string) {
  if (window.kakao?.maps) return;

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
      s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("kakao sdk load error"));
      document.head.appendChild(s);
    });

  window.kakao.maps.load(() => {});
}

export function getKakaoJsKey(): string | undefined {
  const key =
    typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_KAKAO_JS_KEY;
  if (typeof key !== "string") return undefined;
  const trimmed = key.trim();
  return trimmed.length ? trimmed : undefined;
}
  
