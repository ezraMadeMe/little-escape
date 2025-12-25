import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "../shared/hooks/useIsMobile";
import { getKakaoJsKey } from "../features/kakaoMap/lib/kakaoSdk";

declare global {
  interface Window {
    kakao?: any;
  }
}

type Mode = "CAR" | "TRANSIT" | "WALK" | "BICYCLE";

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function loadKakaoMapSdk(appKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있으면 바로 resolve
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

function buildDeeplink(oLat: number, oLng: number, dLat: number, dLng: number, mode: Mode) {
  const by =
    mode === "TRANSIT" ? "PUBLICTRANSIT" :
    mode === "WALK" ? "FOOT" :
    mode === "BICYCLE" ? "BICYCLE" : "CAR";
  return `kakaomap://route?sp=${oLat},${oLng}&ep=${dLat},${dLng}&by=${by}`;
}

export default function KakaoMapOneScreen() {
  const appKey = getKakaoJsKey();
  const isMobile = useIsMobile();

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const lineRef = useRef<any>(null);

  const [mode, setMode] = useState<Mode>("CAR");
  const [oLat, setOLat] = useState("37.566295");
  const [oLng, setOLng] = useState("126.977945");
  const [dLat, setDLat] = useState("37.551169");
  const [dLng, setDLng] = useState("126.988227");

  const [sdkStatus, setSdkStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [sdkError, setSdkError] = useState<string>("");

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

  const layout = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        background: "#0b0b0f",
        color: "#f3f4f6",
        padding: isMobile ? 12 : 16,
        fontFamily: "system-ui",
      },
      shell: { maxWidth: isMobile ? "100%" : 1100, margin: "0 auto" },
      header: {
        display: "flex",
        alignItems: isMobile ? "flex-start" : "baseline",
        justifyContent: "space-between",
        gap: 12,
        flexDirection: isMobile ? "column" : "row",
      },
      grid: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "380px 1fr",
        gap: 14,
        marginTop: 14,
      },
      mapPane: {
        border: "1px solid #1f2937",
        borderRadius: 16,
        background: "rgba(17,24,39,0.4)",
        overflow: "hidden",
        marginTop: isMobile ? 12 : 0,
      },
      map: { height: isMobile ? 360 : 520, width: "100%", background: "#0f172a" },
    }),
    [isMobile]
  );

  // 1) SDK 로드 + 지도 생성
  useEffect(() => {
    if (!appKey) {
      setSdkStatus("error");
      setSdkError("VITE_KAKAO_JS_KEY가 없습니다. .env.local에 JavaScript 키를 넣어주세요.");
      return;
    }
    if (!mapEl.current) return;

    setSdkStatus("loading");
    loadKakaoMapSdk(appKey)
      .then(() => {
        if (!window.kakao || !window.kakao.maps) {
          throw new Error("kakao.maps가 없습니다. (키/도메인 설정 확인 필요)");
        }

        window.kakao.maps.load(() => {
          const center = new window.kakao.maps.LatLng(origin.lat, origin.lng);
          const map = new window.kakao.maps.Map(mapEl.current, { center, level: 6 });
          mapRef.current = map;
          setSdkStatus("ready");
        });
      })
      .catch((e: any) => {
        setSdkStatus("error");
        setSdkError(String(e?.message ?? e));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appKey]);

  // 2) 좌표 바뀌면 마커/선 업데이트
  useEffect(() => {
    if (sdkStatus !== "ready") return;
    if (!coordValid) return;
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    // clear markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // clear polyline
    if (lineRef.current) {
      lineRef.current.setMap(null);
      lineRef.current = null;
    }

    const o = new window.kakao.maps.LatLng(origin.lat, origin.lng);
    const d = new window.kakao.maps.LatLng(dest.lat, dest.lng);

    const oMarker = new window.kakao.maps.Marker({ position: o });
    const dMarker = new window.kakao.maps.Marker({ position: d });
    oMarker.setMap(map);
    dMarker.setMap(map);
    markersRef.current.push(oMarker, dMarker);

    // 데모용 직선 폴리라인
    const line = new window.kakao.maps.Polyline({
      path: [o, d],
      strokeWeight: 5,
      strokeOpacity: 0.85,
    });
    line.setMap(map);
    lineRef.current = line;

    // bounds fit
    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(o);
    bounds.extend(d);
    map.setBounds(bounds);
  }, [sdkStatus, coordValid, origin, dest]);

  return (
    <div style={layout.page}>
      <div style={layout.shell}>
        <div style={layout.header}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>작은 일탈 · 카카오맵 “확실히 뜨는” 한 화면</h1>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            SDK:{" "}
            {sdkStatus === "ready" ? <span style={{ color: "#34d399" }}>READY</span> :
             sdkStatus === "loading" ? <span style={{ color: "#fbbf24" }}>LOADING</span> :
             sdkStatus === "error" ? <span style={{ color: "#fb7185" }}>ERROR</span> : "IDLE"}
          </div>
        </div>

        {sdkStatus === "error" && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #7f1d1d", background: "rgba(127,29,29,0.15)" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>SDK 오류</div>
            <div style={{ fontSize: 13, color: "#fecaca", whiteSpace: "pre-wrap" }}>{sdkError}</div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#fca5a5" }}>
              체크: ① .env.local에 <b>JavaScript 키</b>가 맞는지 ② 카카오디벨로퍼스 플랫폼 Web에 <b>http://localhost:5173</b> 등록했는지
            </div>
          </div>
        )}

        <div style={layout.grid}>
          {/* Controls */}
          <div style={{ border: "1px solid #1f2937", borderRadius: 16, padding: 12, background: "rgba(17,24,39,0.4)" }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>입력</div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>이동수단</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                {(["CAR", "TRANSIT", "WALK", "BICYCLE"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      padding: "10px 10px",
                      borderRadius: 12,
                      border: "1px solid #374151",
                      background: mode === m ? "#f9fafb" : "rgba(0,0,0,0.2)",
                      color: mode === m ? "#111827" : "#e5e7eb",
                      cursor: "pointer",
                      fontWeight: 700
                    }}
                  >
                    {m === "CAR" ? "자차" : m === "TRANSIT" ? "대중교통" : m === "WALK" ? "도보" : "자전거"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>출발 lat</div>
                <input value={oLat} onChange={(e) => setOLat(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>출발 lng</div>
                <input value={oLng} onChange={(e) => setOLng(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>도착 lat</div>
                <input value={dLat} onChange={(e) => setDLat(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>도착 lng</div>
                <input value={dLng} onChange={(e) => setDLng(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: coordValid ? "#34d399" : "#fb7185", fontWeight: 700 }}>
              {coordValid ? "좌표 OK" : "좌표 오류(숫자 범위 확인)"}
            </div>

            <div style={{ marginTop: 10, border: "1px solid #374151", borderRadius: 12, padding: 10, background: "rgba(0,0,0,0.2)" }}>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>딥링크(앱)</div>
              <div style={{ marginTop: 6, fontSize: 12, wordBreak: "break-all" }}>{deeplink || "-"}</div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginTop: 10 }}>
                <button
                  disabled={!coordValid}
                  onClick={async () => {
                    if (!coordValid) return;
                    try {
                      await navigator.clipboard.writeText(deeplink);
                      alert("딥링크를 복사했어요!");
                    } catch {
                      alert("복사 실패. 아래 텍스트를 직접 복사하세요.\n\n" + deeplink);
                    }
                  }}
                  style={btnStyle(!coordValid)}
                >
                  딥링크 복사
                </button>

                <a
                  href={coordValid ? `https://map.kakao.com/link/to/목적지,${dest.lat},${dest.lng}` : undefined}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...btnStyle(!coordValid),
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  카카오맵 웹
                </a>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>
              <b>지도 안 뜨면</b><br />
              1) 카카오디벨로퍼스 Web 도메인에 <b>http://localhost:5173</b> 추가<br />
              2) 키가 <b>JavaScript 키</b>인지 확인<br />
              3) 브라우저 콘솔(Network)에 sdk.js 200 뜨는지 확인
            </div>
          </div>

          {/* Map */}
          <div style={layout.mapPane}>
            <div style={{ padding: 12, borderBottom: "1px solid #1f2937", fontWeight: 800 }}>지도</div>
            <div ref={mapEl} style={layout.map} />
            <div style={{ padding: 10, fontSize: 12, color: "#9ca3af", borderTop: "1px solid #1f2937" }}>
              {sdkStatus === "ready" ? "출발/도착 마커 + 데모 직선 폴리라인 표시 중" : "SDK 로딩 중이거나 오류 상태"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid #374151",
  background: "rgba(0,0,0,0.2)",
  color: "#f3f4f6",
  outline: "none",
};

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid #374151",
    background: disabled ? "rgba(0,0,0,0.15)" : "#f9fafb",
    color: disabled ? "#6b7280" : "#111827",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 800,
    pointerEvents: disabled ? "none" : "auto",
  };
}
