import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FirstStartPayload, TransportMode } from "./FirstScreen";
import { useIsMobile } from "./useIsMobile";

declare global {
  interface Window {
    kakao?: any;
  }
}

type PickTarget = "ORIGIN" | "DEST";

export type LatLng = { lat: number; lng: number };

export type CandidateCard = {
  candidateId: number;
  destName: string;
  areaName: string;
  destLat: number;
  destLng: number;
  score: number;
  estDurationMin?: number | null;
};

export type TripSessionCreateResponse = {
  sessionId: number;
  recommendations: CandidateCard[];
};

export type TripSessionContext = {
  sessionId: number;
  origin: LatLng;
  mode: TransportMode;
  budgetMin: number;
  companion: import("./FirstScreen").Companion;
  recommendations: CandidateCard[];
};

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmt(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

const BUDGET_CHOICES = [30, 60, 120, 180];

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
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Kakao SDK script load error"));
    document.head.appendChild(script);
  });
}

type PlaceItem = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
};

type Props = {
    start: FirstStartPayload;
    onBack: () => void;
    onNext: (ctx: TripSessionContext) => void; // ✅ 이게 있어야 onNext를 쓸 수 있음
  };
  

export default function PickAndRecommendScreen({ start, onBack, onNext }: Props) {
  const appKey = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
  const isMobile = useIsMobile();

  const [mode, setMode] = useState<TransportMode>(start.mode);
  const [budgetMin, setBudgetMin] = useState<number>(start.budgetMin);
  const [companion] = useState(start.companion);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  const [sdkStatus, setSdkStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sdkError, setSdkError] = useState("");

  const [pickTarget, setPickTarget] = useState<PickTarget>("ORIGIN");

  const [oLat, setOLat] = useState(String(start.origin.lat ?? 37.566295));
  const [oLng, setOLng] = useState(String(start.origin.lng ?? 126.977945));
  const [dLat, setDLat] = useState("37.551169");
  const [dLng, setDLng] = useState("126.988227");

  const origin = useMemo(() => ({ lat: toNum(oLat), lng: toNum(oLng) }), [oLat, oLng]);
  const dest = useMemo(() => ({ lat: toNum(dLat), lng: toNum(dLng) }), [dLat, dLng]);

  const coordValid = useMemo(() => {
    const latOk = (v: number) => Number.isFinite(v) && v >= -90 && v <= 90;
    const lngOk = (v: number) => Number.isFinite(v) && v >= -180 && v <= 180;
    return latOk(origin.lat) && lngOk(origin.lng) && latOk(dest.lat) && lngOk(dest.lng);
  }, [origin, dest]);

  const layout = useMemo(() => ({
    page: { ...S.page, padding: isMobile ? 12 : 16 },
    shell: { ...S.shell, maxWidth: isMobile ? "100%" : 1200 },
    topbar: {
      ...S.topbar,
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
    },
    status: { ...S.status, marginLeft: isMobile ? 0 : "auto" },
    grid: { ...S.grid, gridTemplateColumns: isMobile ? "1fr" : "440px 1fr" },
    map: { ...S.map, height: isMobile ? 360 : 640 },
    mapCard: { ...S.mapCard, minHeight: isMobile ? 360 : undefined },
  }), [isMobile]);

  const [keyword, setKeyword] = useState("");
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [searching, setSearching] = useState(false);

  const [loadingRec, setLoadingRec] = useState(false);
  const [recError, setRecError] = useState("");

  useEffect(() => {
    if (!appKey) {
      setSdkStatus("error");
      setSdkError("VITE_KAKAO_JS_KEY가 없습니다. .env.local 확인");
      return;
    }
    if (!mapEl.current) return;

    setSdkStatus("loading");
    loadKakaoSdk(appKey)
      .then(() => {
        if (!window.kakao?.maps) throw new Error("kakao.maps missing");
        window.kakao.maps.load(() => {
          const center = new window.kakao.maps.LatLng(origin.lat, origin.lng);
          const map = new window.kakao.maps.Map(mapEl.current, { center, level: 6 });
          mapRef.current = map;

          window.kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
            const latlng = mouseEvent.latLng;
            const lat = latlng.getLat();
            const lng = latlng.getLng();
            if (pickTarget === "ORIGIN") {
              setOLat(String(lat));
              setOLng(String(lng));
            } else {
              setDLat(String(lat));
              setDLng(String(lng));
            }
          });

          setSdkStatus("ready");
        });
      })
      .catch((e: any) => {
        setSdkStatus("error");
        setSdkError(String(e?.message ?? e));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appKey]);

  useEffect(() => {
    if (sdkStatus !== "ready") return;
    if (!coordValid) return;
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    const o = new window.kakao.maps.LatLng(origin.lat, origin.lng);
    const d = new window.kakao.maps.LatLng(dest.lat, dest.lng);

    if (!originMarkerRef.current) {
      originMarkerRef.current = new window.kakao.maps.Marker({ position: o, draggable: true });
      originMarkerRef.current.setMap(map);
      window.kakao.maps.event.addListener(originMarkerRef.current, "dragend", () => {
        const p = originMarkerRef.current.getPosition();
        setOLat(String(p.getLat()));
        setOLng(String(p.getLng()));
      });
    } else originMarkerRef.current.setPosition(o);

    if (!destMarkerRef.current) {
      destMarkerRef.current = new window.kakao.maps.Marker({ position: d, draggable: true });
      destMarkerRef.current.setMap(map);
      window.kakao.maps.event.addListener(destMarkerRef.current, "dragend", () => {
        const p = destMarkerRef.current.getPosition();
        setDLat(String(p.getLat()));
        setDLng(String(p.getLng()));
      });
    } else destMarkerRef.current.setPosition(d);

    if (lineRef.current) lineRef.current.setMap(null);
    const line = new window.kakao.maps.Polyline({ path: [o, d], strokeWeight: 5, strokeOpacity: 0.85 });
    line.setMap(map);
    lineRef.current = line;

    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(o);
    bounds.extend(d);
    map.setBounds(bounds);
  }, [sdkStatus, coordValid, origin, dest]);

  const searchPlaces = async () => {
    if (sdkStatus !== "ready") return;
    if (!window.kakao?.maps?.services) return;
    const q = keyword.trim();
    if (!q) return;

    setSearching(true);
    setPlaces([]);

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(q, (data: any, status: any) => {
      setSearching(false);
      if (status !== window.kakao.maps.services.Status.OK) {
        setPlaces([]);
        return;
      }
      setPlaces(data as PlaceItem[]);
    });
  };

  const applyPlace = (p: PlaceItem) => {
    const lat = toNum(p.y);
    const lng = toNum(p.x);
    if (pickTarget === "ORIGIN") {
      setOLat(String(lat));
      setOLng(String(lng));
    } else {
      setDLat(String(lat));
      setDLng(String(lng));
    }
    const map = mapRef.current;
    if (map && window.kakao?.maps) map.setCenter(new window.kakao.maps.LatLng(lat, lng));
  };

  const useMyLocationForOrigin = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickTarget("ORIGIN");
        setOLat(String(pos.coords.latitude));
        setOLng(String(pos.coords.longitude));
      },
      () => alert("위치 권한 거부/실패"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const requestRecommend = async () => {
    if (!coordValid) return;
    setLoadingRec(true);
    setRecError("");

    try {
      const body = {
        mode,
        origin: { lat: origin.lat, lng: origin.lng },
        budget: { type: "ONE_WAY_MIN", value: budgetMin },
        constraintsJson: JSON.stringify({ companion }),
      };

      const res = await fetch("/api/v1/trip-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-USER-ID": "1" },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      const data = json.data as TripSessionCreateResponse;

      // ✅ 3번 화면으로 넘김
      onNext({
        sessionId: data.sessionId,
        origin: { lat: origin.lat, lng: origin.lng },
        mode,
        budgetMin,
        companion,
        recommendations: data.recommendations,
      });
    } catch (e: any) {
      setRecError(e?.message ?? String(e));
    } finally {
      setLoadingRec(false);
    }
    const goDemoNext = () => {
        // ✅ 백엔드/DB 없이도 다음 화면으로 이동시키는 더미 컨텍스트
        onNext({
          sessionId: 1,
          origin: { lat: origin.lat, lng: origin.lng },
          mode,
          budgetMin,
          recommendations: [
            {
              candidateId: 1,
              destName: "남산공원/N서울타워",
              areaName: "중구",
              destLat: 37.551169,
              destLng: 126.988227,
              score: 9.2,
              estDurationMin: 35,
            },
            {
              candidateId: 2,
              destName: "북촌 한옥마을",
              areaName: "종로구",
              destLat: 37.5826,
              destLng: 126.9830,
              score: 8.9,
              estDurationMin: 30,
            },
            {
              candidateId: 3,
              destName: "서울숲/성수",
              areaName: "성동구",
              destLat: 37.5445,
              destLng: 127.0374,
              score: 8.7,
              estDurationMin: 45,
            },
          ],
        });
      };      
  };

  const goDemoNext = () => {
    onNext({
      sessionId: 1,
      origin: { lat: origin.lat, lng: origin.lng }, // ✅ origin은 useMemo로 만든 그 origin
      mode,
      budgetMin,
      recommendations: [],
    });
  };
  

  return (
    <div style={layout.page}>
      <div style={layout.shell}>
        <div style={layout.topbar}>
          <button onClick={onBack} style={S.backBtn}>← 뒤로</button>
          <div>
            <div style={S.title}>출발/도착 선택</div>
          </div>
          <div style={layout.status}>
            SDK: {sdkStatus === "ready" ? "READY" : sdkStatus === "loading" ? "LOADING" : "ERROR"}
          </div>
        </div>

        {sdkStatus === "error" && <div style={S.errorBox}>{sdkError}</div>}

        <div style={layout.grid}>
          <section style={S.card}>
            <div style={S.sectionTitle}>타겟</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPickTarget("ORIGIN")} style={chip(pickTarget === "ORIGIN")}>출발</button>
              <button onClick={() => setPickTarget("DEST")} style={chip(pickTarget === "DEST")}>도착</button>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={S.sectionTitle}>이동수단</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["CAR", "TRANSIT", "WALK", "BICYCLE"] as TransportMode[]).map((m) => (
                  <button key={m} onClick={() => setMode(m)} style={chip(mode === m)}>{m}</button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={S.sectionTitle}>시간 예산 (편도)</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8 }}>
                {BUDGET_CHOICES.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBudgetMin(b)}
                    style={budgetMin === b ? S.btnPrimary : S.btnSecondary}
                  >
                    {b === 180 ? "120분 이상" : `${b}분`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={S.sectionTitle}>좌표</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                <input value={oLat} onChange={(e) => setOLat(e.target.value)} style={S.input} placeholder="출발 lat" />
                <input value={oLng} onChange={(e) => setOLng(e.target.value)} style={S.input} placeholder="출발 lng" />
                <input value={dLat} onChange={(e) => setDLat(e.target.value)} style={S.input} placeholder="도착 lat" />
                <input value={dLng} onChange={(e) => setDLng(e.target.value)} style={S.input} placeholder="도착 lng" />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: coordValid ? "#34d399" : "#fb7185", fontWeight: 800 }}>
                {coordValid ? "좌표 OK" : "좌표 오류"}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginTop: 10 }}>
                <button onClick={useMyLocationForOrigin} style={S.btnSecondary}>내 위치(출발)</button>
                <button onClick={() => setPickTarget(p => (p === "ORIGIN" ? "DEST" : "ORIGIN"))} style={S.btnSecondary}>타겟 토글</button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={S.sectionTitle}>검색</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchPlaces()} style={{ ...S.input, flex: 1 }} />
                <button onClick={searchPlaces} style={S.btnSecondary} disabled={searching || sdkStatus !== "ready"}>{searching ? "검색중" : "검색"}</button>
              </div>
              {places.length > 0 && (
                <div style={S.listBox}>
                  {places.slice(0, 8).map((p) => (
                    <button key={p.id} onClick={() => applyPlace(p)} style={S.listItem}>
                      <div style={{ fontWeight: 900 }}>{p.place_name}</div>
                      <div style={{ fontSize: 12, color: "#a1a1aa" }}>{(p.road_address_name || p.address_name) || ""} · {fmt(toNum(p.y), toNum(p.x))}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
                <button onClick={requestRecommend} style={S.btnPrimary} disabled={!coordValid || loadingRec}>
                    {loadingRec ? "추천 생성 중..." : "추천 받기 →"}
                </button>

                {/* ✅ 데모 버튼: 백엔드 없이 바로 다음 화면 */}
                <button onClick={goDemoNext} style={{ ...S.btnSecondary, marginTop: 10 }}>
                    데모로 다음(카드 화면) →
                </button>

                {recError && (
                    <div style={{ marginTop: 8, color: "#fb7185", fontSize: 12 }}>
                    오류: {recError}
                    </div>
                )}
            </div>
          </section>
          <section style={layout.mapCard}>
            <div style={S.mapHeader}>
              <div style={{ fontWeight: 900 }}>지도 (클릭하면 {pickTarget === "ORIGIN" ? "출발" : "도착"})</div>
              <div style={{ fontSize: 12, color: "#a1a1aa" }}>
                출발 {fmt(origin.lat, origin.lng)} · 도착 {fmt(dest.lat, dest.lng)}
              </div>
            </div>
            <div ref={mapEl} style={layout.map} />
          </section>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#07070b", color: "#f3f4f6", fontFamily: "system-ui", padding: 16 },
  shell: { maxWidth: 1200, margin: "0 auto" },
  topbar: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 },
  backBtn: { borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", padding: "10px 12px", cursor: "pointer", fontWeight: 900 },
  title: { fontSize: 18, fontWeight: 950 },
  subTitle: { marginTop: 2, fontSize: 12, color: "#a1a1aa" },
  status: { marginLeft: "auto", fontSize: 12, color: "#a1a1aa" },
  errorBox: { padding: 12, borderRadius: 12, border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.15)" },
  grid: { display: "grid", gridTemplateColumns: "440px 1fr", gap: 14 },
  card: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(17,17,24,0.55)", padding: 14 },
  sectionTitle: { fontSize: 13, fontWeight: 950, marginBottom: 8 },
  input: { width: "100%", padding: "10px 10px", borderRadius: 12, border: "1px solid #374151", background: "rgba(0,0,0,0.2)", color: "#f3f4f6", outline: "none" },
  btnPrimary: { width: "100%", padding: "12px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "linear-gradient(90deg, rgba(99,102,241,0.95), rgba(59,130,246,0.95))", color: "white", fontWeight: 950, cursor: "pointer" },
  btnSecondary: { width: "100%", padding: "10px 10px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", fontWeight: 900, cursor: "pointer" },
  listBox: { marginTop: 10, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, overflow: "hidden", maxHeight: 220, overflowY: "auto" },
  listItem: { width: "100%", textAlign: "left", padding: "10px 10px", background: "rgba(0,0,0,0.18)", border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#e5e7eb", cursor: "pointer" },
  mapCard: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(17,17,24,0.40)", overflow: "hidden", display: "flex", flexDirection: "column" },
  mapHeader: { padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" },
  map: { height: 640, width: "100%", background: "#0f172a" },
};

function chip(active: boolean): React.CSSProperties {
  return {
    padding: "10px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: active ? "#f9fafb" : "rgba(0,0,0,0.20)",
    color: active ? "#111827" : "#e5e7eb",
    cursor: "pointer",
    fontWeight: 950,
  };
}
