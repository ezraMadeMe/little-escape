import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "./useIsMobile";

type LatLng = { lat: number; lng: number };

type Props = {
  // 수락 시각 (카드에서 accept한 순간)
  acceptedAt: number; // epoch ms
  origin: LatLng;
  destination: LatLng;
  destinationName?: string;

  // 도착 판정 반경 (미터)
  arrivalRadiusM?: number;

  // 완료 후 저장(나중에 백엔드 붙일 때)
  onSubmit?: (payload: {
    acceptedAt: number;
    arrivedAt: number | null;
    completedAt: number;
    totalMs: number;
    toArriveMs: number | null;
    rating: number;
    review: string;
    photos: File[];
    lastKnownLocation: LatLng | null;
  }) => void;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDuration(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

function formatClock(ts: number) {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

// Haversine distance (meters)
function distanceM(a: LatLng, b: LatLng) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function EscapeCompleteScreen({
  acceptedAt,
  origin,
  destination,
  destinationName = "목적지",
  arrivalRadiusM = 50,
  onSubmit,
}: Props) {
  const isMobile = useIsMobile();

  // GPS
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "watching" | "denied" | "error"
  >("idle");
  const [gpsError, setGpsError] = useState<string>("");
  const [current, setCurrent] = useState<LatLng | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);

  // timing
  const [now, setNow] = useState<number>(Date.now());
  const [arrivedAt, setArrivedAt] = useState<number | null>(null);
  const [completedAt, setCompletedAt] = useState<number | null>(null);

  // post
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState<string>("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [toast, setToast] = useState<string>("");

  const watchIdRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const distToDestM = useMemo(() => {
    if (!current) return null;
    return Math.round(distanceM(current, destination));
  }, [current, destination]);

  const toArriveMs = useMemo(() => {
    if (!arrivedAt) return null;
    return arrivedAt - acceptedAt;
  }, [arrivedAt, acceptedAt]);

  const totalMs = useMemo(() => {
    if (!completedAt) return null;
    return completedAt - acceptedAt;
  }, [completedAt, acceptedAt]);

  const layout = useMemo(() => {
    return {
      page: { ...S.page, padding: isMobile ? 12 : 16 },
      shell: { ...S.shell, maxWidth: isMobile ? "100%" : 1100 },
      header: {
        ...S.header,
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "flex-end",
      },
      rightBadges: {
        ...S.rightBadges,
        width: isMobile ? "100%" : undefined,
        marginTop: isMobile ? 6 : 0,
      },
      grid: { ...S.grid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" },
      kv: { ...S.kv, gridTemplateColumns: isMobile ? "94px 1fr" : "110px 1fr" },
      gpsRow: {
        ...S.gpsRow,
        gridTemplateColumns: isMobile ? "94px 1fr" : "110px 1fr",
      },
      thumbGrid: {
        ...S.thumbGrid,
        gridTemplateColumns: isMobile
          ? "repeat(auto-fit, minmax(90px, 1fr))"
          : "repeat(3, 1fr)",
      },
      completeBtn: {
        ...S.completeBtn,
        fontSize: isMobile ? 14 : 15,
      },
      rowBetween: {
        ...S.rowBetween,
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
      },
    };
  }, [isMobile]);

  // 1초 타이머 (UI용)
  useEffect(() => {
    tickRef.current = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  // GPS watch 시작
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }

    setGpsStatus("watching");
    setGpsError("");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrent(loc);
        setAccuracyM(pos.coords.accuracy ?? null);

        // 도착 판정 (아직 도착 안 했을 때만)
        if (!arrivedAt) {
          const d = distanceM(loc, destination);
          // 정확도가 너무 낮으면(예: 200m) 오판 가능 → 정확도도 함께 고려
          const acc = pos.coords.accuracy ?? 9999;
          const okAccuracy = acc <= 80; // 필요하면 조정
          if (d <= arrivalRadiusM && okAccuracy) {
            const ts = Date.now();
            setArrivedAt(ts);
            setToast(`도착! 일탈까지 ${formatDuration(ts - acceptedAt)} 🎉`);
          }
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("denied");
          setGpsError("위치 권한이 거부되었습니다. 권한을 허용해야 도착 시간을 자동 기록할 수 있어요.");
        } else {
          setGpsStatus("error");
          setGpsError(err.message || "GPS 오류");
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination.lat, destination.lng]);

  // 완료 버튼
  const complete = () => {
    const ts = Date.now();
    setCompletedAt(ts);

    const total = ts - acceptedAt;
    setToast(`총 ${formatDuration(total)}의 일탈 성공! 🥳`);

    // GPS 더 이상 안 봐도 되면 끄기
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // 콜백(나중에 백엔드 저장)
    onSubmit?.({
      acceptedAt,
      arrivedAt,
      completedAt: ts,
      totalMs: total,
      toArriveMs: arrivedAt ? arrivedAt - acceptedAt : null,
      rating,
      review,
      photos,
      lastKnownLocation: current,
    });
  };

  const onPickPhotos = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5); // 최대 5장
    setPhotos(arr);
  };

  const arrivedInfo = arrivedAt
    ? `도착 시각 ${formatClock(arrivedAt)} · 일탈까지 ${formatDuration(arrivedAt - acceptedAt)}`
    : "아직 도착 기록이 없어요 (도착하면 자동 기록)";

  const completeInfo = completedAt
    ? `완료 시각 ${formatClock(completedAt)} · 총 ${formatDuration(completedAt - acceptedAt)}`
    : `진행 중 · 경과 ${formatDuration(now - acceptedAt)}`;

  return (
    <div style={layout.page}>
      <div style={layout.shell}>
        <div style={layout.header}>
          <div>
            <div style={S.title}>일탈 진행</div>
            <div style={S.subTitle}>
              목적지: <b>{destinationName}</b> · 반경 {arrivalRadiusM}m 이내(정확도 기준 포함)면 도착으로 기록
            </div>
          </div>
          <div style={layout.rightBadges}>
            <span style={S.badge}>GPS: {gpsStatus.toUpperCase()}</span>
            <span style={S.badgeMuted}>로그인/DB 없이 데모</span>
          </div>
        </div>

        {toast && (
          <div style={S.toast}>
            <span>{toast}</span>
            <button style={S.toastClose} onClick={() => setToast("")}>×</button>
          </div>
        )}

        {gpsError && (
          <div style={S.warn}>
            <b>GPS 안내</b>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{gpsError}</div>
          </div>
        )}

        <div style={layout.grid}>
          {/* LEFT: status */}
          <section style={S.card}>
            <div style={S.sectionTitle}>상태</div>

            <div style={layout.kv}>
              <div style={S.k}>수락 시각</div>
              <div style={S.v}>{formatClock(acceptedAt)}</div>
            </div>

            <div style={layout.kv}>
              <div style={S.k}>도착 상태</div>
              <div style={S.v}>{arrivedInfo}</div>
            </div>

            <div style={layout.kv}>
              <div style={S.k}>완료 상태</div>
              <div style={S.v}>{completeInfo}</div>
            </div>

            <div style={S.hr} />

            <div style={S.sectionTitle}>GPS</div>
            <div style={S.gpsBox}>
              <div style={layout.gpsRow}>
                <div style={S.k}>현재 위치</div>
                <div style={S.v}>
                  {current ? `${current.lat.toFixed(6)}, ${current.lng.toFixed(6)}` : "—"}
                </div>
              </div>
              <div style={layout.gpsRow}>
                <div style={S.k}>정확도</div>
                <div style={S.v}>{accuracyM != null ? `${Math.round(accuracyM)}m` : "—"}</div>
              </div>
              <div style={layout.gpsRow}>
                <div style={S.k}>목적지까지</div>
                <div style={S.v}>{distToDestM != null ? `${distToDestM}m` : "—"}</div>
              </div>
            </div>

            <div style={S.hr} />

            <button
              style={layout.completeBtn}
              onClick={complete}
              disabled={completedAt != null}
              title={completedAt ? "이미 완료됨" : ""}
            >
              일탈 완료 ✅
            </button>

            <div style={S.help}>
              팁: 도착은 “반경 + 정확도”로 자동 판정돼. 실내/지하철은 정확도가 떨어져서 도착이 늦게 찍힐 수 있어.
            </div>
          </section>

          {/* RIGHT: 후기/사진 */}
          <section style={S.card}>
            <div style={S.sectionTitle}>사진 & 후기</div>

            <div style={layout.rowBetween}>
              <div style={S.k}>만족도</div>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={S.k}>후기</div>
              <textarea
                style={S.textarea}
                placeholder="오늘의 작은 일탈은 어땠어?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
              <div style={S.miniHelp}>
                완료 버튼을 누르기 전/후 상관없이 작성 가능. (나중에 저장 API 붙이면 여기서 업로드)
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={layout.rowBetween}>
                <div style={S.k}>사진 업로드 (최대 5장)</div>
                <div style={S.miniHelp}>{photos.length}/5</div>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => onPickPhotos(e.target.files)}
                style={S.file}
              />

              {photos.length > 0 && (
                <div style={layout.thumbGrid}>
                  {photos.map((f, i) => {
                    const url = URL.createObjectURL(f);
                    return (
                      <div key={i} style={S.thumbItem}>
                        <img src={url} alt={f.name} style={S.thumbImg} />
                        <div style={S.thumbName} title={f.name}>{f.name}</div>
                        <button
                          style={S.thumbRemove}
                          onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                          title="삭제"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={S.hr} />

            <div style={S.summary}>
              <div style={{ fontWeight: 950 }}>요약</div>
              <div style={{ marginTop: 6, color: "#a1a1aa", fontSize: 13, lineHeight: 1.5 }}>
                {arrivedAt
                  ? `일탈까지 ${formatDuration(arrivedAt - acceptedAt)} 걸렸고,`
                  : `아직 도착 기록이 없고,`}
                {completedAt
                  ? ` 총 ${formatDuration(completedAt - acceptedAt)}의 일탈을 완료했어.`
                  : ` 지금까지 ${formatDuration(now - acceptedAt)} 진행 중이야.`}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          style={{
            ...S.star,
            opacity: i <= value ? 1 : 0.35,
          }}
          aria-label={`${i}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#07070b", color: "#f3f4f6", fontFamily: "system-ui", padding: 16 },
  shell: { maxWidth: 1100, margin: "0 auto" },

  header: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-end", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 950 },
  subTitle: { marginTop: 6, fontSize: 13, color: "#a1a1aa", lineHeight: 1.4 },
  rightBadges: { display: "flex", gap: 8, flexWrap: "wrap" },

  badge: { fontSize: 12, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)" },
  badgeMuted: { fontSize: 12, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.10)", color: "#a1a1aa", background: "rgba(0,0,0,0.15)" },

  toast: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(17,17,24,0.75)",
    marginBottom: 12,
  },
  toastClose: {
    border: "none",
    background: "transparent",
    color: "#e5e7eb",
    fontSize: 18,
    cursor: "pointer",
    padding: 4,
  },

  warn: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(251,113,133,0.30)",
    background: "rgba(251,113,133,0.08)",
    marginBottom: 12,
  },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },

  card: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(17,17,24,0.55)",
    padding: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  sectionTitle: { fontSize: 14, fontWeight: 950, marginBottom: 10 },

  kv: { display: "grid", gridTemplateColumns: "110px 1fr", gap: 10, padding: "8px 0" },
  k: { fontSize: 12, color: "#a1a1aa" },
  v: { fontSize: 13, color: "#e5e7eb", lineHeight: 1.45 },

  gpsBox: { borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.18)", padding: 12 },
  gpsRow: { display: "grid", gridTemplateColumns: "110px 1fr", gap: 10, padding: "6px 0" },

  hr: { height: 1, background: "rgba(255,255,255,0.08)", margin: "12px 0" },

  completeBtn: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(90deg, rgba(34,197,94,0.95), rgba(59,130,246,0.95))",
    color: "white",
    fontWeight: 950,
    cursor: "pointer",
  },

  help: { marginTop: 10, fontSize: 12, color: "#a1a1aa", lineHeight: 1.4 },

  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  star: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fbbf24",
    padding: "8px 10px",
    fontWeight: 900,
    cursor: "pointer",
  },

  textarea: {
    width: "100%",
    marginTop: 6,
    minHeight: 140,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    color: "#e5e7eb",
    outline: "none",
    resize: "vertical",
  },
  miniHelp: { marginTop: 6, fontSize: 12, color: "#71717a" },

  file: {
    width: "100%",
    marginTop: 8,
    padding: 10,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    color: "#e5e7eb",
  },

  thumbGrid: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  thumbItem: {
    position: "relative",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: 110, objectFit: "cover" },
  thumbName: { padding: "8px 10px", fontSize: 12, color: "#a1a1aa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  thumbRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.35)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: 900,
  },

  summary: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  },
};
