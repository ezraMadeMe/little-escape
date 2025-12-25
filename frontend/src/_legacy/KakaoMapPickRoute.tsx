import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "./useIsMobile";

declare global {
  interface Window {
    kakao?: any;
  }
}

type Mode = "CAR" | "TRANSIT" | "WALK" | "BICYCLE";
type PickTarget = "ORIGIN" | "DEST";

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmt(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function buildDeeplink(oLat: number, oLng: number, dLat: number, dLng: number, mode: Mode) {
  // 앱(모바일) 딥링크
  const by =
    mode === "TRANSIT" ? "PUBLICTRANSIT" :
    mode === "WALK" ? "FOOT" :
    mode === "BICYCLE" ? "BICYCLE" : "CAR";

  return `kakaomap://route?sp=${oLat},${oLng}&ep=${dLat},${dLng}&by=${by}`;
}

function buildWebLink(oLat: number, oLng: number, dLat: number, dLng: number) {
  // 웹(데스크탑) 길찾기 링크: from/to 링크는 대부분 환경에서 잘 동작
  // (표기 이름은 임의)
  return `https://map.kakao.com/link/from/${encodeURIComponent("출발")},${oLat},${oLng}/to/${encodeURIComponent(
    "도착"
  )},${dLat},${dLng}`;
}

function loadKakaoSdk(appKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    // 이미 스크립트 태그가 있으면 그 로딩 완료를 기다림
    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Kakao SDK script load error")));
      return;
    }

    // services 라이브러리 포함 (키워드 검색/지오코딩에 필요)
    const script = document.createElement("script");
    script.dataset.kakaoSdk = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
      appKey
    )}&autoload=false&libraries=services`;
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


export default function KakaoMapPickRoute() {
  const appKey = import.meta.env.VITE_KAKAO_JS_KEY;
  const isMobile = useIsMobile();

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  const [sdkStatus, setSdkStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sdkError, setSdkError] = useState<string>("");

  const [mode, setMode] = useState<Mode>("CAR");
  const [pickTarget, setPickTarget] = useState<PickTarget>("ORIGIN");

  // 기본값: 서울 시청 → 남산타워
  const [oLat, setOLat] = useState("37.566295");
  const [oLng, setOLng] = useState("126.977945");
  const [dLat, setDLat] = useState("37.551169");
  const [dLng, setDLng] = useState("126.988227");

  const [keyword, setKeyword] = useState("");
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [searching, setSearching] = useState(false);

  const [carRoute, setCarRoute] = useState<null | { distanceM: number; durationSec: number; path: { lat: number; lng: number }[] }>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  const origin = useMemo(() => ({ lat: toNum(oLat), lng: toNum(oLng) }), [oLat, oLng]);
  const dest = useMemo(() => ({ lat: toNum(dLat), lng: toNum(dLng) }), [dLat, dLng]);

  const coordValid = useMemo(() => {
    const latOk = (v: number) => Number.isFinite(v) && v >= -90 && v <= 90;
    const lngOk = (v: number) => Number.isFinite(v) && v >= -180 && v <= 180;
    return latOk(origin.lat) && lngOk(origin.lng) && latOk(dest.lat) && lngOk(dest.lng);
  }, [origin, dest]);

  const deeplink = useMemo(() => {
    if (!coordValid) return "";
    return buildDeeplink(origin.lat, origin.lng, dest.lat, dest.lng, mode);
  }, [coordValid, origin, dest, mode]);

  const webLink = useMemo(() => {
    if (!coordValid) return "";
    return buildWebLink(origin.lat, origin.lng, dest.lat, dest.lng);
  }, [coordValid, origin, dest]);

  const layout = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        background: "#0b0b0f",
        color: "#f3f4f6",
        padding: isMobile ? 12 : 16,
        fontFamily: "system-ui",
      },
      shell: { maxWidth: isMobile ? "100%" : 1150, margin: "0 auto" },
      header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "baseline",
        gap: 12,
        flexDirection: isMobile ? "column" : "row",
      },
      grid: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "420px 1fr",
        gap: 14,
        marginTop: 14,
      },
      map: { height: isMobile ? 380 : 640, width: "100%", background: "#0f172a" },
      mapPane: {
        border: "1px solid #1f2937",
        borderRadius: 16,
        background: "rgba(17,24,39,0.4)",
        overflow: "hidden",
        marginTop: isMobile ? 12 : 0,
      },
    }),
    [isMobile]
  );

  async function fetchCarRoute() {
    if (sdkStatus !== "ready") return;
    if (!coordValid) return;
    if (mode !== "CAR") return;
  
    setRouteLoading(true);
    setRouteError("");
  
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
  
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
  
      // ApiResponse<T>라 data 안에 들어있음
      setCarRoute(json.data);
    } catch (e: any) {
      setCarRoute(null);
      setRouteError(e?.message ?? String(e));
    } finally {
      setRouteLoading(false);
    }
  }

  useEffect(() => {
    if (mode === "CAR") fetchCarRoute();
    else setCarRoute(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, origin.lat, origin.lng, dest.lat, dest.lng, sdkStatus]);
  
  // 1) SDK 로드 + 지도 생성 + 클릭 이벤트 연결
  useEffect(() => {
    if (!appKey) {
      setSdkStatus("error");
      setSdkError("VITE_KAKAO_JS_KEY가 없습니다. .env.local에 JavaScript 키를 넣어주세요.");
      return;
    }
    if (!mapEl.current) return;

    setSdkStatus("loading");
    loadKakaoSdk(appKey)
      .then(() => {
        if (!window.kakao?.maps) throw new Error("kakao.maps가 없습니다. (키/도메인 설정 확인)");

        window.kakao.maps.load(() => {
          const center = new window.kakao.maps.LatLng(origin.lat, origin.lng);
          const map = new window.kakao.maps.Map(mapEl.current, { center, level: 6 });
          mapRef.current = map;

          // 지도 클릭으로 출발/도착 설정
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

  // 2) 마커/직선 폴리라인 업데이트 + bounds 맞추기
  useEffect(() => {
    if (sdkStatus !== "ready") return;
    if (!coordValid) return;
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    const o = new window.kakao.maps.LatLng(origin.lat, origin.lng);
    const d = new window.kakao.maps.LatLng(dest.lat, dest.lng);

    // origin marker
    if (!originMarkerRef.current) {
      originMarkerRef.current = new window.kakao.maps.Marker({ position: o, draggable: true });
      originMarkerRef.current.setMap(map);

      window.kakao.maps.event.addListener(originMarkerRef.current, "dragend", () => {
        const p = originMarkerRef.current.getPosition();
        setOLat(String(p.getLat()));
        setOLng(String(p.getLng()));
      });
    } else {
      originMarkerRef.current.setPosition(o);
    }

    // dest marker
    if (!destMarkerRef.current) {
      destMarkerRef.current = new window.kakao.maps.Marker({ position: d, draggable: true });
      destMarkerRef.current.setMap(map);

      window.kakao.maps.event.addListener(destMarkerRef.current, "dragend", () => {
        const p = destMarkerRef.current.getPosition();
        setDLat(String(p.getLat()));
        setDLng(String(p.getLng()));
      });
    } else {
      destMarkerRef.current.setPosition(d);
    }

    const pathForLine =
    carRoute?.path?.length
      ? carRoute.path.map(p => new window.kakao.maps.LatLng(p.lat, p.lng))
      : [o, d];
  
    const line = new window.kakao.maps.Polyline({
        path: pathForLine,
        strokeWeight: 5,
        strokeOpacity: 0.85,
    });
  
    line.setMap(map);
    lineRef.current = line;

    const bounds = new window.kakao.maps.LatLngBounds();
    if (carRoute?.path?.length) {
      carRoute.path.forEach(p => bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng)));
    } else {
      bounds.extend(o); bounds.extend(d);
    }
    map.setBounds(bounds);    
  }, [sdkStatus, coordValid, origin, dest]);

  // 3) 장소 검색 (키워드)
  const searchPlaces = async () => {
    if (sdkStatus !== "ready") return;
    if (!window.kakao?.maps?.services) {
      alert("services 라이브러리가 로드되지 않았습니다. (libraries=services 확인)");
      return;
    }
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

  // 4) 검색 결과 클릭 → 출발/도착에 반영 + 지도 이동
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

    // 지도 중심 이동
    const map = mapRef.current;
    if (map && window.kakao?.maps) {
      map.setCenter(new window.kakao.maps.LatLng(lat, lng));
    }
  };

  const openKakao = () => {
    if (!coordValid) return;
    // 데스크탑은 웹 링크가 확실히 열림, 모바일은 딥링크를 우선 시도하는 UX도 가능
    window.open(webLink, "_blank", "noopener,noreferrer");
  };

  const copyDeeplink = async () => {
    if (!coordValid) return;
    try {
      await navigator.clipboard.writeText(deeplink);
      alert("딥링크 복사 완료!");
    } catch {
      alert("복사 실패. 아래 딥링크를 직접 복사하세요.\n\n" + deeplink);
    }
  };

  return (
    <div style={layout.page}>
      <div style={layout.shell}>
        <div style={layout.header}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>작은 일탈 · 출발/도착 선택 + 이동수단 전환</h1>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            SDK:{" "}
            {sdkStatus === "ready" ? <span style={{ color: "#34d399" }}>READY</span> :
             sdkStatus === "loading" ? <span style={{ color: "#fbbf24" }}>LOADING</span> :
             <span style={{ color: "#fb7185" }}>ERROR</span>}
          </div>
        </div>

        {sdkStatus === "error" && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.15)" }}>
            <b>SDK 오류</b>
            <div style={{ marginTop: 6, fontSize: 13, color: "#fecaca", whiteSpace: "pre-wrap" }}>{sdkError}</div>
          </div>
        )}

        <div style={layout.grid}>
          {/* Left */}
          <div style={{ border: "1px solid #1f2937", borderRadius: 16, padding: 12, background: "rgba(17,24,39,0.4)" }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>컨트롤</div>

            {/* Pick target */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>지도 클릭/검색 적용 대상</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                <button
                  onClick={() => setPickTarget("ORIGIN")}
                  style={chip(pickTarget === "ORIGIN")}
                >
                  출발 설정
                </button>
                <button
                  onClick={() => setPickTarget("DEST")}
                  style={chip(pickTarget === "DEST")}
                >
                  도착 설정
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                지도 클릭으로 {pickTarget === "ORIGIN" ? "출발" : "도착"}이 바뀜 · 마커 드래그로 미세 조정
              </div>
            </div>

            {/* Mode */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>이동수단</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                {(["CAR", "TRANSIT", "WALK", "BICYCLE"] as Mode[]).map((m) => (
                  <button key={m} onClick={() => setMode(m)} style={chip(mode === m)}>
                    {m === "CAR" ? "자차" : m === "TRANSIT" ? "대중교통" : m === "WALK" ? "도보" : "자전거"}
                  </button>
                ))}
              </div>
            </div>

            {/* Coordinates */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
              <div>
                <div style={label}>출발 lat</div>
                <input value={oLat} onChange={(e) => setOLat(e.target.value)} style={input} />
              </div>
              <div>
                <div style={label}>출발 lng</div>
                <input value={oLng} onChange={(e) => setOLng(e.target.value)} style={input} />
              </div>
              <div>
                <div style={label}>도착 lat</div>
                <input value={dLat} onChange={(e) => setDLat(e.target.value)} style={input} />
              </div>
              <div>
                <div style={label}>도착 lng</div>
                <input value={dLng} onChange={(e) => setDLng(e.target.value)} style={input} />
              </div>
            </div>
            {mode === "CAR" && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#9ca3af" }}>
                {routeLoading ? "경로 불러오는 중..." :
                routeError ? `경로 오류: ${routeError}` :
                carRoute ? `거리 ${carRoute.distanceM}m · 시간 ${Math.round(carRoute.durationSec/60)}분` :
                "경로 없음"}
            </div>
            )}

            <div style={{ marginTop: 8, fontSize: 12, color: coordValid ? "#34d399" : "#fb7185", fontWeight: 800 }}>
              {coordValid ? "좌표 OK" : "좌표 오류"}
            </div>

            {/* Search */}
            <div style={{ marginTop: 12, borderTop: "1px solid #1f2937", paddingTop: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>장소 검색</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") searchPlaces(); }}
                  placeholder="예) 서울시청, 강남역, 성수 카페"
                  style={{ ...input, flex: 1 }}
                />
                <button onClick={searchPlaces} style={btn} disabled={searching || sdkStatus !== "ready"}>
                  {searching ? "검색중" : "검색"}
                </button>
              </div>

              {places.length > 0 && (
                <div style={{ marginTop: 10, maxHeight: 220, overflow: "auto", border: "1px solid #374151", borderRadius: 12 }}>
                  {places.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPlace(p)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 10px",
                        background: "rgba(0,0,0,0.2)",
                        border: "none",
                        borderBottom: "1px solid #374151",
                        color: "#e5e7eb",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{p.place_name}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        {(p.road_address_name || p.address_name) || ""} · {fmt(toNum(p.y), toNum(p.x))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div style={{ marginTop: 12, borderTop: "1px solid #1f2937", paddingTop: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>길찾기 보기</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                지도 위 직선은 데모고, **실제 경로는 아래 버튼으로 카카오맵에서 확인**해.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginTop: 10 }}>
                <button onClick={openKakao} style={btn} disabled={!coordValid}>
                  카카오맵(웹) 열기
                </button>
                <button onClick={copyDeeplink} style={btn} disabled={!coordValid}>
                  딥링크 복사
                </button>
              </div>

              <div style={{ marginTop: 10, fontSize: 12 }}>
                <div style={{ color: "#9ca3af" }}>딥링크(앱)</div>
                <div style={{ wordBreak: "break-all" }}>{deeplink || "-"}</div>
                <div style={{ marginTop: 8, color: "#9ca3af" }}>웹 링크</div>
                <div style={{ wordBreak: "break-all" }}>{webLink || "-"}</div>
              </div>
            </div>
          </div>

          {/* Right: Map */}
          <div style={layout.mapPane}>
            <div style={{ padding: 12, borderBottom: "1px solid #1f2937", fontWeight: 900 }}>
              지도 (클릭해서 {pickTarget === "ORIGIN" ? "출발" : "도착"} 선택)
            </div>
            <div ref={mapEl} style={layout.map} />
            <div style={{ padding: 10, fontSize: 12, color: "#9ca3af", borderTop: "1px solid #1f2937" }}>
              출발: <span style={{ color: "#e5e7eb" }}>{fmt(origin.lat, origin.lng)}</span> · 도착:{" "}
              <span style={{ color: "#e5e7eb" }}>{fmt(dest.lat, dest.lng)}</span> · 모드:{" "}
              <span style={{ color: "#e5e7eb" }}>{mode}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const label: React.CSSProperties = { fontSize: 12, color: "#9ca3af", marginBottom: 4 };
const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid #374151",
  background: "rgba(0,0,0,0.2)",
  color: "#f3f4f6",
  outline: "none",
};
const btn: React.CSSProperties = {
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid #374151",
  background: "#f9fafb",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 900,
};

function chip(active: boolean): React.CSSProperties {
  return {
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid #374151",
    background: active ? "#f9fafb" : "rgba(0,0,0,0.2)",
    color: active ? "#111827" : "#e5e7eb",
    cursor: "pointer",
    fontWeight: 900,
  };
}
