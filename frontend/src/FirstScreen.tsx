import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "./useIsMobile";

declare global {
  interface Window {
    kakao?: any;
  }
}

export type TransportMode = "CAR" | "TRANSIT" | "WALK" | "BICYCLE";
export type Companion = "SOLO" | "FAMILY" | "COUPLE" | "FRIENDS";
export type LatLng = { lat: number; lng: number };

export type FirstStartPayload = {
  mode: TransportMode;
  budgetMin: number; // one-way minutes
  origin: LatLng;
  companion: Companion;
};

type Props = {
  onStart: (payload: FirstStartPayload) => void;
};

function loadKakaoSdk(appKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Kakao SDK script load error")));
      return;
    }

    const script = document.createElement("script");
    script.dataset.kakaoSdk = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Kakao SDK script load error"));
    document.head.appendChild(script);
  });
}

function toNum(v: string, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const BUDGET_CHOICES = [
  { label: "30분", value: 30 },
  { label: "60분", value: 60 },
  { label: "120분", value: 120 },
  { label: "120분 이상", value: 180 },
];
const COMPANION_CHOICES: { value: Companion; label: string }[] = [
  { value: "SOLO", label: "혼자" },
  { value: "FAMILY", label: "가족" },
  { value: "COUPLE", label: "연인" },
  { value: "FRIENDS", label: "친구" },
];

export default function FirstScreen({ onStart }: Props) {
  const appKey = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
  const isMobile = useIsMobile();

  const [mode, setMode] = useState<TransportMode>("CAR");
  const [budgetMin, setBudgetMin] = useState<number>(60);
  const [originLat, setOriginLat] = useState<string>("37.566295");
  const [originLng, setOriginLng] = useState<string>("126.977945");
  const [companion, setCompanion] = useState<Companion>("SOLO");
  const [sdkStatus, setSdkStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  const canUseMap = useMemo(() => Boolean(appKey), [appKey]);

  const layout = useMemo(
    () => ({
      page: { ...styles.page, padding: isMobile ? 12 : 16 },
      shell: { ...styles.shell, maxWidth: isMobile ? "100%" : 1120 },
      header: {
        ...styles.header,
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "flex-end",
      },
      mapFrame: { ...styles.mapFrame, height: isMobile ? 260 : 360 },
      controls: { ...styles.grid, gridTemplateColumns: "1fr" },
      modeGrid: { ...styles.modeGrid, gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr" },
      budgetGrid: { display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8 },
    }),
    [isMobile]
  );

  // load map once
  useEffect(() => {
    if (!canUseMap || !mapEl.current) return;

    let cancelled = false;
    setSdkStatus("loading");

    loadKakaoSdk(appKey!)
      .then(() => {
        if (cancelled) return;
        if (!window.kakao?.maps) throw new Error("kakao.maps missing");

        window.kakao.maps.load(() => {
          if (cancelled || !mapEl.current) return;
          const origin = new window.kakao.maps.LatLng(toNum(originLat, 37.566295), toNum(originLng, 126.977945));
          const dest = new window.kakao.maps.LatLng(37.551169, 126.988227);

          const map = new window.kakao.maps.Map(mapEl.current, { center: origin, level: 6 });
          mapRef.current = map;

          originMarkerRef.current = new window.kakao.maps.Marker({ position: origin, draggable: true });
          originMarkerRef.current.setMap(map);

          destMarkerRef.current = new window.kakao.maps.Marker({ position: dest });
          destMarkerRef.current.setMap(map);

          lineRef.current = new window.kakao.maps.Polyline({
            path: [origin, dest],
            strokeWeight: 5,
            strokeOpacity: 0.6,
          });
          lineRef.current.setMap(map);

          window.kakao.maps.event.addListener(originMarkerRef.current, "dragend", () => {
            const p = originMarkerRef.current.getPosition();
            setOriginLat(String(p.getLat()));
            setOriginLng(String(p.getLng()));
          });

          window.kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
            const p = mouseEvent.latLng;
            setOriginLat(String(p.getLat()));
            setOriginLng(String(p.getLng()));
          });

          setSdkStatus("ready");
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSdkStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseMap, appKey]);

  // update markers/line when origin changes
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    const map = mapRef.current;

    const origin = new window.kakao.maps.LatLng(toNum(originLat, 37.566295), toNum(originLng, 126.977945));
    const dest = new window.kakao.maps.LatLng(37.551169, 126.988227);

    if (originMarkerRef.current) originMarkerRef.current.setPosition(origin);
    if (destMarkerRef.current) destMarkerRef.current.setPosition(dest);
    if (lineRef.current) lineRef.current.setPath([origin, dest]);

    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(origin);
    bounds.extend(dest);
    map.setBounds(bounds);
  }, [originLat, originLng]);

  const coordValid = useMemo(() => {
    const lat = toNum(originLat, NaN);
    const lng = toNum(originLng, NaN);
    return Number.isFinite(lat) && Number.isFinite(lng);
  }, [originLat, originLng]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginLat(String(pos.coords.latitude));
        setOriginLng(String(pos.coords.longitude));
      },
      () => alert("위치 권한을 허용해주세요"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  function start() {
    const lat = toNum(originLat, 0);
    const lng = toNum(originLng, 0);
    onStart({
      mode,
      budgetMin,
      origin: { lat, lng },
      companion,
    });
  }

  return (
    <div style={layout.page}>
      <div style={layout.shell}>
        <header style={layout.header}>
          <div>
            <div style={styles.appName}>오늘의 일탈</div>
            <div style={styles.subtitle}>
              일상에 작은 일탈을 꿈꾼다면
            </div>
          </div>
        </header>

        <section style={styles.preview}>
          <div style={styles.previewHeader}>
            <div style={styles.previewTitle}>출발지 선택</div>
            <div style={styles.previewMeta}>
              {sdkStatus === "ready"
                ? "지도 준비됨 (클릭으로 출발지 설정)"
                : sdkStatus === "loading"
                ? "지도 로딩 중"
                : sdkStatus === "error"
                ? "지도 로드 실패"
                : canUseMap
                ? "지도 대기"
                : "VITE_KAKAO_JS_KEY 없음"}
            </div>
          </div>

          <div style={layout.mapFrame}>
            <div ref={mapEl} style={styles.map} />
            <div style={styles.mapOverlay}>
              <div style={styles.overlayTitle}>출발지: {coordValid ? `${Number(originLat).toFixed(5)}, ${Number(originLng).toFixed(5)}` : "미지정"}</div>
              <div style={styles.overlayDesc}>
                {modeLabel(mode)} · {budgetMin === 180 ? "120분 이상" : `${budgetMin}분`} 기준 추천
              </div>
            </div>
          </div>
        </section>

        <div style={layout.controls}>
          <section style={styles.card}>
            <div style={styles.cardTitle}>일탈 시작하기</div>

            <div style={{ marginTop: 14 }}>
              <div style={styles.label}>일탈 위치</div>
              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={useMyLocation} style={styles.btnSecondary}>현위치로 설정</button>
                <button
                  onClick={() => {
                    setOriginLat("37.566295");
                    setOriginLng("126.977945");
                  }}
                  style={styles.btnSecondary}
                >
                  직접 설정
                </button>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={styles.label}>일탈 교통수단</div>
              <div style={layout.modeGrid}>
                <ModeButton active={mode === "CAR"} onClick={() => setMode("CAR")} text="자동차" />
                <ModeButton active={mode === "TRANSIT"} onClick={() => setMode("TRANSIT")} text="대중교통" />
                <ModeButton active={mode === "WALK"} onClick={() => setMode("WALK")} text="도보" />
                <ModeButton active={mode === "BICYCLE"} onClick={() => setMode("BICYCLE")} text="자전거" />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={styles.label}>일탈 시간 예산(편도)</div>
              <div style={layout.budgetGrid}>
                {BUDGET_CHOICES.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setBudgetMin(b.value)}
                    style={budgetMin === b.value ? styles.tagOn : styles.tagOff}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={styles.label}>일탈할 사람</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8 }}>
                {COMPANION_CHOICES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCompanion(c.value)}
                    style={companion === c.value ? styles.tagOn : styles.tagOff}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button onClick={start} style={styles.cta} disabled={!coordValid}>
                추천 시작하기 🚀
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function modeLabel(mode: TransportMode) {
  if (mode === "CAR") return "자동차";
  if (mode === "TRANSIT") return "대중교통";
  if (mode === "WALK") return "도보";
  return "자전거";
}

function ModeButton({ active, text, onClick }: { active: boolean; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={active ? styles.modeOn : styles.modeOff}>
      {text}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(1000px 500px at 20% 10%, rgba(99,102,241,0.25), transparent), #07070b",
    color: "#f3f4f6",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    padding: 16,
  },
  shell: { maxWidth: 1120, margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 14,
  },
  appName: { fontSize: 28, fontWeight: 900, letterSpacing: -0.5 },
  subtitle: { marginTop: 6, fontSize: 14, color: "#a1a1aa", lineHeight: 1.4 },
  badgeRow: { display: "flex", gap: 8, flexWrap: "wrap" as const },
  badge: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
  },
  badgeMuted: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#a1a1aa",
    background: "rgba(0,0,0,0.15)",
  },

  grid: { display: "grid", gridTemplateColumns: "1fr", gap: 14 },
  card: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(17,17,24,0.55)",
    padding: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  cardTitle: { fontSize: 16, fontWeight: 900 },
  cardDesc: { marginTop: 6, fontSize: 13, color: "#a1a1aa", lineHeight: 1.45 },

  label: { fontSize: 12, color: "#a1a1aa", marginBottom: 8 },
  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  valuePill: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
  },
  miniInfo: { fontSize: 12, color: "#a1a1aa" },

  modeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  modeOn: {
    padding: "10px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#f9fafb",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  modeOff: {
    padding: "10px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.20)",
    color: "#e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
  },

  input: { width: "100%", padding: "10px 10px", borderRadius: 12, border: "1px solid #374151", background: "rgba(0,0,0,0.2)", color: "#f3f4f6", outline: "none" },

  tagOn: {
    padding: "10px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#f9fafb",
    color: "#111827",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  tagOff: {
    padding: "10px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },

  cta: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(90deg, rgba(99,102,241,0.95), rgba(59,130,246,0.95))",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  ctaHint: { marginTop: 8, fontSize: 12, color: "#a1a1aa" },

  preview: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(17,17,24,0.40)",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    marginBottom: 12,
  },
  previewHeader: {
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  previewTitle: { fontSize: 14, fontWeight: 900 },
  previewMeta: { fontSize: 12, color: "#a1a1aa" },
  mapFrame: { position: "relative", height: 360, background: "#0f172a" },
  map: { height: "100%", width: "100%" },
  mapOverlay: {
    position: "absolute",
    left: 12,
    bottom: 12,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(6px)",
  },
  overlayTitle: { fontSize: 13, fontWeight: 900 },
  overlayDesc: { marginTop: 4, fontSize: 12, color: "#d4d4d8" },

  btnSecondary: {
    width: "100%",
    padding: "10px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
  },
};
