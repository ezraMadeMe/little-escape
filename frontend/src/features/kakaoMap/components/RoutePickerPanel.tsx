import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "../../../shared/hooks/useIsMobile";
import type { LatLng } from "../../../shared/types/geo";
import { getKakaoJsKey } from "../lib/kakaoSdk";

declare global {
  interface Window {
    kakao?: any;
  }
}

type Mode = "CAR" | "TRANSIT" | "WALK" | "BICYCLE";
type PickTarget = "ORIGIN" | "DEST";

type PlaceItem = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
};

type PickMeta = {
  name?: string;
  address?: string;
};

export type CarRoute = {
  distanceM: number;
  durationSec: number;
  path: { lat: number; lng: number }[];
};

type Props = {
  origin: LatLng;
  destination: LatLng;

  onChangeOrigin?: (p: LatLng, meta?: PickMeta) => void;
  onChangeDestination: (p: LatLng, meta?: PickMeta) => void;

  /** 목적지 선택만 쓰고 싶으면 true */
  destinationOnly?: boolean;

  /** 패널 닫기 */
  onClose?: () => void;

  /** 이동수단 선택 UI 노출 */
  allowMode?: boolean;

  /** 검색 UI 노출 */
  allowSearch?: boolean;

  /** CAR일 때 /api/v1/routes/car 호출해서 path 폴리라인 표시 */
  enableCarRoute?: boolean;

  /** 외부에서 경로 데이터 필요하면 받아갈 수 있게 */
  onCarRouteChange?: (route: CarRoute | null) => void;
};

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmt(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function buildDeeplink(oLat: number, oLng: number, dLat: number, dLng: number, mode: Mode) {
  const by =
    mode === "TRANSIT" ? "PUBLICTRANSIT" :
    mode === "WALK" ? "FOOT" :
    mode === "BICYCLE" ? "BICYCLE" : "CAR";

  return `kakaomap://route?sp=${oLat},${oLng}&ep=${dLat},${dLng}&by=${by}`;
}

function buildWebLink(oLat: number, oLng: number, dLat: number, dLng: number) {
  return `https://map.kakao.com/link/from/${encodeURIComponent("출발")},${oLat},${oLng}/to/${encodeURIComponent(
    "도착"
  )},${dLat},${dLng}`;
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

    // ✅ 검색(Places)까지 쓰려면 services 필요
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

export function RoutePickerPanel(props: Props) {
  const appKey = getKakaoJsKey();
  const isMobile = useIsMobile();

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  const pickTargetRef = useRef<PickTarget>("DEST");

  const [sdkStatus, setSdkStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sdkError, setSdkError] = useState<string>("");

  const [mode, setMode] = useState<Mode>("CAR");
  const [pickTarget, setPickTarget] = useState<PickTarget>(props.destinationOnly ? "DEST" : "ORIGIN");

  const [keyword, setKeyword] = useState("");
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [searching, setSearching] = useState(false);

  const [carRoute, setCarRoute] = useState<CarRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  const [draftDest, setDraftDest] = useState<LatLng>(props.destination);
  const [draftMeta, setDraftMeta] = useState<PickMeta | undefined>(undefined);

    useEffect(() => {
    // 외부 목적지가 바뀌면 draft도 동기화
    setDraftDest(props.destination);
    }, [props.destination]);

  // pickTarget 최신값을 click listener가 참조할 수 있게 ref로 보관
  useEffect(() => {
    pickTargetRef.current = pickTarget;
  }, [pickTarget]);

  useEffect(() => {
    if (props.destinationOnly) setPickTarget("DEST");
  }, [props.destinationOnly]);

  const coordValid = useMemo(() => {
    const latOk = (v: number) => Number.isFinite(v) && v >= -90 && v <= 90;
    const lngOk = (v: number) => Number.isFinite(v) && v >= -180 && v <= 180;
    return (
      latOk(props.origin.lat) &&
      lngOk(props.origin.lng) &&
      latOk(props.destination.lat) &&
      lngOk(props.destination.lng)
    );
  }, [props.origin, props.destination]);

  const deeplink = useMemo(() => {
    if (!coordValid) return "";
    return buildDeeplink(
      props.origin.lat,
      props.origin.lng,
      props.destination.lat,
      props.destination.lng,
      mode
    );
  }, [coordValid, props.origin, props.destination, mode]);

  const webLink = useMemo(() => {
    if (!coordValid) return "";
    return buildWebLink(props.origin.lat, props.origin.lng, props.destination.lat, props.destination.lng);
  }, [coordValid, props.origin, props.destination]);

  // ✅ CAR 경로 호출
  async function fetchCarRoute() {
    if (!props.enableCarRoute) return;
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
          originLat: props.origin.lat,
          originLng: props.origin.lng,
          destLat: draftDest.lat,
          destLng: draftDest.lng,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();

      const route = (json.data ?? null) as CarRoute | null;
      setCarRoute(route);
      props.onCarRouteChange?.(route);
    } catch (e: any) {
      setCarRoute(null);
      props.onCarRouteChange?.(null);
      setRouteError(e?.message ?? String(e));
    } finally {
      setRouteLoading(false);
    }
  }

  useEffect(() => {
    if (mode === "CAR") fetchCarRoute();
    else {
      setCarRoute(null);
      props.onCarRouteChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, props.origin.lat, props.origin.lng, props.destination.lat, props.destination.lng, sdkStatus]);

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
          const center = new window.kakao.maps.LatLng(props.origin.lat, props.origin.lng);
          const map = new window.kakao.maps.Map(mapEl.current, { center, level: 6 });
          mapRef.current = map;

          // ✅ 지도 클릭으로 출발/도착 설정 (pickTargetRef로 최신값 참조)
          window.kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
            const latlng = mouseEvent.latLng;
            const lat = latlng.getLat();
            const lng = latlng.getLng();

            if (pickTargetRef.current === "ORIGIN") {
              props.onChangeOrigin?.({ lat, lng }, { name: "선택한 출발" });
            } else {
              setDraftDest({ lat, lng });
              setDraftMeta({ name: "선택한 목적지" });
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

  // 2) 마커/폴리라인 업데이트 + bounds
  useEffect(() => {
    if (sdkStatus !== "ready") return;
    if (!coordValid) return;
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    const o = new window.kakao.maps.LatLng(props.origin.lat, props.origin.lng);
    const d = new window.kakao.maps.LatLng(draftDest.lat, draftDest.lng);


    // origin marker
    if (!originMarkerRef.current) {
      originMarkerRef.current = new window.kakao.maps.Marker({ position: o, draggable: !props.destinationOnly });
      originMarkerRef.current.setMap(map);

      window.kakao.maps.event.addListener(originMarkerRef.current, "dragend", () => {
        if (props.destinationOnly) return;
        const p = originMarkerRef.current.getPosition();
        props.onChangeOrigin?.({ lat: p.getLat(), lng: p.getLng() }, { name: "드래그 출발" });
      });
    } else {
      originMarkerRef.current.setPosition(o);
      originMarkerRef.current.setDraggable(!props.destinationOnly);
    }

    // dest marker
    if (!destMarkerRef.current) {
      destMarkerRef.current = new window.kakao.maps.Marker({ position: d, draggable: true });
      destMarkerRef.current.setMap(map);

      window.kakao.maps.event.addListener(destMarkerRef.current, "dragend", () => {
        const p = destMarkerRef.current.getPosition();
        props.onChangeDestination({ lat: p.getLat(), lng: p.getLng() }, { name: "드래그 목적지" });
      });
    } else {
      destMarkerRef.current.setPosition(d);
    }

    // ✅ 기존 라인 제거(중첩 방지)
    if (lineRef.current) {
      lineRef.current.setMap(null);
      lineRef.current = null;
    }

    const pathForLine =
      carRoute?.path?.length
        ? carRoute.path.map((p) => new window.kakao.maps.LatLng(p.lat, p.lng))
        : [o, d];

    const line = new window.kakao.maps.Polyline({
      path: pathForLine,
      strokeWeight: 5,
      strokeOpacity: 0.85,
    });

    line.setMap(map);
    lineRef.current = line;

    const bounds = new window.kakao.maps.LatLngBounds();
    pathForLine.forEach((p: any) => bounds.extend(p));
    map.setBounds(bounds);
  }, [sdkStatus, coordValid, props.origin, props.destination, carRoute, props.destinationOnly]);

  // 3) 장소 검색
  const searchPlaces = async () => {
    if (!props.allowSearch) return;
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

  // 4) 검색 결과 적용
  const applyPlace = (p: PlaceItem) => {
    const lat = toNum(p.y);
    const lng = toNum(p.x);
    const name = p.place_name;
    const address = p.road_address_name || p.address_name;

    if (!props.destinationOnly && pickTarget === "ORIGIN") {
      props.onChangeOrigin?.({ lat, lng }, { name, address });
    } else {
      props.onChangeDestination({ lat, lng }, { name, address });
    }

    const map = mapRef.current;
    if (map && window.kakao?.maps) {
      map.setCenter(new window.kakao.maps.LatLng(lat, lng));
    }
  };

  const openKakaoWeb = () => {
    if (!coordValid) return;
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
    <div style={panelStyles.shell(isMobile)}>
      <div style={panelStyles.header}>
        <div style={{ fontWeight: 900 }}>목적지 직접 고르기</div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            SDK:{" "}
            {sdkStatus === "ready" ? (
              <span style={{ color: "#34d399" }}>READY</span>
            ) : sdkStatus === "loading" ? (
              <span style={{ color: "#fbbf24" }}>LOADING</span>
            ) : (
              <span style={{ color: "#fb7185" }}>ERROR</span>
            )}
          </div>
          {props.onClose && (
            <button style={panelStyles.btnGhost} onClick={props.onClose}>
              닫기
            </button>
          )}
        </div>
      </div>

      {sdkStatus === "error" && (
        <div style={panelStyles.errorBox}>
          <b>SDK 오류</b>
          <div style={{ marginTop: 6, fontSize: 13, color: "#fecaca", whiteSpace: "pre-wrap" }}>
            {sdkError}
          </div>
        </div>
      )}

      <div style={panelStyles.grid(isMobile)}>
        {/* Left controls */}
        <div style={panelStyles.controls}>
          {!props.destinationOnly && (
            <div style={{ marginBottom: 10 }}>
              <div style={panelStyles.label}>지도 클릭/검색 적용 대상</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={() => setPickTarget("ORIGIN")} style={chip(pickTarget === "ORIGIN")}>
                  출발
                </button>
                <button onClick={() => setPickTarget("DEST")} style={chip(pickTarget === "DEST")}>
                  도착
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                지도 클릭/검색 결과 적용 대상: {pickTarget === "ORIGIN" ? "출발" : "도착"}
              </div>
            </div>
          )}

          {props.allowMode && (
            <div style={{ marginBottom: 10 }}>
              <div style={panelStyles.label}>이동수단</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(["CAR", "TRANSIT", "WALK", "BICYCLE"] as Mode[]).map((m) => (
                  <button key={m} onClick={() => setMode(m)} style={chip(mode === m)}>
                    {m === "CAR" ? "자차" : m === "TRANSIT" ? "대중교통" : m === "WALK" ? "도보" : "자전거"}
                  </button>
                ))}
              </div>

              {props.enableCarRoute && mode === "CAR" && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#9ca3af" }}>
                  {routeLoading
                    ? "경로 불러오는 중..."
                    : routeError
                    ? `경로 오류: ${routeError}`
                    : carRoute
                    ? `거리 ${carRoute.distanceM}m · 시간 ${Math.round(carRoute.durationSec / 60)}분`
                    : "경로 없음"}
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: 12, color: coordValid ? "#34d399" : "#fb7185", fontWeight: 900 }}>
            {coordValid ? "좌표 OK" : "좌표 오류"}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af", lineHeight: 1.4 }}>
            출발: <span style={{ color: "#e5e7eb" }}>{fmt(props.origin.lat, props.origin.lng)}</span>
            <br />
            도착: <span style={{ color: "#e5e7eb" }}>{fmt(props.destination.lat, props.destination.lng)}</span>
          </div>

          {props.allowSearch && (
            <div style={{ marginTop: 12, borderTop: "1px solid #1f2937", paddingTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>장소 검색</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchPlaces();
                  }}
                  placeholder="예) 서울시청, 강남역"
                  style={{ ...panelStyles.input, flex: 1 }}
                />
                <button
                  onClick={searchPlaces}
                  style={panelStyles.btnPrimary}
                  disabled={searching || sdkStatus !== "ready"}
                >
                  {searching ? "검색중" : "검색"}
                </button>
              </div>

              {places.length > 0 && (
                <div style={panelStyles.listBox}>
                  {places.slice(0, 10).map((p) => (
                    <button key={p.id} onClick={() => applyPlace(p)} style={panelStyles.listItem}>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>{p.place_name}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        {(p.road_address_name || p.address_name) || ""} · {fmt(toNum(p.y), toNum(p.x))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 12, borderTop: "1px solid #1f2937", paddingTop: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>길찾기 보기</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              미리보기는 폴리라인 데모이고, 실제 길찾기는 카카오맵에서 확인.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              <button onClick={openKakaoWeb} style={panelStyles.btnPrimary} disabled={!coordValid}>
                카카오맵(웹) 열기
              </button>
              <button onClick={copyDeeplink} style={panelStyles.btnGhost} disabled={!coordValid}>
                딥링크 복사
              </button>
            </div>
          </div>
        </div>

        {/* Right map */}
        <div style={panelStyles.mapPane}>
          <div style={panelStyles.mapHeader}>
            지도 (클릭해서 {props.destinationOnly ? "도착" : pickTarget === "ORIGIN" ? "출발" : "도착"} 선택)
          </div>
          <div ref={mapEl} style={panelStyles.map(isMobile)} />
        </div>
        <button
        style={panelStyles.btnPrimary}
        onClick={() => props.onChangeDestination(draftDest, draftMeta)}
        >
        이 목적지 적용
        </button>
      </div>
    </div>
  );
}

const panelStyles = {
  shell: (isMobile: boolean): React.CSSProperties => ({
    width: "100%",
    background: "#0b0b0f",
    color: "#f3f4f6",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: isMobile ? 12 : 14,
    fontFamily: "system-ui",
  }),
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  } as React.CSSProperties,
  grid: (isMobile: boolean): React.CSSProperties => ({
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "380px 1fr",
    gap: 12,
    marginTop: 12,
  }),
  controls: {
    border: "1px solid #1f2937",
    borderRadius: 14,
    padding: 12,
    background: "rgba(17,24,39,0.35)",
  } as React.CSSProperties,
  mapPane: {
    border: "1px solid #1f2937",
    borderRadius: 14,
    overflow: "hidden",
    background: "rgba(17,24,39,0.35)",
  } as React.CSSProperties,
  mapHeader: {
    padding: 10,
    borderBottom: "1px solid #1f2937",
    fontWeight: 900,
    fontSize: 13,
  } as React.CSSProperties,
  map: (isMobile: boolean): React.CSSProperties => ({
    height: isMobile ? 340 : 520,
    width: "100%",
    background: "#0f172a",
  }),
  label: { fontSize: 12, color: "#9ca3af", marginBottom: 6 } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid #374151",
    background: "rgba(0,0,0,0.2)",
    color: "#f3f4f6",
    outline: "none",
  } as React.CSSProperties,
  btnPrimary: {
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid #374151",
    background: "#f9fafb",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 900,
  } as React.CSSProperties,
  btnGhost: {
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid #374151",
    background: "rgba(0,0,0,0.2)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: 900,
  } as React.CSSProperties,
  listBox: {
    marginTop: 10,
    maxHeight: 220,
    overflow: "auto",
    border: "1px solid #374151",
    borderRadius: 12,
  } as React.CSSProperties,
  listItem: {
    width: "100%",
    textAlign: "left",
    padding: "10px 10px",
    background: "rgba(0,0,0,0.2)",
    border: "none",
    borderBottom: "1px solid #374151",
    color: "#e5e7eb",
    cursor: "pointer",
  } as React.CSSProperties,
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #7f1d1d",
    background: "rgba(127,29,29,0.15)",
  } as React.CSSProperties,
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
