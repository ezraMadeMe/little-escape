import React, { useEffect, useMemo, useRef, useState } from "react";
import type { EscapeAcceptance, EscapeCompletionPayload } from "../features/escape/model/types";
import { distanceM } from "../features/escape/model/geo";
import { formatClock } from "../shared/lib/format";
import type { LatLng } from "../shared/types/geo";
import { useIsMobile } from "../shared/hooks/useIsMobile";
import { buildKakaoDeeplink, buildKakaoWebLink } from "../features/kakaoMap/lib/links";
import type { Appointment } from "../features/appointment/model/types";
import type { TravelMode } from "../features/appointment/model/types";

const ARRIVE_THRESHOLD_M = 80;

export function EscapeRunPage(props: {
  acceptance: EscapeAcceptance;
  travelMode: TravelMode;
  missionText?: string;
  appointment: Appointment;
  onComplete: (completion: EscapeCompletionPayload) => void;
  onBack: () => void;
}) {
  const { acceptance } = props;

  const [now, setNow] = useState(() => Date.now());
  const [pos, setPos] = useState<LatLng | null>(null);
  const [arrivedAt, setArrivedAt] = useState<number | null>(null);

  const isMobile = useIsMobile();

  const openNav = () => {
    const url = isMobile
      ? buildKakaoDeeplink(props.acceptance.origin, props.acceptance.destination, props.travelMode)
      : buildKakaoWebLink(props.acceptance.origin, props.acceptance.destination);
  
    window.open(url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 8000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const dM = useMemo(() => {
    if (!pos) return null;
    return distanceM(pos, acceptance.destination);
  }, [pos, acceptance.destination]);

  const arrivedSetRef = useRef(false);
  useEffect(() => {
    if (arrivedSetRef.current) return;
    if (dM == null) return;
    if (dM <= ARRIVE_THRESHOLD_M) {
      arrivedSetRef.current = true;
      setArrivedAt(Date.now());
    }
  }, [dM]);

  const totalMs = now - acceptance.acceptedAt;
  const toArriveMs = arrivedAt ? arrivedAt - acceptance.acceptedAt : null;

  return (
    <div style={{ padding: 20 }}>
      <h2>EscapeRun</h2>

      <div style={{ marginTop: 8, opacity: 0.8 }}>
        목적지: <b>{acceptance.destinationName}</b>
      </div>

      <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800 }}>
        {formatClock(totalMs)}
      </div>

      <div style={{ marginTop: 8 }}>
        도착: {arrivedAt ? "✅ 기록됨" : "아직"}
        {dM != null ? ` (거리 약 ${Math.round(dM)}m)` : " (GPS 대기중)"}
      </div>

      <div style={{ marginTop: 14, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <div style={{ fontWeight: 700 }}>미션</div>
        <div style={{ marginTop: 6 }}>{props.missionText ?? "미션 준비중..."}</div>
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button onClick={openNav}>길찾기</button>
        <button onClick={props.onBack}>뒤로</button>
        <button
          onClick={() =>
            props.onComplete({
              acceptedAt: acceptance.acceptedAt,
              arrivedAt,
              completedAt: Date.now(),
              totalMs: Date.now() - acceptance.acceptedAt,
              toArriveMs,
            })
          }
        >
          완료
        </button>
      </div>
    </div>
  );
}
