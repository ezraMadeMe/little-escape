import React, { useEffect, useMemo, useRef, useState } from "react";
import type { TripSessionContext, CandidateCard, LatLng } from "./PickAndRecommendScreen";
import type { TransportMode } from "./FirstScreen";
import { getKakaoJsKey } from "../features/kakaoMap/lib/kakaoSdk";

declare global {
  interface Window {
    kakao?: any;
  }
}

type RouteResp = {
  distanceM: number;
  durationSec: number;
  path: { lat: number; lng: number }[];
};

function fmtMin(sec: number) {
  return `${Math.max(1, Math.round(sec / 60))}분`;
}

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

function buildWebLink(origin: LatLng, dest: LatLng) {
  return `https://map.kakao.com/link/from/${encodeURIComponent("출발")},${origin.lat},${origin.lng}/to/${encodeURIComponent(
    "도착"
  )},${dest.lat},${dest.lng}`;
}

function buildDeeplink(mode: TransportMode, origin: LatLng, dest: LatLng) {
  const by =
    mode === "TRANSIT" ? "PUBLICTRANSIT" :
    mode === "WALK" ? "FOOT" :
    mode === "BICYCLE" ? "BICYCLE" : "CAR";
  return `kakaomap://route?sp=${origin.lat},${origin.lng}&ep=${dest.lat},${dest.lng}&by=${by}`;
}

type Props = {
  ctx: TripSessionContext;
  onBack: () => void;
  onRestart: () => void; // 1번으로 리셋하고 싶으면 사용
};

export default function SwipeCardsRouteScreen({ ctx, onBack, onRestart }: Props) {
  const appKey = getKakaoJsKey();

  // ---- 카드 상태 ----
  const [index, setIndex] = useState(0);
  const current = ctx.recommendations[index] ?? null;
  const next = ctx.recommendations[index + 1] ?? null;

  // ---- 스와이프 드래그 ----
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);

  // ---- 선택/결과 ----
  const [accepted, setAccepted] = useState<CandidateCard | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [route, setRoute] = useState<RouteResp | null>(null);

  // ---- 지도 ----
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  const destLatLng = useMemo<LatLng | null>(() => {
    if (!accepted) return null;
    return { lat: accepted.destLat, lng: accepted.destLng };
  }, [accepted]);

  const webLink = useMemo(() => (destLatLng ? buildWebLink(ctx.origin, destLatLng) : ""), [ctx.origin, destLatLng]);
  const deeplink = useMemo(() => (destLatLng ? buildDeeplink(ctx.mode, ctx.origin, destLatLng) : ""), [ctx.mode, ctx.origin, destLatLng]);

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
          const center = new window.kakao.maps.LatLng(ctx.origin.lat, ctx.origin.lng);
          const map = new window.kakao.maps.Map(mapEl.current, { center, level: 6 });
          mapRef.current = map;

          // 초기: 출발 마커만
          const o = new window.kakao.maps.LatLng(ctx.origin.lat, ctx.origin.lng);
          const oMarker = new window.kakao.maps.Marker({ position: o });
          oMarker.setMap(map);
          markersRef.current = [oMarker];

          const bounds = new window.kakao.maps.LatLngBounds();
          bounds.extend(o);
          map.setBounds(bounds);
        });
      })
      .catch(() => {
        // 지도 키/도메인이 이미 해결됐으니 여기서 조용히
      });

    return () => {
      cancelled = true;
    };
  }, [appKey, ctx.origin.lat, ctx.origin.lng]);

  // 수락/경로 갱신되면 지도에 그리기
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    // clear markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // clear polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const o = new window.kakao.maps.LatLng(ctx.origin.lat, ctx.origin.lng);
    const oMarker = new window.kakao.maps.Marker({ position: o });
    oMarker.setMap(map);
    markersRef.current.push(oMarker);

    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(o);

    if (accepted) {
      const d = new window.kakao.maps.LatLng(accepted.destLat, accepted.destLng);
      const dMarker = new window.kakao.maps.Marker({ position: d });
      dMarker.setMap(map);
      markersRef.current.push(dMarker);
      bounds.extend(d);

      const path =
        route?.path?.length
          ? route.path.map((p) => new window.kakao.maps.LatLng(p.lat, p.lng))
          : [o, d];

      const poly = new window.kakao.maps.Polyline({
        path,
        strokeWeight: 6,
        strokeOpacity: 0.9,
      });
      poly.setMap(map);
      polylineRef.current = poly;

      // bounds를 route path 기준으로 잡으면 더 예쁨
      if (route?.path?.length) {
        const b2 = new window.kakao.maps.LatLngBounds();
        route.path.forEach((p) => b2.extend(new window.kakao.maps.LatLng(p.lat, p.lng)));
        map.setBounds(b2);
        return;
      }
    }

    map.setBounds(bounds);
  }, [accepted, route, ctx.origin.lat, ctx.origin.lng]);

  // ---- API: 자동차 경로 가져오기 ----
  const fetchCarRoute = async (origin: LatLng, dest: LatLng) => {
    setRouteLoading(true);
    setRouteError("");
    setRoute(null);

    try {
      const res = await fetch("/api/v1/routes/car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originLat: origin.lat,
          originLng: origin.lng,
          destLat: dest.lat,
          destLng: dest.lng,
        }),
      });
      if (!res.ok) throw new Error(`route api error ${res.status}`);
      const json = await res.json();
      setRoute(json.data as RouteResp);
    } catch (e: any) {
      setRouteError(e?.message ?? String(e));
    } finally {
      setRouteLoading(false);
    }
  };

  // ---- 카드 액션 ----
  const goNext = () => {
    setIndex((i) => Math.min(i + 1, ctx.recommendations.length)); // 끝까지 가면 null
    setDragX(0);
    setDragging(false);
  };

  const reject = () => {
    if (!current) return;
    goNext();
  };

  const accept = async () => {
    if (!current) return;
    setAccepted(current);

    // 자동차 모드만 “실제 폴리라인”을 가져온다
    if (ctx.mode === "CAR") {
      await fetchCarRoute(ctx.origin, { lat: current.destLat, lng: current.destLng });
    } else {
      setRoute(null);
    }
  };

  // ---- 스와이프 핸들러 ----
  const threshold = 120;

  const onPointerDown = (e: React.PointerEvent) => {
    if (!current || accepted) return;
    setDragging(true);
    startXRef.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !current || accepted) return;
    const dx = e.clientX - startXRef.current;
    setDragX(dx);
  };

  const onPointerUp = async () => {
    if (!dragging || !current || accepted) return;
    setDragging(false);

    if (dragX > threshold) {
      // 오른쪽: 수락
      setDragX(240);
      await accept();
    } else if (dragX < -threshold) {
      // 왼쪽: 거절
      setDragX(-240);
      reject();
    } else {
      setDragX(0);
    }
  };

  // UI
  const total = ctx.recommendations.length;
  const done = accepted ? index : index; // accepted 상태면 카드 진행 멈춤

  return (
    <div style={S.page}>
      <div style={S.shell}>
        <div style={S.topbar}>
          <button onClick={onBack} style={S.btnGhost}>← 뒤로</button>
          <div>
            <div style={S.title}>추천 카드</div>
            <div style={S.subTitle}>
              {accepted ? "선택 완료" : `카드 ${Math.min(done + 1, total)}/${total} · 오른쪽=수락 · 왼쪽=거절`}
            </div>
          </div>
          <button onClick={onRestart} style={S.btnGhost}>처음으로</button>
        </div>

        <div style={S.grid}>
          {/* LEFT: cards */}
          <section style={S.cardPane}>
            <div style={S.cardHeader}>
              <div style={{ fontWeight: 950 }}>스와이프</div>
              <div style={{ fontSize: 12, color: "#a1a1aa" }}>
                모드: {ctx.mode} · 예산: {ctx.budgetMin}분
              </div>
            </div>

            <div style={S.deck}>
              {!current && !accepted && (
                <div style={S.empty}>
                  더 이상 카드가 없어. <button style={S.linkBtn} onClick={onRestart}>다시 시작</button>
                </div>
              )}

              {/* next card (behind) */}
              {next && !accepted && (
                <div style={{ ...S.card, ...S.cardBehind }}>
                  <CardBody c={next} />
                </div>
              )}

              {/* current card */}
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
                  <CardBody c={current} />
                </div>
              )}

              {/* accepted view */}
              {accepted && (
                <div style={{ ...S.card, borderColor: "rgba(52,211,153,0.35)" }}>
                  <div style={S.acceptedTitle}>✅ 선택됨</div>
                  <CardBody c={accepted} />
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button
                      style={S.btnPrimary}
                      onClick={() => {
                        window.open(webLink, "_blank", "noopener,noreferrer");
                      }}
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

                  <div style={S.routeMeta}>
                    {ctx.mode === "CAR" ? (
                      routeLoading ? "경로 불러오는 중..." :
                      routeError ? `경로 오류: ${routeError}` :
                      route ? `거리 ${route.distanceM}m · 시간 ${fmtMin(route.durationSec)} · 포인트 ${route.path.length}개` :
                      "경로 없음"
                    ) : (
                      "폴리라인은 CAR 모드에서만 표시(MVP). 다른 모드는 카카오맵으로 확인."
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* action buttons */}
            {!accepted && current && (
              <div style={S.actions}>
                <button style={S.btnReject} onClick={reject}>거절</button>
                <button style={S.btnAccept} onClick={accept}>수락</button>
              </div>
            )}
          </section>

          {/* RIGHT: map */}
          <section style={S.mapPane}>
            <div style={S.mapHeader}>
              <div style={{ fontWeight: 950 }}>결과 지도</div>
              <div style={{ fontSize: 12, color: "#a1a1aa" }}>
                {accepted ? `목적지: ${accepted.destName}` : "수락하면 경로 폴리라인 표시"}
              </div>
            </div>
            <div ref={mapEl} style={S.map} />
            <div style={S.mapFooter}>
              {accepted ? "출발/도착 마커 + 경로(가능하면 실제 폴리라인)" : "카드에서 수락하면 자동으로 그려짐"}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CardBody({ c }: { c: CandidateCard }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 980 }}>{c.destName}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#a1a1aa" }}>
            {c.areaName} · score {c.score.toFixed(2)} {c.estDurationMin != null ? `· ~${c.estDurationMin}분` : ""}
          </div>
        </div>
        <div style={S.scoreBubble}>{c.score.toFixed(2)}</div>
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: "#e5e7eb", lineHeight: 1.5 }}>
        “지금 당장 가기 좋은” 후보지로 추천된 카드야. <br />
        수락하면 경로를 계산해서 지도에 그려줘.
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "#a1a1aa" }}>
        좌표: {c.destLat.toFixed(6)}, {c.destLng.toFixed(6)}
      </div>
    </>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#07070b", color: "#f3f4f6", fontFamily: "system-ui", padding: 16 },
  shell: { maxWidth: 1200, margin: "0 auto" },
  topbar: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12, justifyContent: "space-between" },
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

  grid: { display: "grid", gridTemplateColumns: "480px 1fr", gap: 14 },
  cardPane: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(17,17,24,0.55)", overflow: "hidden" },
  cardHeader: { padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  deck: { position: "relative", height: 520, padding: 14 },
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
  },
  cardBehind: {
    transform: "scale(0.985) translateY(8px)",
    opacity: 0.85,
    filter: "blur(0px)",
  },
  swipeHint: { display: "flex", justifyContent: "space-between", marginBottom: 10 },
  pill: {
    fontSize: 12,
    fontWeight: 950,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
  },

  acceptedTitle: { fontWeight: 980, marginBottom: 8, color: "#34d399" },
  scoreBubble: {
    minWidth: 68,
    textAlign: "center",
    fontSize: 12,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    fontWeight: 950,
    height: 34,
    alignSelf: "flex-start",
  },

  actions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: 14, borderTop: "1px solid rgba(255,255,255,0.08)" },
  btnReject: { padding: "12px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", fontWeight: 980, cursor: "pointer" },
  btnAccept: { padding: "12px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "linear-gradient(90deg, rgba(34,197,94,0.95), rgba(59,130,246,0.95))", color: "white", fontWeight: 980, cursor: "pointer" },

  btnPrimary: { flex: 1, padding: "10px 10px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.92)", color: "#111827", fontWeight: 980, cursor: "pointer" },
  btnSecondary: { flex: 1, padding: "10px 10px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", fontWeight: 980, cursor: "pointer" },
  routeMeta: { marginTop: 10, fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 },

  mapPane: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(17,17,24,0.40)", overflow: "hidden", display: "flex", flexDirection: "column" },
  mapHeader: { padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" },
  map: { height: 600, width: "100%", background: "#0f172a" },
  mapFooter: { padding: 10, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "#a1a1aa" },
};
