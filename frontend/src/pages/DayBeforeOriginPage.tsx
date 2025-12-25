import React, { useMemo, useState } from "react";
import type { Appointment } from "../features/appointment/model/types";
import type { LatLng } from "../shared/types/geo";

export function DayBeforeOriginPage(props: {
  appointment: Appointment;
  onBack: () => void;
  onNext: (origin: LatLng) => void;
}) {
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [loading, setLoading] = useState(false);

  const manualValid = useMemo(() => {
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }, [manualLat, manualLng]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치를 지원하지 않아.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        props.onNext({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLoading(false);
        alert("위치 권한이 필요해. 또는 직접 지정으로 진행해줘.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const submitManual = () => {
    if (!manualValid) return;
    props.onNext({ lat: Number(manualLat), lng: Number(manualLng) });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>전날 준비</h2>
      <div style={{ marginTop: 6, opacity: 0.75 }}>
        내일 약속이야. 먼저 <b>출발 위치</b>를 정해줘.
      </div>

      <div style={box}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>현재 위치</div>
        <button onClick={useCurrentLocation} disabled={loading} style={btnPrimary}>
          {loading ? "가져오는 중..." : "현재 위치로 설정"}
        </button>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
          * 후보군은 출발 위치를 기준으로 정리돼.
        </div>
      </div>

      <div style={box}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>직접 지정</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 420 }}>
          <input value={manualLat} onChange={(e) => setManualLat(e.target.value)} placeholder="lat" style={input} />
          <input value={manualLng} onChange={(e) => setManualLng(e.target.value)} placeholder="lng" style={input} />
        </div>
        <div style={{ marginTop: 10 }}>
          <button onClick={submitManual} disabled={!manualValid} style={btnOutline}>
            이 좌표로 설정
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
          예) 37.5665 / 126.9780
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={props.onBack}>뒤로</button>
      </div>
    </div>
  );
}

const box: React.CSSProperties = { marginTop: 14, padding: 12, border: "1px solid #ddd", borderRadius: 12 };
const input: React.CSSProperties = { padding: "10px 10px", borderRadius: 10, border: "1px solid #ddd" };
const btnPrimary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};
const btnOutline: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "#fff",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 900,
};
