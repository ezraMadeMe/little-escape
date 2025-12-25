import React, { useEffect, useMemo, useState } from "react";
import type { CreatePrepReq, PrepWithCandidatesRes, TravelMode } from "../features/appointment/model/types";
import { createPrep } from "../features/appointment/api/appointmentApi";

type LatLng = { lat: number; lng: number };

type Props = {
  appointmentId: string;
};

export default function PrepPage({ appointmentId }: Props) {
  const [travelMode, setTravelMode] = useState<TravelMode>("TRANSIT");
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PrepWithCandidatesRes | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => !!origin && !loading, [origin, loading]);

  useEffect(() => {
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoadingLoc(false);
      },
      () => setLoadingLoc(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  async function onCreatePrep(
    appointmentId: string, 
    originLat: number, 
    originLng: number) {
        if (!origin) return;
        setErr(null);
        setLoading(true);
    try {
        const res = await createPrep(
            appointmentId, {
                 travelMode: "TRANSIT",
                  originLat, 
                  originLng
                 });
        console.log("prep saved:", res.prep.id, "candidates:", res.candidates.length);
    } catch (e: any) {
        setErr(e?.message ?? "PREP 생성 실패");
    } finally {
        setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: "0 0 12px" }}>PREP (전날 준비)</h2>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 14, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>출발 위치</div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          {loadingLoc && "현재 위치 가져오는 중..."}
          {!loadingLoc && origin && `lat ${origin.lat.toFixed(5)}, lng ${origin.lng.toFixed(5)}`}
          {!loadingLoc && !origin && "위치 정보 없음"}
        </div>
      </div>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 14, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>이동수단</div>
        <select
          value={travelMode}
          onChange={(e) => setTravelMode(e.target.value as TravelMode)}
          style={{ width: "100%", padding: 12, borderRadius: 12 }}
        >
          <option value="WALK">도보</option>
          <option value="TRANSIT">대중교통</option>
          <option value="CAR">차량</option>
        </select>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>
          {travelMode === "WALK" && "근거리 위주 후보"}
          {travelMode === "TRANSIT" && "균형 추천"}
          {travelMode === "CAR" && "조금 먼 후보도 포함"}
        </div>
      </div>

      <button
        onClick={onCreatePrep}
        disabled={!canSubmit}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 14,
          border: "none",
          fontWeight: 800,
          opacity: canSubmit ? 1 : 0.5,
        }}
      >
        {loading ? "후보 생성 중..." : "후보 일정 생성하기"}
      </button>

      {err && <div style={{ marginTop: 12, color: "crimson", whiteSpace: "pre-wrap" }}>{err}</div>}

      {data && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>
            후보 {data.candidates.length}개 (일정 텍스트만 공개)
          </div>

          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
            prepId: {data.prep.id} / preparedAt: {new Date(data.prep.preparedAt).toLocaleString()}
          </div>

          {/* 가로 슬라이드 */}
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {data.candidates.map((c) => (
              <div
                key={c.id}
                style={{
                  minWidth: 280,
                  flex: "0 0 auto",
                  border: "1px solid #ddd",
                  borderRadius: 16,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{c.travel.summary}</div>

                {c.travel.lines?.length > 0 && (
                  <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 10 }}>
                    {c.travel.lines.map((l, idx) => (
                      <div key={idx}>
                        • {l.label} ({l.min}분)
                      </div>
                    ))}
                  </div>
                )}

                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {c.itineraryLines.map((line, idx) => (
                    <li key={idx} style={{ marginBottom: 6 }}>
                      {line}
                    </li>
                  ))}
                </ul>

                {/* ⚠️ 의도적으로 장소명/설명 없음 */}
                <div style={{ fontSize: 12, opacity: 0.55, marginTop: 10 }}>
                  point: {c.point.lat.toFixed(4)}, {c.point.lng.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
