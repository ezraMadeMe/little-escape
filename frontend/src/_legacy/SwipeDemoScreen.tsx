import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "../shared/hooks/useIsMobile";
import { getKakaoJsKey } from "../features/kakaoMap/lib/kakaoSdk";

declare global {
  interface Window {
    kakao?: any;
  }
}

type Mode = "CAR" | "TRANSIT" | "WALK" | "BICYCLE";
type LatLng = { lat: number; lng: number };

type Poi = {
  name: string;
  category: "맛집" | "카페" | "볼거리";
  desc: string;
  lat: number;
  lng: number;
};

type Candidate = {
  id: number;
  title: string;
  area: string;
  score: number;
  estMin: number;
  dest: LatLng;
  reason: string;
  pois: Poi[];
  // 하드코딩 경로(없으면 직선)
  path?: LatLng[];
};

function loadKakaoSdk(appKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) return resolve();

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

function buildWebLink(origin: LatLng, dest: LatLng) {
  return `https://map.kakao.com/link/from/${encodeURIComponent("출발")},${origin.lat},${origin.lng}/to/${encodeURIComponent(
    "도착"
  )},${dest.lat},${dest.lng}`;
}

function buildDeeplink(mode: Mode, origin: LatLng, dest: LatLng) {
  const by = mode === "TRANSIT" ? "PUBLICTRANSIT" : mode === "WALK" ? "FOOT" : mode === "BICYCLE" ? "BICYCLE" : "CAR";
  return `kakaomap://route?sp=${origin.lat},${origin.lng}&ep=${dest.lat},${dest.lng}&by=${by}`;
}

// ✅ 하드코딩 추천 데이터(서울 기준)
const DEMO: { origin: LatLng; mode: Mode; budgetMin: number; tags: string[]; candidates: Candidate[] } = {
  origin: { lat: 37.566295, lng: 126.977945 }, // 서울시청
  mode: "CAR",
  budgetMin: 80,
  tags: ["조용한", "산책", "야경"],
  candidates: [
    {
      id: 1,
      title: "남산공원 산책 + N서울타워 야경",
      area: "중구",
      score: 9.2,
      estMin: 70,
      dest: { lat: 37.551169, lng: 126.988227 },
      reason: "야경 + 가벼운 산책 + 접근성 좋음",
      pois: [
        { category: "볼거리", name: "N서울타워", desc: "야경 포인트, 전망", lat: 37.551169, lng: 126.988227 },
        { category: "카페", name: "해방촌 카페거리", desc: "분위기 좋은 카페 밀집", lat: 37.5425, lng: 126.9867 },
        { category: "맛집", name: "남산 돈까스(근처)", desc: "클래식한 돈까스 라인", lat: 37.5572, lng: 126.9858 },
      ],
      path: [
        { lat: 37.566295, lng: 126.977945 },
        { lat: 37.5610, lng: 126.9835 },
        { lat: 37.5557, lng: 126.9862 },
        { lat: 37.551169, lng: 126.988227 },
      ],
    },
    {
      id: 2,
      title: "북촌 한옥마을 가볍게 걷기",
      area: "종로구",
      score: 8.9,
      estMin: 65,
      dest: { lat: 37.5826, lng: 126.9830 },
      reason: "사진/산책 + 조용한 골목",
      pois: [
        { category: "볼거리", name: "북촌 한옥마을", desc: "한옥 골목 산책", lat: 37.5826, lng: 126.9830 },
        { category: "카페", name: "삼청동 카페", desc: "감성 카페", lat: 37.5849, lng: 126.9816 },
        { category: "맛집", name: "칼국수/만두집(근처)", desc: "가벼운 한 끼", lat: 37.5799, lng: 126.9852 },
      ],
      path: [
        { lat: 37.566295, lng: 126.977945 },
        { lat: 37.5714, lng: 126.9812 },
        { lat: 37.5777, lng: 126.9824 },
        { lat: 37.5826, lng: 126.9830 },
      ],
    },
    {
      id: 3,
      title: "성수동 카페 + 서울숲 산책",
      area: "성동구",
      score: 8.7,
      estMin: 90,
      dest: { lat: 37.5445, lng: 127.0374 },
      reason: "카페 + 산책 + 사진",
      pois: [
        { category: "볼거리", name: "서울숲", desc: "산책/피크닉", lat: 37.5445, lng: 127.0374 },
        { category: "카페", name: "성수 카페거리", desc: "다양한 카페", lat: 37.5460, lng: 127.0430 },
        { category: "맛집", name: "성수 수제버거", desc: "간단하고 맛있는", lat: 37.5472, lng: 127.0406 },
      ],
    },
    {
      id: 4,
      title: "한강 야간 드라이브 + 편의점 라면",
      area: "용산/마포",
      score: 8.4,
      estMin: 75,
      dest: { lat: 37.5283, lng: 126.9326 }, // 여의도 한강공원 근처
      reason: "야경 + 드라이브 + 부담 없는 한 끼",
      pois: [
        { category: "볼거리", name: "여의도 한강공원", desc: "강바람 + 야경", lat: 37.5283, lng: 126.9326 },
        { category: "맛집", name: "한강 라면(편의점)", desc: "가벼운 재미 요소", lat: 37.5276, lng: 126.9336 },
        { category: "카페", name: "한강뷰 카페(근처)", desc: "야경 감상", lat: 37.5269, lng: 126.9370 },
      ],
    },
  ],
};

type DemoAcceptPayload = {
    acceptedAt: number;
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    destinationName: string;
  };
  
  type SwipeDemoScreenProps = {
    onBack?: () => void;
    onAccept?: (p: DemoAcceptPayload) => void;
  };
  
export default function SwipeDemoScreen({ onBack, onAccept }: SwipeDemoScreenProps) {  
  const appKey = getKakaoJsKey();

  const isMobile = useIsMobile();

  // 카드 진행 상태
  const [idx, setIdx] = useState(0);
  const current = DEMO.candidates[idx] ?? null;
  const next = DEMO.candidates[idx + 1] ?? null;

  // 스와이프 드래그
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const threshold = 120;

  // 수락 상태
  const [accepted, setAccepted] = useState<Candidate | null>(null);

  // 지도
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polyRef = useRef<any>(null);
  const poiMarkersRef = useRef<any[]>([]);
  const focusPoiMarkerRef = useRef<any>(null);

  const origin = DEMO.origin;
  const mode = DEMO.mode;

  const webLink = useMemo(() => (accepted ? buildWebLink(origin, accepted.dest) : ""), [accepted, origin]);
  const deeplink = useMemo(() => (accepted ? buildDeeplink(mode, origin, accepted.dest) : ""), [accepted, origin, mode]);

  const layout = useMemo(
    () => ({
      page: { ...S.page, padding: isMobile ? 12 : 16 },
      shell: { ...S.shell, maxWidth: isMobile ? "100%" : 1200 },
      topbar: {
        ...S.topbar,
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
      },
      grid: { ...S.grid, gridTemplateColumns: isMobile ? "1fr" : "520px 1fr" },
      deck: { ...S.deck, height: isMobile ? 520 : 640 },
      map: { ...S.map, height: isMobile ? 420 : 720 },
      actions: {
        ...S.actions,
        gridTemplateColumns: "1fr 1fr",
        gap: isMobile ? 8 : 10,
      },
    }),
    [isMobile]
  );

  // 지도 init
  useEffect(() => {
    if (!appKey || !mapEl.current) return;

    let cancelled = false;
    loadKakaoSdk(appKey)
      .then(() => {
        if (cancelled) return;
        if (!window.kakao?.maps) throw new Error("kakao.maps missing");
        window.kakao.maps.load(() => {
          if (cancelled) return;
          const center = new window.kakao.maps.LatLng(origin.lat, origin.lng);
          const map = new window.kakao.maps.Map(mapEl.current, { center, level: 6 });
          mapRef.current = map;

          // 출발 마커
          const o = new window.kakao.maps.LatLng(origin.lat, origin.lng);
          const oMarker = new window.kakao.maps.Marker({ position: o });
          oMarker.setMap(map);
          markersRef.current = [oMarker];

          const b = new window.kakao.maps.LatLngBounds();
          b.extend(o);
          map.setBounds(b);
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [appKey, origin.lat, origin.lng]);

  // accepted 바뀌면 지도 업데이트 (마커/폴리/POI)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    // clear
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    poiMarkersRef.current.forEach((m) => m.setMap(null));
    poiMarkersRef.current = [];
    if (polyRef.current) {
      polyRef.current.setMap(null);
      polyRef.current = null;
    }
    if (focusPoiMarkerRef.current) {
      focusPoiMarkerRef.current.setMap(null);
      focusPoiMarkerRef.current = null;
    }

    // origin marker
    const o = new window.kakao.maps.LatLng(origin.lat, origin.lng);
    const oMarker = new window.kakao.maps.Marker({ position: o });
    oMarker.setMap(map);
    markersRef.current.push(oMarker);

    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(o);

    if (accepted) {
      const d = new window.kakao.maps.LatLng(accepted.dest.lat, accepted.dest.lng);
      const dMarker = new window.kakao.maps.Marker({ position: d });
      dMarker.setMap(map);
      markersRef.current.push(dMarker);
      bounds.extend(d);

      const path = accepted.path?.length
        ? accepted.path.map((p) => new window.kakao.maps.LatLng(p.lat, p.lng))
        : [o, d];

      const poly = new window.kakao.maps.Polyline({
        path,
        strokeWeight: 6,
        strokeOpacity: 0.9,
      });
      poly.setMap(map);
      polyRef.current = poly;

      // POI 마커 추가
      accepted.pois.forEach((poi) => {
        const pos = new window.kakao.maps.LatLng(poi.lat, poi.lng);
        const m = new window.kakao.maps.Marker({ position: pos });
        m.setMap(map);
        poiMarkersRef.current.push(m);
        bounds.extend(pos);
      });

      // bounds를 path 기준으로 좀 더 예쁘게(있으면)
      if (accepted.path?.length) {
        const b2 = new window.kakao.maps.LatLngBounds();
        accepted.path.forEach((p) => b2.extend(new window.kakao.maps.LatLng(p.lat, p.lng)));
        // poi도 포함
        accepted.pois.forEach((poi) => b2.extend(new window.kakao.maps.LatLng(poi.lat, poi.lng)));
        map.setBounds(b2);
        return;
      }
    }

    map.setBounds(bounds);
  }, [accepted, origin]);

  const goNext = () => {
    setIdx((i) => Math.min(i + 1, DEMO.candidates.length));
    setDragX(0);
    setDragging(false);
  };

  const reject = () => {
    if (!current || accepted) return;
    goNext();
  };

  const focusPoi = (poi: Poi) => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;
    const pos = new window.kakao.maps.LatLng(poi.lat, poi.lng);
    map.setCenter(pos);
    if (!focusPoiMarkerRef.current) {
      focusPoiMarkerRef.current = new window.kakao.maps.Marker({ position: pos, zIndex: 10 });
      focusPoiMarkerRef.current.setMap(map);
    } else {
      focusPoiMarkerRef.current.setPosition(pos);
      focusPoiMarkerRef.current.setMap(map);
    }
  };

  const accept = () => {
    if (!current || accepted) return;
  
    const ts = Date.now();
    setAccepted(current);
    setDragX(0);
    setDragging(false);
  
    // ✅ App으로 “수락 결과” 넘겨서 다음 화면(EscapeComplete)로 이동
    onAccept?.({
      acceptedAt: ts,
      origin: DEMO.origin,
      destination: current.dest,
      destinationName: current.title,
    });
  };
  
  const reset = () => {
    setAccepted(null);
    setIdx(0);
    setDragX(0);
    setDragging(false);
  };

  // swipe handlers
  const onPointerDown = (e: React.PointerEvent) => {
    if (!current || accepted) return;
    setDragging(true);
    startXRef.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !current || accepted) return;
    setDragX(e.clientX - startXRef.current);
  };

  const onPointerUp = () => {
    if (!dragging || !current || accepted) return;
    setDragging(false);

    if (dragX > threshold) {
      setDragX(220);
      accept();
    } else if (dragX < -threshold) {
      setDragX(-220);
      reject();
    } else {
      setDragX(0);
    }
  };

  return (
    <div style={layout.page}>
      <div style={layout.shell}>
        <div style={layout.topbar}>
          <div>
            <div style={S.title}>추천 카드 (하드코딩 데모)</div>
            <div style={S.subTitle}>
              좌=거절 · 우=수락 · 수락하면 경로/맛집/볼거리 표시
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btnGhost} onClick={reset}>리셋</button>
            <button style={S.btnGhost} onClick={onBack}>뒤로</button>
          </div>
        </div>

        <div style={layout.grid}>
          {/* LEFT */}
          <section style={S.cardPane}>
            <div style={S.headerRow}>
              <div style={{ fontWeight: 950 }}>
                {accepted ? "선택 완료" : `카드 ${Math.min(idx + 1, DEMO.candidates.length)}/${DEMO.candidates.length}`}
              </div>
              <div style={{ fontSize: 12, color: "#a1a1aa" }}>
                {DEMO.mode}로 · 편도 {DEMO.budgetMin}분 이내 일탈 코스
              </div>
            </div>

            <div style={layout.deck}>
              {!current && !accepted && (
                <div style={S.empty}>
                  카드 끝! <button style={S.linkBtn} onClick={reset}>처음부터</button>
                </div>
              )}

              {next && !accepted && (
                <div style={{ ...S.card, ...S.cardBehind }}>
                  <CardBody c={next} onFocusPoi={focusPoi} />
                </div>
              )}

              {current && !accepted && (
                <div
                  style={{
                    ...S.card,
                    transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)`,
                    transition: dragging ? "none" : "transform 180ms ease",
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                >
                  <div style={S.swipeHint}>
                    <span style={{ ...S.pill, opacity: Math.max(0, dragX / 120) }}>ACCEPT</span>
                    <span style={{ ...S.pill, opacity: Math.max(0, -dragX / 120) }}>REJECT</span>
                  </div>
                  <CardBody c={current} onFocusPoi={focusPoi} />
                </div>
              )}

              {accepted && (
                <div style={{ ...S.card, borderColor: "rgba(52,211,153,0.35)" }}>
                  <div style={S.acceptedTitle}>✅ 선택됨</div>
                  <CardBody c={accepted} onFocusPoi={focusPoi} />

                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button
                      style={S.btnPrimary}
                      onClick={() => window.open(webLink, "_blank", "noopener,noreferrer")}
                    >
                      카카오맵 웹 열기
                    </button>
                    <button
                      style={S.btnSecondary}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(deeplink);
                          alert("딥링크 복사 완료!");
                        } catch {
                          alert("복사 실패\n\n" + deeplink);
                        }
                      }}
                    >
                      딥링크 복사
                    </button>
                  </div>

                  <div style={S.meta}>
                    지도에는 출발/도착 + 경로 폴리라인 + POI 마커가 표시됨(하드코딩).
                  </div>

                  <div style={S.poiBox}>
                    <div style={{ fontWeight: 950, marginBottom: 8 }}>맛집 / 카페 / 볼거리</div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {accepted.pois.map((p, i) => (
                        <div key={i} style={S.poiItem}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ fontWeight: 950 }}>{p.name}</div>
                            <span style={S.poiTag}>{p.category}</span>
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12, color: "#a1a1aa" }}>{p.desc}</div>
                          <div style={{ marginTop: 6 }}>
                            <button
                              style={S.btnTiny}
                              onClick={() => {
                                const map = mapRef.current;
                                if (map && window.kakao?.maps) {
                                  map.setCenter(new window.kakao.maps.LatLng(p.lat, p.lng));
                                }
                              }}
                            >
                              지도에서 보기
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!accepted && current && (
              <div style={layout.actions}>
                <button style={S.btnReject} onClick={reject}>거절</button>
                <button style={S.btnAccept} onClick={accept}>수락</button>
              </div>
            )}
          </section>

          {/* RIGHT */}
          <section style={S.mapPane}>
            <div style={S.mapHeader}>
              <div style={{ fontWeight: 950 }}>추천 경로</div>
              <div style={{ fontSize: 12, color: "#a1a1aa" }}>
                {accepted ? `${accepted.title} · ${accepted.area}` : "카드를 수락하면 경로와 POI가 나타남"}
              </div>
            </div>
            <div ref={mapEl} style={layout.map} />
            <div style={S.mapFooter}>
              {accepted
                ? "경로(폴리라인) + POI(마커)를 표시 중"
                : "지금은 출발 마커만 표시 중"}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CardBody({ c, onFocusPoi }: { c: Candidate; onFocusPoi?: (p: Poi) => void }) {
  const stars = React.useMemo(() => {
    const rating5 = Math.max(0, Math.min(5, c.score / 2));
    const full = Math.floor(rating5);
    const half = rating5 - full >= 0.5;
    return { rating5, full, half };
  }, [c.score]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 980 }}>{c.title}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#a1a1aa" }}>
            {c.area} ? ~{c.estMin}? ? {stars.rating5.toFixed(1)} / 5.0
          </div>
        </div>
        <div style={S.scoreBlock}>
          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 800, marginBottom: 4 }}>??? ?? ??? (????)</div>
          <div style={S.starRow}>
            {Array.from({ length: 5 }).map((_, i) => {
              const idx = i + 1;
              const isFull = idx <= stars.full;
              const isHalf = stars.half && idx === stars.full + 1;
              return (
                <span
                  key={idx}
                  style={{ fontSize: 16, color: isFull ? "#fbbf24" : isHalf ? "#fbbf24" : "#374151", opacity: isFull || isHalf ? 1 : 0.65 }}
                >
                  ?
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: "#e5e7eb", lineHeight: 1.5 }}>
        {c.reason}
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {c.pois.map((p, i) => (
          <button key={i} style={S.pill2} onClick={() => onFocusPoi?.(p)}>
            #{p.category}:{p.name}
          </button>
        ))}
      </div>
    </>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#07070b", color: "#f3f4f6", fontFamily: "system-ui", padding: 16 },
  shell: { maxWidth: 1200, margin: "0 auto" },

  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 950 },
  subTitle: { marginTop: 2, fontSize: 12, color: "#a1a1aa" },

  btnGhost: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
  },

  grid: { display: "grid", gridTemplateColumns: "520px 1fr", gap: 14 },

  cardPane: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(17,17,24,0.55)", overflow: "hidden" },
  headerRow: { padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" },

  deck: { position: "relative", height: 640, padding: 14 },
  empty: { padding: 14, borderRadius: 14, border: "1px dashed rgba(255,255,255,0.18)", color: "#a1a1aa" },
  linkBtn: { background: "transparent", border: "none", color: "#93c5fd", cursor: "pointer", fontWeight: 900 },

  card: {
    position: "absolute",
    inset: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.28)",
    padding: 14,
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    touchAction: "none",
    overflow: "auto",
  },
  cardBehind: { transform: "scale(0.985) translateY(8px)", opacity: 0.85 },
  swipeHint: { display: "flex", justifyContent: "space-between", marginBottom: 10 },
  pill: { fontSize: 12, fontWeight: 950, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.06)" },
  pill2: { fontSize: 12, fontWeight: 850, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer" },

  acceptedTitle: { fontWeight: 980, marginBottom: 8, color: "#34d399" },

  scoreBubble: { minWidth: 68, textAlign: "center", fontSize: 12, padding: "8px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", fontWeight: 950, height: 34, alignSelf: "flex-start" },

  actions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: 14, borderTop: "1px solid rgba(255,255,255,0.08)" },
  btnReject: { padding: "12px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", fontWeight: 980, cursor: "pointer" },
  btnAccept: { padding: "12px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "linear-gradient(90deg, rgba(34,197,94,0.95), rgba(59,130,246,0.95))", color: "white", fontWeight: 980, cursor: "pointer" },

  btnPrimary: { flex: 1, padding: "10px 10px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.92)", color: "#111827", fontWeight: 980, cursor: "pointer" },
  btnSecondary: { flex: 1, padding: "10px 10px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", fontWeight: 980, cursor: "pointer" },
  btnTiny: { padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", fontWeight: 900, cursor: "pointer", fontSize: 12 },

  meta: { marginTop: 10, fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 },
  poiBox: { marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)" },
  poiItem: { borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.20)", padding: 12 },
  poiTag: { fontSize: 12, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", color: "#e5e7eb" },

  mapPane: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(17,17,24,0.40)", overflow: "hidden", display: "flex", flexDirection: "column" },
  mapHeader: { padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" },
  map: { height: 720, width: "100%", background: "#0f172a" },
  mapFooter: { padding: 10, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "#a1a1aa" },
};
